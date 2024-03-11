import numpy as np
import pandas as pd
from typing import List
from tslearn.metrics import dtw
from sklearn.preprocessing import MinMaxScaler

from ..common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Find the interval of similarity from the sequence as long as the baseline sequence
    :param similarity_num:
        int,The number of similar blocks to find in each sequence
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param data_nonbase_list:
        DataFrame list,Non-baseline sequence
    :param data_base:
        DataFrame,Baseline sequence data
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    base_variable = kwargs.get('base_variable')
    if base_variable is None:
        return []
    similarity_num = kwargs.get('similarity_num', 3)
    compare_variable = config.insight.measure.copy()
    compare_variable.remove(base_variable)
    # Determine the baseline series
    baseline_array = MinMaxScaler().fit_transform(
        np.array(data[base_variable][config.insight.subspace[0]:config.insight.subspace[1]]).reshape(-1, 1))
    # Sliding window size
    win_size = len(baseline_array)

    similarity_map = dict()
    for variable in compare_variable:
        compare_series = data[variable]
        similarity_slice = np.ones(shape=[len(data) - win_size + 1, 2])
        loc = [0]
        # sliding window to calculates the length between each sequence fragment
        compare_series.rolling(window=win_size).apply(lambda x: handle_rolling(baseline_array, x, similarity_slice, loc),
                                                      raw=True)

        # ---------sort similarity_slice + choose similarity_num slice----------------
        # 1.Computing similarity
        similarity_slice[:, 1] = 1 / (1 + similarity_slice[:, 1])
        # 2.sort by similarity
        similarity_slice = similarity_slice[np.lexsort(-similarity_slice.T)]
        # 3.pick similarity_num slice
        picked_slices = find_n_similarity_slice(similarity_slice, similarity_num, win_size)
        # 4.storage information
        similarity_map[variable] = picked_slices
    focus = [{
        'field': base_variable,
        'tag': 'baseline',
        'value': [{
            'start': config.insight.subspace[0],
            'end': config.insight.subspace[1],
            'text': 'Base Line'
        }],
        'scope': config.insight.subspace
    }]
    for item in similarity_map:
        value = []
        for i in range(0, similarity_map[item].shape[0]):
            slice_value = similarity_map[item][i]
            value.append({
                'start': int(slice_value[0]),
                'end': int(slice_value[0] + win_size),
                'similarity_value': slice_value[1],
                'text': "No." + str(i + 1)
            })
        focus.append({'field': item, 'tag': 'Compare', 'value': value})

    return [focus]


def find_n_similarity_slice(all_similarity_slice, n, similarity_section):
    """
    The greedy algorithm is used to find the n blocks with the highest similarity to the baseline, and the overlap rate between blocks is less than 50%
    :param all_similarity_slice:
        ndarray, All sequence blocks sorted based on similarity
    :param n:
        int, Number of similar blocks to be selected
    :param similarity_section:
        int, Baseline similarity block interval length
    :return:
        ndarray,All the similar pieces that have been picked out
    """
    # initialization
    choosed_slice = np.empty(shape=[0, 2])
    # Records the starting position of similar blocks that have been selected
    record_loc = []

    for item in all_similarity_slice:
        if len(choosed_slice) == 0:
            choosed_slice = np.append(choosed_slice, [item], axis=0)
            record_loc.append(item[0])
        else:
            if len(choosed_slice) == n:
                break
            else:
                # Retrieves the starting position of the next similar block to be added
                new_loc = int(item[0])
                lower_loc = new_loc - similarity_section
                upper_loc = new_loc + similarity_section
                # Find the starting positions of all similar blocks within this range
                all_legal_loc = [x for x in record_loc if (x > lower_loc and x < upper_loc)]
                # Distinguish between legal_loc larger than new_loc and smaller than new_loc
                if len(all_legal_loc) == 0:
                    choosed_slice = np.append(choosed_slice, [item], axis=0)
                    record_loc.append(item[0])
                    continue
                lower_than_newloc = [x for x in all_legal_loc if x < new_loc]
                upper_than_newloc = [x for x in all_legal_loc if x >= new_loc]
                # Find the part with the largest coverage
                s_lower = 0
                s_upper = 0
                if len(lower_than_newloc) > 0:
                    lower_max_cover_loc = max(lower_than_newloc)
                    s_lower = lower_max_cover_loc + similarity_section - new_loc
                if len(upper_than_newloc) > 0:
                    upper_max_cover_loc = min(upper_than_newloc)
                    # Calculate coverage ratio
                    s_upper = new_loc + similarity_section - upper_max_cover_loc
                if ((s_lower + s_upper) / similarity_section <= 0.5):
                    choosed_slice = np.append(choosed_slice, [item], axis=0)
                    record_loc.append(item[0])
    return choosed_slice


def handle_rolling(base_series, compare_series, similarity_slice, loc):
    """
    The sliding window aligns the DTW distance between each sequence and the baseline sequence
    :param base_series:
        ndarray,Baseline sequence
    :param compare_series:
        ndarray,Sequence of sliding entry Windows
    :param similarity_slice:
        ndarray,Record all distances
    :param loc:
        list,Record the slide position
    :return: 1
    """
    # 0-1 normalization
    current_series = MinMaxScaler().fit_transform(np.array(compare_series).reshape(-1, 1))
    # DTW is used for dynamic time warping
    current_dist = dtw_dist(base_series, current_series)
    # Record the position and distance of the slide
    similarity_slice[min(len(similarity_slice) - 1, loc[0]), 0] = loc[0]
    similarity_slice[min(len(similarity_slice) - 1, loc[0]), 1] = current_dist
    loc[0] += 1
    return 1


def range_select(baseline_data, start, end):
    """
    Selects all data in the specified period of the baseline based on the index number
    :param baseline_data:
        DataFrame,the baseline series data
    :param start:
        int,The selected starting position
    :param end:
        int,The selected termination location
    :return:
        Series,all data in the specified period of the baseline based on the index number
    """
    return baseline_data[start:end]


def dtw_dist(baseline, series):
    """
    DTW:dynamic time planning algorithm
    :param baseline:
        ndarray,Baseline sequence data
    :param series:
        ndarray,Alignment sequence data
    :return:
        float,The distance between two sequences
    """
    dist = dtw(baseline.reshape(-1), series.reshape(-1))
    return dist
