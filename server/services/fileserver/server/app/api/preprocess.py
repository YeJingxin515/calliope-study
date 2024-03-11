import uuid
import pandas as pd

from flask_restful import Resource, reqparse
from ..model.dataset import Dataset
from ..preprocessing.utils import read_data, get_data_path_by_id
from ..preprocessing.const import PandasTimeLabel
from ..flask_uploads import UploadSet, DATA
from ..db import db

upload = UploadSet('data', DATA)


class Preprocess(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('path', required=True)
        parser.add_argument('start', required=True, type=int)
        parser.add_argument('end', required=True, type=int)
        parser.add_argument('variable', required=True, type=str, action='append')
        parser.add_argument('aggregate', required=True)
        args = parser.parse_args()
        file_path = args['path']
        start = args['start']
        end = args['end']
        variable = args['variable']
        aggregate = args['aggregate']
        file_id = file_path.split('/')[-1][:-4]

        dataset: Dataset = Dataset.query.filter_by(id=file_id).first()

        df = read_data(get_data_path_by_id(file_id))

        variable.append(dataset.time_field)
        new_df = df[variable][start:end]
        new_df[dataset.time_field] = pd.to_datetime(new_df[dataset.time_field])
        new_df = new_df.set_index(dataset.time_field, drop=False)

        # if PandasTimeLabel[aggregate] != PandasTimeLabel[dataset.time_unit]:
        #     new_df = new_df.resample(PandasTimeLabel[aggregate].value).mean().fillna(0)
        #     new_df.reset_index(inplace=True)
        new_df[dataset.time_field] = new_df[dataset.time_field].astype(str)

        new_dataset = Dataset()
        new_dataset.id = uuid.uuid4().hex
        new_dataset.name = dataset.name
        new_dataset.time_field = dataset.time_field
        new_dataset.time_unit = PandasTimeLabel[aggregate].name

        larger = False
        for gran in PandasTimeLabel:
            if larger:
                self._aggragate(new_df, gran, new_dataset)
            if gran.name == dataset.time_unit:
                larger = True
                path = get_data_path_by_id(new_dataset.id)[:-4] + '-' + gran.name + '.csv'
                new_df.to_csv(path, index=False)

        try:
            db.session.merge(new_dataset)
            db.session.commit()
        except Exception as e:
            raise RuntimeError(e)

        return {
            'file_url': upload.url('{}-{}.csv'.format(new_dataset.id, PandasTimeLabel[aggregate].name)),
            'timeValues': new_df[new_dataset.time_field].values.tolist()
        }

    def _aggragate(self, df, gran, dataset):
        df = df.copy()
        df[dataset.time_field] = pd.to_datetime(df[dataset.time_field])
        df = df.set_index(dataset.time_field, drop=False)
        aggregated_df = df.resample(gran.value).mean().fillna(0)
        aggregated_df.reset_index(inplace=True)
        df[dataset.time_field] = df[dataset.time_field].astype(str)
        path = get_data_path_by_id(dataset.id)[:-4] + '-' + gran.name + '.csv'
        aggregated_df.to_csv(path, index=False)
