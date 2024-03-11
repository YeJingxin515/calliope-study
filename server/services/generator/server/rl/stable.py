import copy
import queue
import time
from typing import List, Optional

import numpy as np
import pandas as pd
import torch
import torch.nn.functional as F
from gym import Env, spaces
from torch.utils.data import DataLoader

from app.common.const import ActionType, UNIVARIATE_INSIGHT, MULTIVARIATE_INSIGHT, InsightType, PandasTimeLabel
from app.common.entity import Insight
from app.common.utils import parse_freq
from app.logger import logger
from rl.miner import InsightMiner
from rl.segment import generate_segment_data, Segment

ACTION_REWARD = [
    1,  # type
    0.20,  # previous
    0.30,  # proceeding
    0.40,  # periodic
    0.35,  # variable
    0.9,  # expand
    0.9,  # narrow
    1,  # EOS
    1,  # unknown
]

INSIGHT_CORRELATION = [
    # sum of insights equals to one
    # aut  freq  m_di  m_ou  outs  seas  simi  tren  u_di  u_ot
    [0.00, 0.15, 0.25, 0.10, 0.01, 0.50, 0.15, 0.15, 0.10, 0.05],  # autocorrelation
    [0.00, 0.05, 0.10, 0.05, 0.05, 0.20, 0.35, 0.20, 0.20, 0.20],  # frequent pattern
    [0.00, 0.20, 0.05, 0.35, 0.05, 0.05, 0.15, 0.10, 0.30, 0.15],  # multivariate distribution
    [0.00, 0.10, 0.35, 0.05, 0.05, 0.05, 0.15, 0.20, 0.05, 0.50],  # multivariate outlier
    [0.00, 0.05, 0.25, 0.15, 0.01, 0.05, 0.10, 0.45, 0.40, 0.05],  # outstanding
    [0.50, 0.05, 0.05, 0.10, 0.05, 0.02, 0.35, 0.10, 0.20, 0.10],  # seasonality
    [0.00, 0.30, 0.10, 0.40, 0.05, 0.05, 0.05, 0.10, 0.20, 0.20],  # similarity
    [0.05, 0.20, 0.15, 0.20, 0.15, 0.10, 0.15, 0.05, 0.10, 0.30],  # trend
    [0.00, 0.30, 0.35, 0.05, 0.10, 0.20, 0.10, 0.15, 0.05, 0.05],  # univariate distribution
    [0.00, 0.05, 0.10, 0.35, 0.01, 0.25, 0.05, 0.30, 0.15, 0.10],  # univariate outlier
]

#                       aut  freq  m_di  m_ou  outs  seas  simi  tren  u_di  u_ot
INSIGHT_START_SCORE = [0.00, 0.10, 0.00, 0.00, 0.00, 0.15, 0.00, 0.15, 0.10, 0.15]
EXCLUSIVE_ACTION = {
    ActionType.Expand: ActionType.Narrow,
    ActionType.Narrow: ActionType.Expand,
    ActionType.Previous: ActionType.Proceeding,
    ActionType.Proceeding: ActionType.Previous
}
CHANGE_TYPE_ACTIONS = [ActionType.Expand, ActionType.Narrow, ActionType.Type]


def worker_init_fn(worker_id):
    np.random.seed(np.random.get_state()[1][0] + worker_id)


class State:

    def __init__(self, segment, insight, score, observation=None):
        self.segment: Segment = segment
        self.insight: Insight = insight
        self.score: float = score
        self.reward: float = 0
        self.observation: torch.Tensor = observation
        self.next_state = {}


