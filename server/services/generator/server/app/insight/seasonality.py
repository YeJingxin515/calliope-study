import json
from typing import List

import numpy as np
import pandas as pd
from scipy.signal import periodogram
from statsmodels.tsa.seasonal import STL

from ..common.const import PandasTimeLabel
from ..common.utils import ChartTemplateConfiguration, parse_freq


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Find unseasonal period if univariate time series is seasonal
    """
    if config.time_field in data.columns:
        freq = parse_freq(data, config.time_field)
    else:
        freq = config.insight.breakdown
    data = data[config.insight.measure[0]]
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

    model = STL(data, period=int(potential_period), seasonal_deg=0).fit()
    f, pxx_den = periodogram(model.seasonal, 1)
    if f[np.argmax(pxx_den[:round(len(pxx_den) / 10)])] == 0:
        period = potential_period
    else:
        period = round(1 / f[np.argmax(pxx_den[:round(len(pxx_den) / 10)])]) * 2
    if period > len(data) / 2:
        print('unseasonal')
        return []

    data_length = len(data)
    seasonal_resid = [np.mean(np.abs(model.resid[i:i + period + 1])) for i in range(0, data_length, period)]
    resid_mean = np.mean(seasonal_resid)
    resid_std = np.std(seasonal_resid)
    threshold = 1.5
    z_result = []
    for i in seasonal_resid:
        z = (i - resid_mean) / resid_std
        if z > threshold and i > resid_mean:
            z_result.append(-1)
        else:
            z_result.append(1)

    seasonal = []
    if_seasonal = True
    average_strength = []
    for i in range(config.insight.subspace[0] // period,
                   max(config.insight.subspace[1] // period, config.insight.subspace[0] // period + 1)):
        if z_result == -1:
            if_seasonal = False
        season = {'start': period * i, 'end': period * (i + 1), 'seasonal': z_result[i] != -1}
        if season['start'] < season['end']:
            seasonal.append(season)
            average_strength.append(seasonal_strength(model, [period * i, period * (i + 1)]))

    sorted_insight, average = sort_unseasonal_period(data, seasonal_resid, z_result, period)
    return [[{
        'field': config.insight.measure[0],
        'interval': period,
        'seasonal': seasonal,
        'average': average,
        'ifSeasonal': if_seasonal,
        'p': float(np.mean(average_strength)),
        'scope': config.insight.subspace
    }]]


def seasonal_strength(model, interval=None):
    if interval:
        return max(
            0.1, 1 - np.var(model.resid[interval[0]:interval[1] + 1]) /
            np.var(model.resid[interval[0]:interval[1] + 1] + model.seasonal[interval[0]:interval[1] + 1]))
    else:
        return max(0.1, 1 - np.var(model.resid) / np.var(model.resid + model.seasonal))


def sort_unseasonal_period(data, seasonal_resid, y, period):
    '''
    Sort unseasonal by its max resid and calculate average of a period
    :param seasonal_resid:
        np.ndarray,average resid of each period
    :param y:
        np.ndarray,label of each period
    :param period:
        int:period of the series 
    :return
        - list,sorted list of periods by average resid
        - list,average score of each period
    '''
    unseasonal_idxes = []
    seasonals = []
    current_unseasonal_idx = []
    current_max_resid = 0
    for i, resid in enumerate(seasonal_resid):
        # seasonal_decompose left the resid of afirst and last half period to be nan,
        # so ignore the first and last period
        if y[i] == -1:
            current_unseasonal_idx += [j for j in range(period * i, period * (i + 1))]
            current_max_resid = max(current_max_resid, resid)
        else:
            if len(current_unseasonal_idx) > 0:
                unseasonal_idxes.append({'index': current_unseasonal_idx, 'max': current_max_resid})
            seasonals.append(data[i * period:(i + 1) * period].values)
            current_unseasonal_idx = []
            current_max_resid = 0
    sorted_insight = sorted(unseasonal_idxes, key=lambda i: i['max'], reverse=True)
    average = list(np.average(seasonals[:-1], axis=0))
    return sorted_insight, average


def to_json(csv_path,
            seasonal,
            time_field,
            value_field,
            period,
            average,
            seg_location,
            granularity,
            ifSeasonal,
            aggregate='avg'):
    '''
    Transform the mined data into the required format for visual diagrams
    :param csv_path:
        str,Path of the table data file
    :param seasonal:
        list,list of seasonal period
    :param time_field:
        str,The name of the time column in table data
    :param value_field:
        str,Column of variable
    :param period:
        int,period of the series
    :param average:
        np.ndarray,the average of each period
    :param seg_location:
        list,[start,end],The location of the segment in the raw
    :param granularity:
        string,The granularity of time series data
    :param aggregate:
        string,The aggregation of time series data
    :return:
        json,Required format for visualization
    '''
    with open('template.json', 'r') as file:
        template = json.load(file)

    template['chart']['type'] = 'seasonality'

    fact = template['fact']
    # 1.subspace field in fact
    fact['subspace'] = [seg_location['start'], seg_location['end']]
    # 2.measure field in fact
    fact['measure'].append({'field': value_field, 'aggregate': aggregate})
    # 3.breakdown field in fact
    fact['breakdown'].append({'field': time_field, 'granularity': granularity})
    fact['focus'].append({
        'field': time_field,
        'interval': period,
        'seasonal': seasonal,
        'average': average,
        'ifSeasonal': ifSeasonal
    })
    data = template['data']
    data['url'] = csv_path
    schema = data['schema']
    schema.append({'field': time_field, 'type': 'temporal'})
    schema.append({'field': value_field, 'type': 'numerical'})
    return template
