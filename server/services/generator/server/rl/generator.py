import time
from collections import namedtuple
from typing import List

import numpy as np
import spacy
from app.common.entity import Insight
from app.common.const import InsightType, ActionType


class StoryGenerator:
    def __init__(self, embedding_model=None, story_model=None) -> None:
        self.embedding_model = embedding_model
        self.story_model = story_model
        self.nlp = spacy.load('en_core_web_md')

    def generate_story(self, dataset, time_field, existing_insights=[]):
        self.story_model.env.reload(dataset=dataset,
                                    time_field=time_field,
                                    embedding_model=self.embedding_model,
                                    nlp=self.nlp,
                                    max_length=6)
        episode_start = np.array([True])
        if len(existing_insights) == 0:
            obs = self.story_model.env.reset(mode='optim')
        else:
            insights = []
            for insight in existing_insights:
                insights.append(
                    Insight(type=InsightType[insight[0]['insight']],
                            measure=[i['field'] for i in insight],
                            subspace=[insight[0]['value'][0]['start'], insight[0]['value'][0]['end']],
                            breakdown=self.story_model.env.freq))
            existing_insights = insights
            obs = self.story_model.env.reset(mode='insight', insight=insights[0])
            if obs is None:
                return [], []

        _state = None
        actions = [-1]
        for i in range(6 + len(existing_insights)):
            action, _state = self.story_model.policy.predict(obs,
                                                             state=_state,
                                                             episode_start=episode_start,
                                                             deterministic=True,
                                                             action_masks=self.story_model.env.valid_action_mask())
            episode_start = np.array([False])
            if i < len(existing_insights) - 1:
                actions.append(-1)
                obs, reward, done, info = self.story_model.env.step_with_insight(existing_insights[i + 1])
            else:
                actions.append(int(action))
                obs, reward, done, info = self.story_model.env.step(action)
            if done:
                break

        return actions, [state.insight for state in self.story_model.env.episode]

    def recommend_next(self, dataset, time_field, current_insight: Insight, story_insights: List[Insight] = []):
        env = self.story_model.env
        env.reload(dataset=dataset, time_field=time_field, embedding_model=self.embedding_model, nlp=self.nlp, max_length=8)
        episode_start = np.array([True])

        obs = env.reset(mode='insight', insight=story_insights[0])
        if obs is None:
            return [], []

        _state = None
        for i in range(max(1, len(story_insights) - 3), len(story_insights)):
            _, _state = self.story_model.policy.predict(obs,
                                                        state=_state,
                                                        episode_start=episode_start,
                                                        deterministic=True,
                                                        action_masks=env.valid_action_mask())
            episode_start = np.array([False])
            obs, reward, done, info = env.step_with_insight(story_insights[i])
            if done:
                return [], []

        probs = self.story_model.policy.predict_prob(obs,
                                                     episode_start=episode_start,
                                                     deterministic=True,
                                                     action_masks=env.valid_action_mask())
        if story_insights[-1].type == InsightType.similarity:
            print('success')
            probs[0] = 1
        recommend_list, action_list = [], []
        start = time.time()
        for i in np.argsort(-probs):
            next_action = ActionType(i)
            next_state = env.state.next_state.get(next_action, None)
            if next_state is None or probs[i] == 0:
                continue
            if current_insight and next_state.segment.variable == current_insight.measure and next_state.segment.start == \
                    current_insight.subspace[0] and next_state.segment.end == current_insight.subspace[1]:
                next_action = None
                continue

            valid_insights = env.get_valid_insight(env.state.next_state[next_action].segment, next_action)
            scores = [0] * len(valid_insights)
            for j in range(len(valid_insights)):
                if current_insight and str(valid_insights[j]) == str(current_insight):
                    continue
                (valid_insights[j], scores[j]) = env.miner.mine(env.raw_data.copy(), env.time_field, valid_insights[j])
                if time.time() - start > 3:
                    break
            for s in np.argsort(scores)[::-1]:
                if scores[s] == 0:
                    continue
                recommend_list.append(valid_insights[s])
                action_list.append(ActionType(s))
                if len(recommend_list) > 5:
                    break
            if time.time() - start > 3:
                break

        return recommend_list, action_list
