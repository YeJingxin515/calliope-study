import warnings
from typing import List

import numpy as np
import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX

from ..common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Find univariate outlier insight in univariate temporal data
    :param data:
        DataFrame,Raw time series data
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param kwargs:
        Optional parameters
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    min_value = np.min(data[config.insight.measure[0]])
    max_value = np.max(data[config.insight.measure[0]])
    data[config.insight.measure] = data[config.insight.measure].apply(lambda x: (x - np.min(x)) / (np.max(x) - np.min(x)))
    value_field = config.insight.measure[0]
    values = data[value_field].values

    m = SARIMAX(values, order=(2, 1, 1), enforce_invertibility=False)
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore")
        result = m.fit(disp=False)
    prediction = result.get_prediction(end=len(values) + 1)
    predict_ci = prediction.conf_int(alpha=0.9)[:, :]
    forecast = list(prediction.prediction_results.results.forecasts[0][:len(values)])
    prob = prediction.dist.cdf(values)
    scores = np.abs(prob - 0.5) * 2
    sorted_insights = find_outliers(values, predict_ci, scores)

    # Process the data
    extend_data = {}
    extend_data['lower'] = list(np.array(list(predict_ci[1:, 0])) * (max_value - min_value) + min_value)
    extend_data['upper'] = list(np.array(list(predict_ci[1:, 1])) * (max_value - min_value) + min_value)
    extend_data['forecast'] = list(np.array(forecast) * (max_value - min_value) + min_value)

    focus = []
    for insight in sorted_insights:
        if config.insight.subspace[0] < insight['scope'][0] and insight['scope'][1] < config.insight.subspace[1]:
            focus.append([{
                'field':
                config.insight.measure[0],
                'scope': [insight['scope'][0] - config.insight.subspace[0], insight['scope'][1] - config.insight.subspace[0]],
                'lower':
                extend_data['lower'][config.insight.subspace[0]:config.insight.subspace[1]],
                'upper':
                extend_data['upper'][config.insight.subspace[0]:config.insight.subspace[1]],
                'forecast':
                forecast[config.insight.subspace[0]:config.insight.subspace[1]],
                'score':
                insight['value']
            }])
    return focus


def find_outliers(data, predict_ci, scores):
    """
    Find outliers which are outside of the confidence interval
    :param data:
        list,Raw time series data
    :param predict_ci:
        list, (1-alpha)% confidence interval of raw time series
    :param scores:
        list, anomaly score of time series data
    :return:
        Oultier list sorted by anomaly score
    """
    outliers = []
    i = 1
    while i < len(data):
        if np.isnan(data[i]) or (predict_ci[i][0] < data[i] < predict_ci[i][1]):
            i += 1
            continue

        outlier_start = i
        # find all succeeding outlier points
        while i < len(data) and (data[i] <= predict_ci[i][0] or data[i] >= predict_ci[i][1]):
            i += 1
        outliers.append({
            'scope': [outlier_start, max(i, outlier_start + 1)],
            'value': np.mean(scores[outlier_start:max(i, outlier_start + 1)])
        })
    return sorted(outliers, key=lambda o: o['value'], reverse=True)
