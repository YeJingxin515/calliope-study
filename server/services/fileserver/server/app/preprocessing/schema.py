import time
import pandas as pd

from app.preprocessing.const import TIME_FORMAT


def parse_schema(df):
    schema = []
    for k, v in df.dtypes.items():
        if 'object' in v.name:
            _, is_time = parse_date(df[k])
            if is_time:
                schema.append({'field': k, 'type': 'temporal'})
            else:
                raise RuntimeError('There is categorical variable in dataset!')
        else:
            schema.append({'field': k, 'type': 'numerical'})
    return schema


def parse_date(series: pd.Series):
    # 1. take top 100 non-empty values
    INFER_TOP_N = 100
    series_non_empty = series.dropna()[:INFER_TOP_N]

    # 2. if these value all datetime value infer it as datetime nor object
    for item in series_non_empty:
        if not isinstance(item, str):
            return series, False
        for format in TIME_FORMAT:
            try:
                time.strptime(item, format)
                return pd.to_datetime(series, format=format), True
            except Exception as e:
                pass
        return series, False

    # 3. infer as datetime
    return pd.to_datetime(series, format=TIME_FORMAT), True
