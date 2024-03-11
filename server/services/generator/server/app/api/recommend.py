import json
import random
import numpy as np
import pandas as pd

from typing import List
from flask import jsonify
from flask_restful import Resource, reqparse

from rl.segment import Segment
from ..static import generator
from ..common.const import InsightType
from ..common.utils import ChartTemplateConfiguration, fact2json, parse_freq
from ..common.entity import Insight


class GenerateRecommend(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('file_url', required=True, help="")
        parser.add_argument('time_field', required=True)
        parser.add_argument('task', required=False, type=int, default=-1)
        # for recommending
        parser.add_argument('previous', required=True, type=dict, action='append')
        # for not repeated
        parser.add_argument('current', required=False, type=dict)
        args = parser.parse_args()
        file_url = args['file_url']
        time_field = args['time_field']
        previous_insight = args['previous']
        current_insight = args['current']

        raw_df = pd.read_csv(file_url)
        data_length = len(raw_df)
        freq = parse_freq(raw_df, time_field)

        previous_insight = [
            Insight(type=InsightType[insight['chosen_insight']],
                    subspace=insight['location'],
                    breakdown=freq[0].name,
                    measure=insight['fields']) for insight in previous_insight
        ]
        if 'chosen_insight' in current_insight.keys():
            current_insight = Insight(type=InsightType[current_insight['chosen_insight']],
                                      subspace=current_insight['location'],
                                      breakdown=freq[0].name,
                                      measure=current_insight['fields'])
        else:
            current_insight = None

        recommend_list, action_list = generator.recommend_next(dataset=raw_df,
                                                               time_field=time_field,
                                                               current_insight=current_insight,
                                                               story_insights=previous_insight)
        return jsonify({'recommendList': self._wrap_result(recommend_list, action_list, time_field, file_url, data_length)})

    def _wrap_result(self, recommend_list: List[Insight], action_list, time_field, file_path, data_length):
        current = []
        for recommend, action in zip(recommend_list, action_list):
            recommend_output = {}
            config = ChartTemplateConfiguration(insight=recommend, time_field=time_field, file_path=file_path)
            recommend_output['spec'] = json.loads(fact2json(config, recommend.parameter))
            recommend_output['type'] = recommend.type.name
            recommend_output['captionId'] = int(np.random.choice([0, 1, 2]))
            recommend_output['block'] = []
            if len(recommend_output['spec']['fact']['subspace']) == 0:
                recommend_output['spec']['fact']['subspace'] = [0, data_length - 1]
            block_value = [{
                'start': recommend_output['spec']['fact']['subspace'][0],
                'end': recommend_output['spec']['fact']['subspace'][1]
            }]
            if recommend.type in [InsightType.similarity, InsightType.frequent_pattern, InsightType.seasonality]:
                block_value = [{
                    'start': recommend_output['spec']['fact']['focus'][0]['scope'][0],
                    'end': recommend_output['spec']['fact']['focus'][0]['scope'][1]
                }]
            for variable in recommend.measure:
                recommend_output['block'].append({'action': action.value, 'field': variable, 'value': block_value})
            current.append(recommend_output)
        return current
