import math
import numpy as np
import pandas as pd
import heapq
from typing import List, Dict
from sklearn.preprocessing import MinMaxScaler
from matrixprofile import matrixProfile, motifs
from scipy.signal import periodogram
from statsmodels.tsa.seasonal import STL
from tslearn.metrics import dtw

from ..common.utils import ChartTemplateConfiguration, parse_freq, detect_period
from ..common.const import PandasTimeLabel


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[Dict]]:
    pattern_name = kwargs.get('pattern_name', 'pattern')

    data = data[config.insight.measure[0]]
    baseline = MinMaxScaler().fit_transform(
        np.array(data[config.insight.subspace[0]:config.insight.subspace[1]]).reshape(-1, 1))
    min_heap = []
    window_size = len(baseline)
    for i in range(0, len(data) - window_size, window_size // 5):
        current_series = MinMaxScaler().fit_transform(np.array(data[i:i + window_size]).reshape(-1, 1))
        current_dist = dtw(baseline, current_series)
        heapq.heappush(min_heap, (current_dist, i))

    heapq.heappush(min_heap, (0, config.insight.subspace[0]))
    scores = []
    result = []
    while len(result) < 3:
        if len(min_heap) == 0:
            break
        cur = heapq.heappop(min_heap)
        if config.insight.subspace[0] < cur[1] <= config.insight.subspace[1] or config.insight.subspace[
                0] <= cur[1] + window_size < config.insight.subspace[1]:
            continue
        scores.append(cur[0])
        result.append({
            'field':
            config.insight.measure[0],
            'start':
            cur[1],
            'end':
            cur[1] + window_size,
            'name':
            pattern_name,
            'normalized':
            MinMaxScaler().fit_transform(np.array(data[cur[1]:cur[1] + window_size]).reshape(-1, 1)).reshape(-1).tolist(),
        })

    if len(result) > 1:
        return [[{
            'field': config.insight.measure[0],
            'scope': config.insight.subspace,
            'patterns': result,
            'score': 1 - np.mean(scores),
            'average': np.mean([p['normalized'] for p in result], axis=0).tolist()
        }]]
    return []


def extract_old(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[Dict]]:
    """
    Find frequent pattern in univariate time series
    :param data:
        pd.DataFrame,data
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param window_size:
        int,sliding window size when finding frequent pattern
    :param max_motifs:
        int,max kinds of frequent pattern
    :return:
        dict,chart's input,
    """
    if config.time_field in data.columns:
        freq = parse_freq(data, config.time_field)
    else:
        freq = config.insight.breakdown
    window_size = 10
    data = data[config.insight.measure[0]]
    window_size = detect_period(data, freq)
    if window_size < len(data) // 50:
        window_size = window_size * ((len(data) // 50) // window_size)

    if kwargs.get('window_size', None) is not None:
        window_size = kwargs.get('window_size')
    max_motifs = kwargs.get('max_motifs', 3)
    pattern_name = kwargs.get('pattern_name', 'pattern')

    data = ((data - np.min(data)) / (np.max(data) - np.min(data))).values
    try:
        mp = matrixProfile.scrimp_plus_plus(data, window_size)
    except Exception as e:
        return []
    mtfs, scores = motifs.motifs(data, mp, max_motifs=max_motifs)
    for i in range(len(scores)):
        if np.isnan(scores[i]):
            scores[i] = 0
    results = list()
    for i in range(0, len(mtfs)):
        results.append({'score': 1 - scores[i] / math.sqrt(window_size), 'pattern': mtfs[i]})
    sorted_result = sorted(results, key=lambda r: r['score'], reverse=True)

    # Sort the result by score
    focus = []
    for i in range(len(sorted_result)):
        ms = sorted_result[i]['pattern']
        starts = np.array(ms).tolist()
        current_pattern = []
        in_subspace = False
        for s in starts:
            # Pattern should exist in the subspace
            if config.insight.subspace[0] < s and s + window_size < config.insight.subspace[1]:
                in_subspace = True
            current_pattern.append({
                'field':
                config.insight.measure[0],
                'start':
                s,
                'end':
                s + window_size,
                'name':
                pattern_name,
                'normalized':
                MinMaxScaler().fit_transform(data[s:s + window_size].reshape((-1, 1))).reshape(-1).tolist(),
            })

        if in_subspace:
            focus.append([{
                'field': config.insight.measure[0],
                'scope': config.insight.subspace,
                'patterns': current_pattern,
                'score': sorted_result[i]['score'],
                'average': np.mean([p['normalized'] for p in current_pattern], axis=0).tolist()
            }])

    return focus
