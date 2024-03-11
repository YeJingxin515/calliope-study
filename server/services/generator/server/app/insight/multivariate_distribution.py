import queue
import json
import numpy as np
import pandas as pd
from typing import List

from ..common.utils import ChartTemplateConfiguration

# list, Evaluates the numeric attributes associated with the time series
calculator_list = ['mean', 'std', 'min', 'max']


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    main function,computes the result of the multidimensional distribution
    :param data_list:
        DataFrame list: Multidimensional sequence data
    :param json_requires:
        dict,A JSON format to draw visual diagrams
    :param kwargs:
        Variable parameter
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    # focuses field in JSON format
    data = data[config.insight.measure][config.insight.subspace[0]:config.insight.subspace[1]]
    focuses = []
    data_list = []

    variables = config.insight.measure
    if len(variables) > 3:
        variables = filter_measures(variables, data)

    # Calculate the mean, standard deviation, minimum and maximum value of each variable
    for col in variables:
        for item in calculator_list:
            focuses.append({"field": col, "value": np_cal_value(item, data[col].values), "name": item})
        data_list.append(data[col])

    # -----------------------Calculate the parameters related to the confidence ellipse---------------
    # 1. If there are only two variables, the confidence ellipses of the two sequences are computed once
    # focuses = create_ellipse_focus_json(data_list[0], data_list[1], focuses)

    # 2. If it is larger than a 3-dimensional sequence, the first 3 columns with the highest correlation are taken and the confidence ellipses between the remaining pairs of sequences are calculated again
    # if len(variables) == 3:
    #     focuses = create_ellipse_focus_json(data_list[1], data_list[2], focuses)
    #     focuses = create_ellipse_focus_json(data_list[2], data_list[0], focuses)

    return [focuses]


def np_cal_value(method, data):
    """
    Optionally calculate mean, standard deviation, maximum, and minimum values based on the options
    :param method:
        string,Mean, standard deviation, maximum, minimum options
    :param data:
        DataFrame,Data used in calculations
    :return:
        float,The numeric attributes associated with the data column
    """
    # Use the numpy library to calculate the average
    if method == 'mean':
        return float(np.mean(data))
    # Use the numpy library to calculate the standard deviation
    elif method == 'std':
        return float(np.std(data))
    # Use the numpy library to calculate the minimum
    elif method == 'min':
        return float(np.min(data))
    # Use the numpy library to calculate the maximum
    elif method == 'max':
        return float(np.max(data))


def create_ellipse_focus_json(series_data1, series_data2, focuses):
    """
    Calculate the confidence ellipse parameters, and stored it in the FOCUS field in JSON format
    :param series_data1:
        DataFrame,Time series data 1
    :param series_data2:
        DataFrame,Time series data 2
    :param focuses:
        dict,Focus field in JSON format
    :return:
        dict,Focus field in JSON format
    """
    # From the two sequences, the parameters of their confidence ellipses are calculated
    ellipse1 = cal_confidence_ellipse(series_data1.tolist(), series_data2.tolist())
    # Store the calculated parameters in the Focus field,and there are three parameters
    for item in ellipse1:
        focuses.append({'field': series_data1.name, 'value': float(ellipse1[item]), 'name': item})
    return focuses


def filter_measures(measures: List, df: pd.DataFrame):
    """
    If there are more than three columns of time series data, filter the data columns with the top three correlation
    :param cols:
        list,A list of column names of multidimensional temporal data
    :param df:
        DataFrame,data
    :return:
        list,A list of the top three columns with relevance
    """
    result = []
    correlation = queue.PriorityQueue()
    # Pearson correlation coefficient is used to calculate the correlation between pairwise sequences
    for c1 in measures:
        for c2 in measures:
            if c1 == c2:
                continue
            correlation.put((df[c1].corr(df[c2], method='pearson'), (c1, c2)))
    top = correlation.get()
    result.append(top[1][0])
    result.append(top[1][1])
    while not correlation.empty():
        tmp = correlation.get()
        if (top[1][0] == tmp[1][0] or top[1][1] == tmp[1][0]) and tmp[1][1] not in result:
            result.append(tmp[1][1])
            break
        elif (top[1][0] == tmp[1][1] or top[1][1] == tmp[1][1]) and tmp[1][0] not in result:
            result.append(tmp[1][0])
            break
    return result


def cal_confidence_ellipse(s1, s2):
    """
    Computes the confidence ellipse parameters between two sequences
    :param s1:
        DataFrame,Time series data 1
    :param s2:
        DataFrame,Time series data 2
    :return:
        dict,The parameters of the calculated confidence ellipse
    """
    # p-percentage-value: 95%： 5.991  99%： 9.21  90%： 4.605
    s = np.sqrt(4.605)

    X = np.vstack((s1, s2))
    cov = np.cov(X)
    lambda_, v = np.linalg.eig(cov)
    lambda_ = np.sqrt(np.abs(lambda_))
    a = 2 * s * lambda_[0]
    b = 2 * s * lambda_[1]
    angle = np.rad2deg(np.arccos(v[0, 0]))
    confidence_ellipse = {"a": a, "b": b, "rad": angle}
    return confidence_ellipse
