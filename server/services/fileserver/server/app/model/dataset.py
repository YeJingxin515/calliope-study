from ..db import db


class Dataset(db.Model):
    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(255))
    time_field = db.Column(db.String(255))
    time_unit = db.Column(db.String(8))
    unit_num = db.Column(db.Integer)