class GymEnv(Env):

    def __init__(self,
                 dataset: pd.DataFrame = None,
                 time_field=None,
                 embedding_model=None,
                 nlp=None,
                 max_length=None,
                 aggregated_dataset=None):
        super(GymEnv, self).__init__()
        self.action_space = spaces.Discrete(7)
        self.observation_space = spaces.Box(-10, 10, shape=(1, 170))

        if dataset is None:
            return
        if aggregated_dataset is None:
            aggregated_dataset = dataset
        self.max_length = max_length
        self.embedding_model = embedding_model
        self.embedding_model.eval()

        self.embedding_model.batch_size = 1
        self.nlp = nlp

        self.time_field = time_field
        self.freq = parse_freq(dataset, time_field)
        self.raw_data = copy.deepcopy(dataset.drop(columns=[time_field]))
        self.normalized_data = dataset.drop(columns=[time_field]).apply(lambda x: (x - np.min(x)) / (np.max(x) - np.min(x)))
        self.aggregated_data = copy.deepcopy(aggregated_dataset.drop(columns=[time_field]))
        self.normalized_aggregated_data = aggregated_dataset.drop(
            columns=[time_field]).apply(lambda x: (x - np.min(x)) / (np.max(x) - np.min(x)))
        # all zero corner case
        for c in self.normalized_data.columns:
            if pd.isnull(self.normalized_data[c]).any():
                self.normalized_data[c] = self.raw_data[c]

        self.variable_embeddings = self._compute_variable_embedding(self.normalized_data.columns)
        self.dataset = generate_segment_data(self.normalized_data, self.freq)
        self.data_loader = DataLoader(self.dataset, batch_size=1, shuffle=True, worker_init_fn=worker_init_fn)
        self.data_iterator = iter(self.data_loader)

        self.episode: List[State] = []
        self.episode_action: List[ActionType] = []
        self.episode_counter = 0
        self.state = None

        self.miner = InsightMiner()
        self.miner.load('./insights.pkl')

    def reload(self, dataset: pd.DataFrame, time_field, embedding_model, nlp, max_length):
        self.__init__(dataset, time_field, embedding_model, nlp, max_length)

    def step_with_insight(self, insight):
        current_segment = Segment(freq=self.freq,
                                  variable=insight.measure,
                                  start=insight.subspace[0],
                                  end=insight.subspace[1],
                                  embedding=None,
                                  variable_embeddings=None)
        next_state = self.generate_state(current_segment, None, insight)

        self.episode.append(next_state)
        self.episode_action.append(ActionType(ActionType.Unknown))
        if next_state.segment is None:
            return None, 0, True, {}

        self.state = next_state
        reward = self.reward()
        logger.info(self.state.segment)
        logger.info('Choose insight: {}'.format(self.state.insight.type.name))
        return self.get_observation(), reward, len(self.episode) >= self.max_length, {}

    def step(self, action_num):
        """
        @param action_num:
        @return: observation, reward, done, info
        """
        logger.info('Step: {} Action: {}'.format(len(self.episode_action), ActionType(action_num).name))
        #
        next_state = self.state.next_state.get(ActionType(action_num), None)
        if next_state is None:
            next_state = self._act(ActionType(action_num))

        self.episode.append(next_state)
        self.episode_action.append(ActionType(action_num))
        if next_state.segment is None:
            return None, 0, True, {}

        self.state = next_state
        reward = self.reward()
        logger.info(self.state.segment)
        logger.info('Choose insight: {}'.format(self.state.insight.type.name))
        return self.get_observation(), reward, len(self.episode) >= self.max_length, {}

    def reset(self, mode='', **kwargs):
        if mode == 'insight':
            return self.reset_with_insight(kwargs.get('insight'))
        elif mode == 'optim':
            return self.reset_optim()
        else:
            return self.reset_train()

    def reset_with_insight(self, insight: Insight):
        self.episode = []
        self.episode_action = []
        self.state = None
        current_segment = Segment(freq=self.freq,
                                  variable=insight.measure,
                                  start=insight.subspace[0],
                                  end=insight.subspace[1],
                                  embedding=None,
                                  variable_embeddings=None)
        self.state = self.generate_state(current_segment, None, insight)
        if self.state.insight is None:
            return None
        self.episode.append(self.state)
        self.state.reward = 0
        return self.get_observation()

    def reset_optim(self):
        self.episode = []
        self.episode_action = []
        self.state = None
        start = time.time()
        start_states = queue.PriorityQueue()
        for data in self.data_loader:
            v, idx = data['variables'][0], data['segment_idx']
            current_segment = Segment(freq=self.freq,
                                      variable=data['variables'],
                                      start=self.dataset.metadata[v][idx],
                                      end=self.dataset.metadata[v][idx + 1],
                                      embedding=None,
                                      variable_embeddings=None)
            state = self.generate_state(current_segment, None)
            if state.segment is None or state.insight is None:
                continue
            self.episode.append(state)
            state.reward = state.score
            self.episode = self.episode[:-1]
            start_states.put((-state.reward, id(state), state))
            print('find one')
            if time.time() - start > 1:
                break
        self.state = start_states.get()[2]
        self.episode.append(self.state)
        logger.info(str(self.state.segment))
        logger.info('Choose insight: {}'.format(self.state.insight.type.name))
        return self.get_observation()

    def reset_train(self):
        logger.info('=' * 20)
        logger.info('State episode {}'.format(self.episode_counter))
        logger.info('=' * 20)
        self.episode = []
        self.episode_action = []
        self.state = None
        while self.state is None:
            try:
                data = next(self.data_iterator)
            except StopIteration:
                self.data_iterator = iter(self.data_loader)
                data = next(self.data_iterator)
            v, idx = data['variables'][0], data['segment_idx']
            current_segment = Segment(freq=self.freq,
                                      variable=data['variables'],
                                      start=self.dataset.metadata[v][idx],
                                      end=self.dataset.metadata[v][idx + 1],
                                      embedding=None,
                                      variable_embeddings=None)
            if self._is_all_same_value(current_segment):
                logger.info('all same value segment: {}'.format(current_segment))
                continue
            if current_segment.end - current_segment.start < 10:
                logger.info('too short segment: {}'.format(current_segment))
                continue
            self.state = self.generate_state(current_segment, None)
            if self.state.segment is None or self.state.insight is None:
                self.state = None
            else:
                self.episode.append(self.state)
        self.episode_counter += 1
        if self.episode_counter % 5000 == 0:
            self.miner.save('./insights.pkl')

        logger.info(str(self.state.segment))
        logger.info('Choose insight: {}'.format(self.state.insight.type.name))
        self.state.reward = self._reward_state()
        return self.get_observation()

    def reward(self):
        self.state.reward = self._reward_state()
        reward = self.state.reward - self.episode[-2].reward
        print('reward: {}'.format(reward))
        return reward

    def _reward_state(self) -> float:
        diversity = []
        unique_insight_type = {}
        significance_insight = []

        for i in range(len(self.episode)):
            for j in range(i + 1, len(self.episode)):
                diversity.append(1 - abs(
                    F.cosine_similarity(self.episode[i].segment.embedding.reshape(
                        (1, -1)), self.episode[j].segment.embedding.reshape((1, -1))).item()))
            unique_insight_type[self.episode[i].insight.type] = unique_insight_type.get(self.episode[i].insight.type, 0) + 1
            significance_insight.append(self.episode[i].score)

        diversity_cosine = np.mean(diversity) if len(diversity) > 0 else 0.3
        diversity_insight = 1 - np.exp(-0.2 * len(unique_insight_type.keys()) / len(self.episode))
        print('diversity: cosine: {} insight: {}'.format(diversity_cosine, diversity_insight))

        significance_insight = 3 * np.mean(significance_insight)
        print('significance: {}'.format(significance_insight))
        reward = diversity_insight + diversity_cosine + significance_insight
        return reward

    def get_observation(self):
        mined_insight = torch.zeros((1, 10))
        for state in self.episode:
            if str(state.segment) == str(self.state.segment):
                mined_insight[0][state.insight.type.value] = 1
        self.state.observation = torch.cat([self.state.segment.embedding.reshape((1, -1)), mined_insight], dim=1).reshape(
            (1, -1))
        return self.state.observation

    def valid_action_mask(self) -> np.ndarray:
        mask = np.ones((1, 7))
        span = self.state.segment.end - self.state.segment.start
        if self.state.segment.start - span < 0:
            mask[0][ActionType.Previous.value] = 0
        if self.state.segment.end + span > len(self._get_normalized_data(self.state.segment.freq[0])):
            mask[0][ActionType.Proceeding.value] = 0
        period = self._get_period(span)
        if self.state.segment.end + period > len(self._get_normalized_data(self.state.segment.freq[0])):
            mask[0][ActionType.Periodic.value] = 0
        if len(self.state.segment.variable) == 1:
            mask[0][ActionType.Narrow.value] = 0
        else:
            mask[0][ActionType.Expand.value] = 0
        # if self.state.segment.freq[0] == self.freq[0]:
        # else:
        # mask[0][ActionType.Deaggregate.value] = 0
        # mask[0][ActionType.Aggregate.value] = 0
        # if len(self.episode_action) > 0 and self.episode_action[-1] in EXCLUSIVE_ACTION.keys():
        #     mask[0][EXCLUSIVE_ACTION[self.episode_action[-1]].value] = 0

        for i in range(7):
            if mask[0][i] == 1:
                state = self._act(ActionType(i))
                if state.segment is None:
                    mask[0][i] = 0
                else:
                    self.state.next_state[ActionType(i)] = state
                    mask[0][i] = INSIGHT_CORRELATION[self.state.insight.type.value][state.insight.type.value]
                    if mask[0][i] != 0:
                        mask[0][i] = 0.5 - mask[0][i]

        logger.info('mask: {}'.format(mask))
        return mask

    def _act(self, action: ActionType) -> State:
        next_segment = self.state.segment.copy()
        span = self.state.segment.end - self.state.segment.start
        if action == ActionType.Type:
            pass
        elif action == ActionType.Previous:
            next_segment.start = int(self.state.segment.start - span)
            next_segment.end = self.state.segment.start
            next_segment.embedding = None
        elif action == ActionType.Proceeding:
            next_segment.start = self.state.segment.end
            next_segment.end = int(self.state.segment.end + span)
            next_segment.embedding = None
        elif action == ActionType.Periodic:
            period = self._get_period(span)
            next_segment.start = int(self.state.segment.start + period)
            next_segment.end = int(self.state.segment.end + period)
            next_segment.embedding = None
        elif action == ActionType.Variable:
            current_variable_embedding = self.state.segment.variable_embeddings
            next_vairable = self.state.segment.variable[0]
            max_similarity = 0
            for v, e in self.variable_embeddings.items():
                if v != self.state.segment.variable[0]:
                    if self._is_all_same_value_single(v, next_segment.start, next_segment.end, next_segment.freq[0]):
                        logger.info('variable action: skip all same variable {}'.format(v))
                        continue
                    similarity = F.cosine_similarity(current_variable_embedding, e)
                    if similarity > max_similarity:
                        next_vairable = v
                        max_similarity = similarity
            next_segment.variable = [next_vairable]
            next_segment.embedding = None
        elif action == ActionType.Expand:
            similarity = [(v, F.cosine_similarity(self.state.segment.variable_embeddings, e).item())
                          for v, e in self.variable_embeddings.items()]
            similarity = sorted(similarity, key=lambda kv: kv[1], reverse=True)
            next_segment.variable = [self.state.segment.variable[0]]
            for pair in similarity:
                if pair[0] != self.state.segment.variable[0]:
                    if self._is_all_same_value_single(pair[0], next_segment.start, next_segment.end, next_segment.freq[0]):
                        logger.info('variable action: skip all same variable {}'.format(pair[0]))
                        continue
                    next_segment.variable.append(pair[0])
                if len(next_segment.variable) == 3:
                    break
            next_segment.embedding = None
        elif action == ActionType.Narrow:
            next_segment.variable = [self.state.segment.variable[0]]
            next_segment.embedding = None
        elif action == ActionType.Aggregate:
            next_segment.freq = [self._get_large_freq(next_segment.freq), 1]
            next_segment.start = int(next_segment.start * len(self.aggregated_data) / len(self.raw_data))
            next_segment.end = int(next_segment.end * len(self.aggregated_data) / len(self.raw_data))
            next_segment.embedding = None
        elif action == ActionType.Deaggregate:
            next_segment.freq = self.freq
            next_segment.start = int(next_segment.start * len(self.raw_data) / len(self.aggregated_data))
            next_segment.end = int(next_segment.end * len(self.raw_data) / len(self.aggregated_data))
            next_segment.embedding = None
        else:
            raise Exception('Unsupported action: {}'.format(action))
        return self.generate_state(next_segment, action)

    def generate_state(self, segment: Segment, action: Optional[ActionType], insight: Optional[Insight] = None) -> State:
        if segment is None:
            return State(segment=None, insight=None, score=0)
        if self._is_all_same_value(segment):
            logger.info('mask all same value segment: {}'.format(str(segment)))
            return State(segment=None, insight=None, score=0)
        if segment.embedding is None:
            embedding = []
            for name in segment.variable:
                segment_data = self._get_normalized_data(segment.freq[0])[name][segment.start:segment.end].to_numpy()
                embedding.append(self.embedding_model.encode(torch.Tensor(segment_data).double().reshape((1, 1, -1))))
            segment.embedding = torch.mean(torch.cat(embedding), dim=0).unsqueeze(0)
        if segment.variable_embeddings is None:
            variable_embeddings = []
            for name in segment.variable:
                variable_embeddings.append(self.variable_embeddings[name])
            segment.variable_embeddings = torch.mean(torch.cat(variable_embeddings), dim=0).unsqueeze(0)
        if insight is None:
            insights = self.get_valid_insight(segment, action)
            scores = []
            weighted_scores = []
            for i in range(len(insights)):
                (insights[i], score) = self.miner.mine(self.raw_data.copy(), self.time_field, insights[i])
                if self.state is not None:
                    weighted_score = score * INSIGHT_CORRELATION[self.state.insight.type.value][insights[i].type.value]
                    logger.info('score: {}, weighted_score: {} insight: {}-{}'.format(score, weighted_score,
                                                                                      self.state.insight.type.name,
                                                                                      insights[i].type.name))
                else:
                    weighted_score = score * INSIGHT_START_SCORE[insights[i].type.value]
                weighted_scores.append(weighted_score)
                scores.append(score)
            if sum(scores) == 0:
                return State(segment=None, insight=None, score=0)
            max_score_idx = np.argmax(weighted_scores)
            return State(segment=segment, insight=insights[max_score_idx], score=scores[max_score_idx])
        else:
            (insight, score) = self.miner.mine(self._get_data(segment.freq[0]), self.time_field, insight)
            if score == 0:
                return State(segment=None, insight=None, score=0)
            else:
                return State(segment=segment, insight=insight, score=score)

    def get_valid_insight(self, segment: Segment, action: ActionType) -> List[Insight]:
        if len(segment.variable) == 1:
            valid_insight_type = copy.deepcopy(UNIVARIATE_INSIGHT)
        else:
            valid_insight_type = copy.deepcopy(MULTIVARIATE_INSIGHT)
        insights = []
        for insight_type in valid_insight_type:
            insight = Insight(type=insight_type,
                              subspace=[segment.start, segment.end],
                              breakdown=self.freq,
                              measure=segment.variable)
            if insight_type == InsightType.similarity:
                baseline = self.episode[-1].insight.measure[0]
                tmp = []
                for variable in insight.measure:
                    if variable != baseline:
                        tmp.append(variable)
                        insight.measure = [baseline] + tmp
            # filter repeated insight
            existed = False
            for state in self.episode:
                if str(state.insight) == str(insight):
                    existed = True
                    break
            if existed:
                continue

            if action is None:
                insights.append(insight)
                continue

            # filter insight type by action
            last_insight_type = self.episode[-1].insight.type
            if action not in CHANGE_TYPE_ACTIONS:
                if insight_type == last_insight_type:
                    insights.append(insight)
                else:
                    continue
            else:
                if insight_type != last_insight_type:
                    insights.append(insight)
                else:
                    continue
        return insights

    def _is_all_same_value(self, segment: Segment):
        for variable in segment.variable:
            data = self._get_data(segment.freq[0])[variable][segment.start:segment.end]
            if np.max(data) == np.min(data):
                return True
            normalized_data = self._get_data(segment.freq[0])[variable][segment.start:segment.end]
            if np.max(normalized_data) == np.min(normalized_data):
                return True
        return False

    def _is_all_same_value_single(self, variable, start, end, time_unit):
        if time_unit == self.freq[0]:
            data = self.raw_data[variable][start:end]
        else:
            data = self.aggregated_data[variable][start:end]
        return np.max(data) == np.min(data)

    def _compute_variable_embedding(self, variables):
        embeddings = {}
        for variable in variables:
            doc = self.nlp(variable.replace('_', ' '))
            embedding = doc[0].vector
            for i in range(1, len(doc)):
                embedding += doc[i].vector
            embeddings[variable] = torch.from_numpy(embedding).reshape((1, -1))
        return embeddings

    def _get_period(self, span):
        time_unit = self.freq[0]
        unit_num = self.freq[1] * span
        scale = 1
        while True:
            if time_unit == PandasTimeLabel.Millisecond:
                if unit_num >= 1000:
                    unit_num = unit_num // 1000
                    time_unit = PandasTimeLabel.Second
                    scale *= 1000
                else:
                    return (1000 * scale) // self.freq[1]
            elif time_unit == PandasTimeLabel.Second:
                if unit_num >= 60:
                    unit_num = unit_num // 60
                    time_unit = PandasTimeLabel.Minute
                    scale *= 60
                else:
                    return (60 * scale) // self.freq[1]
            elif time_unit == PandasTimeLabel.Minute:
                if unit_num >= 60:
                    unit_num = unit_num // 60
                    time_unit = PandasTimeLabel.Hour
                    scale *= 60
                else:
                    return (60 * scale) // self.freq[1]
            elif time_unit == PandasTimeLabel.Hour:
                if unit_num >= 24:
                    unit_num = unit_num // 24
                    time_unit = PandasTimeLabel.Day
                    scale *= 24
                else:
                    return (24 * scale) // self.freq[1]
            elif time_unit == PandasTimeLabel.Day:
                if unit_num >= 30:
                    unit_num = unit_num // 30
                    time_unit = PandasTimeLabel.Month
                    scale *= 30
                else:
                    return (30 * scale) // self.freq[1]
            elif time_unit == PandasTimeLabel.Month:
                if unit_num >= 12:
                    unit_num = unit_num // 12
                    time_unit = PandasTimeLabel.Year
                    scale *= 12
                else:
                    return (12 * scale) // self.freq[1]
            else:
                return (10 * scale) // self.freq[1]

    def _get_large_freq(self, freq):
        if freq[0] == PandasTimeLabel.Millisecond:
            return PandasTimeLabel.Second
        elif freq[0] == PandasTimeLabel.Second:
            return PandasTimeLabel.Minute
        elif freq[0] == PandasTimeLabel.Minute:
            return PandasTimeLabel.Hour
        elif freq[0] == PandasTimeLabel.Hour:
            return PandasTimeLabel.Day
        elif freq[0] == PandasTimeLabel.Day:
            return PandasTimeLabel.Month
        elif freq[0] == PandasTimeLabel.Month:
            return PandasTimeLabel.Year

    def _get_data(self, time_unit):
        if time_unit == self.freq[0]:
            return self.raw_data
        else:
            return self.aggregated_data

    def _get_normalized_data(self, time_unit):
        if time_unit == self.freq[0]:
            return self.normalized_data
        else:
            return self.normalized_aggregated_data

    def render(self, mode="human"):
        pass
