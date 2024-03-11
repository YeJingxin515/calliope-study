import werkzeug, os, json
from flask_restful import Resource, abort, reqparse

from ..flask_uploads import UploadSet, DATA
from flask import jsonify, request
from uuid import uuid4
from ..preprocessing.schema import parse_schema
from ..preprocessing.utils import read_data
from ..db import db
from ..model.dataset import Dataset

upload = UploadSet('data', DATA)


class Upload(Resource):

    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('file', type=werkzeug.datastructures.FileStorage, location='files')
        args = parser.parse_args()
        file = args['file']

        if file is None:
            abort(400)

        dataset = Dataset()
        dataset.id = uuid4().hex
        dataset.name = file.filename

        file.filename = dataset.id + '.csv'
        upload.save(file, overwrite=True)

        df = read_data(upload.path(file.filename))

        try:
            schema = parse_schema(df)
        except Exception as e:
            abort(400)
        for s in schema:
            if s['type'] == 'temporal':
                dataset.time_field = s['field']
                break
        try:
            db.session.merge(dataset)
            db.session.commit()
        except Exception as e:
            raise RuntimeError(e)

        return jsonify({'schema': schema, 'file_url': upload.url(dataset.id + '.csv'), 'filename': dataset.name})
