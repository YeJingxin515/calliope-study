import math
import queue
import warnings
import numpy as np
import pandas as pd
from random import random
from typing import List, Dict
from statsmodels.tsa.stattools import acf
from scipy.signal import periodogram
from statsmodels.tsa.seasonal import STL

from ..common.utils import ChartTemplateConfiguration, parse_freq, detect_period
from ..common.const import PandasTimeLabel


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[Dict]]:
    """
    Find autocorrelation insight in univariate temporal data
    :param data:
        DataFrame,Raw time series data
    :param config:
        ChartTemplateConfiguration,The configurations needed to render chart
    :param kwargs:
        Optional parameters
    :return:
        string,The corresponding JSON format string to render chart
    """
    if config.time_field in data.columns:
        freq = parse_freq(data, config.time_field)
    else:
        freq = config.insight.breakdown
    data = data[config.insight.measure[0]]
    window_size = detect_period(data, freq)
    if window_size < 5:
        window_size = window_size * (5 // window_size)

    if kwargs.get('window_size', None) is not None:
        window_size = kwargs.get('window_size')
    data = data[config.insight.subspace[0]:config.insight.subspace[1]]
    focus = queue.PriorityQueue()
    for i in range(0, len(data), window_size):
        data_ = data[i:min(i + window_size, len(data))]
        if len(data_) <= int(math.log(window_size)) + 1:
            continue
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore")
            correlation, q, p = acf(data_, nlags=int(len(data_)), qstat=True)
        abnormal = False
        for j in range(1, len(correlation)):
            if abs(correlation[j - 1]) < abs(correlation[j]):
                abnormal = True
                break
        if abnormal:
            focus.put((p[int(math.log(window_size))], random(), {
                'scope': [i, i + window_size],
                'correlation': list(correlation),
                'p': 1 - p[int(math.log(window_size))]
            }))
    if focus.empty():
        return []
    result = focus.get()[2]
    result['field'] = config.insight.measure[0]
    return [[result]]
