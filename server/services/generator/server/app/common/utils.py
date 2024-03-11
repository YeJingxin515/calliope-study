import json
import time
import pandas as pd
import numpy as np
from typing import List, Tuple
from scipy.signal import periodogram
from statsmodels.tsa.seasonal import STL

from .entity import Insight
from .const import GLOBAL_INSIGHT, PandasTimeLabel, TIME_FORMAT


class ChartTemplateConfiguration:

    def __init__(self, insight: Insight, time_field, file_path) -> None:
        self.insight = insight
        self.time_field = time_field
        self.file_path = file_path


def fact2json(config: ChartTemplateConfiguration, focus: List[dict]) -> str:
    '''
    Transform fact into the required json for visual diagrams
    '''
    with open('template.json', 'r') as file:
        template = json.load(file)
    # ----------- Build the 'chart' field------------------------
    template['chart']['type'] = config.insight.type.name

    # ----------- Build the 'fact' field----------------
    fact = template['fact']
    # 1.subspace field in fact
    if config.insight.type in GLOBAL_INSIGHT:
        fact['subspace'] = []
    else:
        fact['subspace'] = config.insight.subspace
    # fact['subspace'] = []
    # 2.measure field in fact
    for measure in config.insight.measure:
        fact['measure'].append({'field': measure})
    # 3.breakdown field in fact
    fact['breakdown'].append({'field': config.time_field, 'granularity': config.insight.breakdown[0].name})
    # 4.focus field in fact
    fact['focus'] = focus
    # ----------------------build data field--------------------------
    data = template['data']
    data['url'] = config.file_path
    schema = data['schema']
    schema.append({'field': config.time_field, 'type': 'temporal'})
    for field in config.insight.measure:
        schema.append({'field': field, 'type': 'numerical'})
    return json.dumps(template)


def parse_freq(data: pd.DataFrame, time_field: str) -> Tuple[PandasTimeLabel, int]:
    time_data = pd.to_datetime(data[time_field])
    time_delta = (time_data[1] - time_data[0]).total_seconds() * 1e3

    # millisecond
    if time_delta < 1000:
        return PandasTimeLabel.Millisecond, time_delta
    # second
    elif time_delta < 60000:
        return PandasTimeLabel.Second, (time_delta // 1000)
    # minute
    elif time_delta < 3600000:
        return PandasTimeLabel.Minute, (time_delta // 60000)
    # hour
    elif time_delta < 3600000 * 24:
        return PandasTimeLabel.Hour, (time_delta // 3600000)
    # day
    elif time_delta < 3600000 * 24 * 7:
        return PandasTimeLabel.Day, (time_delta // (3600000 * 24))
    # month
    elif time_delta < 3600000 * 24 * 365:
        return PandasTimeLabel.Month, (time_delta // (3600000 * 24 * 30))
    # year
    else:
        return PandasTimeLabel.Year, (time_delta // (3600000 * 24 * 365))


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


def parse_schema(df, raise_exception=False):
    schema = []
    for k, v in df.dtypes.items():
        if 'object' in v.name:
            _, is_time = parse_date(df[k])
            if is_time:
                schema.append({'field': k, 'type': 'temporal'})
            elif raise_exception:
                raise RuntimeError('There is categorical variable in dataset!')
        else:
            schema.append({'field': k, 'type': 'numerical'})
    return schema


def detect_period(series, freq):
    potential_period = 10
    if freq[0] == PandasTimeLabel.Millisecond:
        potential_period = 1000 // freq[1]
    elif freq[0] == PandasTimeLabel.Second or freq[0] == PandasTimeLabel.Minute:
        potential_period = 60 // freq[1]
    elif freq[0] == PandasTimeLabel.Hour:
        potential_period = 24 // freq[1]
    elif freq[0] == PandasTimeLabel.Day:
        potential_period = 30 // freq[1]
    elif freq[0] == PandasTimeLabel.Month:
        potential_period = 12 // freq[1]

    model = STL(series, period=int(potential_period), seasonal_deg=0).fit()
    f, pxx_den = periodogram(model.seasonal, 1)
    if f[np.argmax(pxx_den[:round(len(pxx_den) / 10)])] == 0:
        period = potential_period
    else:
        period = round(1 / f[np.argmax(pxx_den[:round(len(pxx_den) / 10)])]) * 2
    return int(period)
