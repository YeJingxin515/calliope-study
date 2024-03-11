import pandas as pd
import os


def read_data(data_path):
    return pd.read_csv(data_path, infer_datetime_format=True)


def get_data_path_by_id(file_id):
    return os.path.join('data', file_id + '.csv')
