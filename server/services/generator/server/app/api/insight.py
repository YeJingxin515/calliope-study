import json
from flask import jsonify
import pandas as pd

from flask_restful import Resource, reqparse
from ..common.const import InsightType, UNIVARIATE_INSIGHT, MULTIVARIATE_INSIGHT
from ..common.utils import ChartTemplateConfiguration, parse_freq, fact2json
from ..common.entity import Insight
from rl.miner import InsightMiner


class GenerateInsight(Resource):

    def post(self):

        parser = reqparse.RequestParser()
        parser.add_argument('file_url', required=True, help="")
        parser.add_argument('fields', required=True, type=str, action='append')
        parser.add_argument('time_field', required=True)
        parser.add_argument('location', required=True, type=int, action='append')
        parser.add_argument('insights', required=False, type=str, action='append', default=[])
        args = parser.parse_args()
        file_url = args['file_url']
        fields = args['fields']
        time_field = args['time_field']
        location = sorted(args['location'])
        raw_df = pd.read_csv(file_url)
        freq = parse_freq(raw_df, time_field)

        miner = InsightMiner()

        if len(args['insights']) > 0:
            to_find_insights = args['insights']
        else:
            if len(fields) == 1:
                to_find_insights = [i.name for i in UNIVARIATE_INSIGHT]
            else:
                to_find_insights = [i.name for i in MULTIVARIATE_INSIGHT]
        found_insights = []
        for i in to_find_insights:
            insight = Insight(
                type=InsightType[i],
                subspace=location,
                breakdown=freq,
                measure=fields
            )
            print('mine {}'.format(str(insight)))
            (insight, score) = miner.mine(raw_df, time_field, insight)
            if score > 0 and len(insight.parameter) > 0:
                config = ChartTemplateConfiguration(insight, time_field, file_url)
                spec = json.loads(fact2json(config, insight.parameter))
                found_insights.append({'spec': spec, 'type': spec['chart']['type'], 'action': -1})
                if len(args['insights']) > 0:
                    with open('user_study.txt', 'a') as file:
                        file.write(str(insight) + '\n')
        return jsonify({'insights': found_insights})
