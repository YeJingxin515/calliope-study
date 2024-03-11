import pandas as pd

from flask import jsonify
from flask_restful import Resource, abort, reqparse

from ..preprocessing.const import PandasTimeLabel
from ..preprocessing.utils import get_data_path_by_id, read_data
from ..model.dataset import Dataset
from ..db import db
from ..preprocessing.granularity import parse_granularity


class Metadata(Resource):
    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('path', required=True, location='args')
        args = parser.parse_args()
        file_path = args['path']

        file_id = file_path.split('/')[-1][:-4]

        dataset: Dataset = Dataset.query.filter_by(id=file_id).first()
        if dataset is None:
            abort(404)
        df = read_data(get_data_path_by_id(file_id))
        time_data = pd.to_datetime(df[dataset.time_field])
        time_unit, unit_num = parse_granularity(time_data[0], time_data[1])
        dataset.time_unit = time_unit
        dataset.unit_num = unit_num

        try:
            db.session.merge(dataset)
            db.session.commit()
        except Exception as e:
            raise RuntimeError(e)

        numerical_columns = []
        for column in df.columns:
            if column != dataset.time_field:
                numerical_columns.append(column)

        granularity = [dataset.time_unit]
        larger = False
        for gran in PandasTimeLabel:
            if larger:
                granularity.append(gran.name)
            if gran.name == time_unit:
                larger = True
        granularity.reverse()

        return jsonify({
            'columns': numerical_columns,
            'timeColumns': dataset.time_field,
            'granularity': granularity,
            'timeValues': df[dataset.time_field].values.tolist()
        })
