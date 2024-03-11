import json
import random
from typing import List

import numpy as np
import pandas as pd
from flask_restful import Resource, reqparse
from flask import jsonify

from ..static import generator
from ..common.entity import Insight
from ..common.utils import fact2json, ChartTemplateConfiguration
from ..common.const import ActionType, InsightType, PandasTimeLabel
from rl.miner import InsightMiner


class GenerateStory(Resource):
    def __init__(self) -> None:
        super().__init__()

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('path', required=True, help='')
        parser.add_argument('time_field', required=True)
        parser.add_argument('existing_insights', required=False, type=list, action='append', default=[])
        args = parser.parse_args()
        data_path = args['path']
        time_field = args['time_field']
        existing_insights = args['existing_insights']

        data = pd.read_csv(data_path)
        data_length = len(data)

        # experts = []
        # miner = InsightMiner()
        # actions = [-1] + [ActionType[expert['action'].capitalize()].value for expert in experts][:-1]
        # insights = [
        #     miner.mine(
        #         data.copy(), time_field,
        #         Insight(type=InsightType[expert['type']],
        #                 subspace=expert['subspace'],
        #                 breakdown=[PandasTimeLabel.Day, 1],
        #                 measure=expert['measure']))[0] for expert in experts
        # ]
        actions, insights = generator.generate_story(data, time_field, existing_insights)
        sequence = self._wrap_story_result(actions, insights, time_field, data_path, data_length)
        with open('response.json', 'w') as file:
            json.dump(sequence, file)
        return jsonify({'sequence': sequence})

    def _wrap_story_result(self, actions: List[int], story: List[Insight], time_field, data_path, data_length):
        output = []
        for i in range(len(actions)):
            current = {}
            current['action'] = actions[i]
            config = ChartTemplateConfiguration(insight=story[i], time_field=time_field, file_path=data_path)
            current['spec'] = json.loads(fact2json(config, story[i].parameter))
            current['type'] = story[i].type.name
            current['captionId'] = int(np.random.choice([0, 1, 2]))
            current['oriBlock'] = []
            current['breakdown'] = story[i].breakdown[0].name

            start = 0
            end = data_length - 1
            if len(current['spec']['fact']['subspace']) == 2:
                start = current['spec']['fact']['subspace'][0]
                end = current['spec']['fact']['subspace'][1]
            elif story[i].type in [InsightType.similarity, InsightType.frequent_pattern, InsightType.seasonality]:
                start = current['spec']['fact']['focus'][0]['scope'][0]
                end = current['spec']['fact']['focus'][0]['scope'][1]

            for variable in story[i].measure:
                current['oriBlock'].append({'field': variable, 'value': [{'start': start, 'end': end}]})
            current['recommendList'] = []
            output.append(current)
        return output
