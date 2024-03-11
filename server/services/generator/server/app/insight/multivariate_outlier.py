import math
import warnings
import pandas as pd
import numpy as np
from typing import List
from scipy import stats
from statsmodels.tsa.vector_ar.var_model import VAR
from statsmodels.tsa.statespace.sarimax import SARIMAX
from sklearn.preprocessing import MinMaxScaler
from sklearn_extra.cluster import KMedoids
from tslearn.metrics import dtw

from ..common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Main function,to find multidimensional sequence exceptions
    :param origin_data:
        DataFrame,Extract all raw data from the table (DataFrame format)
    :param data_list:
        dataFrame,Extract the time series data to probe
    :param json_requires:
        dict,A JSON format to draw visual diagrams
    :param kwargs:
        Variable parameter
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    data[config.insight.measure] = data[config.insight.measure].apply(lambda x: (x - np.min(x)) / (np.max(x) - np.min(x)))
    data = data[config.insight.measure]
    # Use the model to calculate the data and get the results
    try:
        model, max_lags = create_model(data)
        result = model.fit(maxlags=max_lags)
    except:
        return []
    # Compute the T-squared distribution
    T = cal_T2(result, max_lags)

    # Calculate ucl value
    ucl = cal_UCL(result)

    # According to t square distribution and UCL, anomaly scores were calculated
    outliers, scores = cal_outliers_scores(T, ucl)

    focus = []
    subspace_outliers, subspace_scores = [], []
    for i in range(len(outliers)):
        if config.insight.subspace[0] < int(outliers[i][0]) and int(outliers[i][-1]) < config.insight.subspace[1]:
            subspace_outliers.append(outliers[i])
            subspace_scores.append(scores[i])

    # Sort by score in descending order
    outliers, scores, uni_scores, forecasts = sort_descending_score(subspace_outliers, subspace_scores, data)
    for i in range(len(outliers)):
        # clustering
        subspace_outliers = [outliers[i][0] - config.insight.subspace[0], outliers[i][-1] - config.insight.subspace[0]]
        cluster = generate_cluster(data[config.insight.subspace[0]:config.insight.subspace[1]], subspace_outliers, uni_scores,
                                   forecasts)
        focus.append([{
            'field': config.time_field,
            'start': int(outliers[i][0]) - config.insight.subspace[0],
            'end': int(outliers[i][-1]) - config.insight.subspace[0],
            'score': scores[i],
            'clusters': cluster
        }])
        break

    return focus


def create_model(data):
    """
    use VAR model to calculate the results
    :param data_new_list:
        DataFrame list,A list of time series data
    :return:
        model_result:VARResultsWrapper
        max_lags:int
    """
    df_no_constants = data.loc[:, (data != data.iloc[0]).any()]
    model = VAR(df_no_constants)
    max_lags = max(1, min(len(data) // 100, 100))
    return model, max_lags


def cal_T2(result, max_lags):
    """
    Compute the T-squared distribution
    :param result:
        VARResultsWrapper,VAR model results
    :param max_lags:
        int,VAR model max_lags
    :return:
        T
    """
    # T2
    residuals_mean = result.resid.values.mean(axis=0)
    residuals_std = result.resid.values.std(axis=0)
    residuals = (result.resid.values - residuals_mean) / residuals_std
    try:
        cov_residuals = np.linalg.inv(np.cov(residuals.T))
    except np.linalg.LinAlgError as e:
        print(e)
        return []
    T = np.diag(residuals.dot(cov_residuals).dot(residuals.T))
    T = np.append(np.array([0 for i in range(max_lags)]), T)
    return T


def cal_UCL(result):
    """
    Calculate Upper Control Limit
    :param result:
        VARResultsWrapper,The VAR model results
    :return:
        ucl:numpy.float64,Upper Control Limit
    """
    m = result.nobs
    p = result.resid.shape[-1]
    alpha = 0.1
    ucl = stats.f.ppf(1 - alpha, dfn=p, dfd=m - p) * (p * (m + 1) * (m - 1) / (m * m - m * p))
    return ucl


def cal_outliers_scores(T, ucl):
    """
    The abnormal scores of each sequence were calculated according to the t-square distribution results and Upper Control Limit
    :param T:
        numpy.ndarray,T-squared distribution
    :param ucl:
        numpy.float64,Upper Control Limit
    :return:
        outliers:list,The calculated exception
        scores:list,The exception score corresponding to the exception
    """
    outliers = []
    scores = []
    if np.isnan(ucl):
        return outliers, scores
    i = 0
    while i < len(T):
        outlier = []
        score = []
        while i < len(T) and (T[i] < ucl or np.isnan(T[i])):
            i += 1
        while i < len(T) and T[i] >= ucl:
            outlier.append(i)
            score.append((T[i] - ucl) / T[i])
            i += 1
        if len(outlier) > 0:
            outliers.append(outlier)
            scores.append(np.mean(score))
    return outliers, scores


def sort_descending_score(outliers, scores, data):
    """
    Sort in descending order according to the calculated anomaly score
    :param outliers:
        list,Sequential data list
    :param scores:
        list,Sequential data list
    :param data_new_list:
        DataFrame list,Sequential data list
    :return:
        outliers:list
        scores:list
        uni_scores:dict
        forecasts:dict
    """
    outliers = np.array(outliers, dtype=object)
    scores = np.array(scores)
    outlier_idx = np.argsort(scores * -1)
    outliers = outliers[outlier_idx]
    scores = scores[outlier_idx]
    uni_scores = {}
    forecasts = {}
    for variable in data.columns:
        data_item = data[variable]
        # univariate anomaly score
        m = SARIMAX(data_item.values, order=(2, 1, 1), enforce_invertibility=False)
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore")
            result = m.fit(disp=False)
            prediction = result.get_prediction(end=len(data_item))
            forecast = prediction.prediction_results.results.forecasts[0][1:]
            prob = prediction.dist.cdf(np.abs(data_item.values - prediction.predicted_mean[1:]) / prediction.se_mean[1:])
            uni_scores[variable] = list(np.abs(prob - 0.5) * 2)

        # not necessary for all fields because only the center series of a cluster needs,
        # but no expensive cost to save all
        forecasts[variable] = MinMaxScaler().fit_transform(forecast.reshape((-1, 1)))
    return outliers, scores, uni_scores, forecasts


def generate_cluster(data, outlier, uni_scores, forecasts):
    """
    The time series are clustered, and the clustering is called a class if the abnormal situation is similar
    :param data_new_list:
        DataFrame list,Sequential data list
    :param outliers:
        list,outliers
    :param uni_scores:
        dict,outlier scores
    :param forecasts:
        dict,forecasts results
    :return:
        clusters:list,collections
    """
    data_len = len(data)
    variable_num = len(data.columns)
    cluster = []
    left, right = max(0, outlier[0] - 10), min(data_len - 1, outlier[-1] + 10)
    x_std = np.array(np.squeeze(MinMaxScaler().fit_transform(data)).T)
    if variable_num > 4:
        n_series = variable_num
        distance_matrix = np.zeros(shape=(n_series, n_series), dtype=np.float64)
        for m in range(n_series):
            for n in range(n_series):
                if m != n:
                    with warnings.catch_warnings():
                        warnings.filterwarnings("ignore")
                        dist = dtw(x_std[m], x_std[n])
                    while math.isnan(dist) or math.isinf(dist):
                        dist = dtw(x_std[m], x_std[n])
                    distance_matrix[m, n] = dist
                    distance_matrix[n, m] = dist
        model = KMedoids(n_clusters=4, metric='precomputed').fit(distance_matrix)

        for j in range(4):
            other = []
            center_score = []
            for k in range(len(model.labels_)):
                if model.labels_[k] == j:
                    other.append(k)
                    center_score.append(np.max(uni_scores[data.columns[k]][left:right]))
            cluster.append({
                'center': {
                    'score': np.mean(center_score),
                    'value': np.mean(x_std[other][:, outlier[0] - 1:outlier[-1] + 2], axis=0).tolist(),
                    'forecast': np.mean(forecasts[data.columns[k]][outlier[0]:outlier[-1] + 1], axis=0).tolist()
                },
                'other': [{
                    'field':
                    data.columns[k],
                    'score':
                    np.max(uni_scores[data.columns[j]][max(0, outlier[0] - 1):min(data_len - 1, outlier[-1] + 1)])
                } for k in other]
            })
    else:
        for j in range(variable_num):
            cluster.append({
                'center': {
                    'score': np.max(uni_scores[data.columns[j]][left:right]),
                    'value': x_std[j][outlier[0] - 1:outlier[-1] + 2].tolist(),
                    'forecast': forecasts[data.columns[j]][outlier[0]:outlier[-1] + 1].reshape((-1, )).tolist()
                },
                'other': [{
                    'field':
                    data.columns[j],
                    'score':
                    np.max(uni_scores[data.columns[j]][max(0, outlier[0] - 1):min(data_len - 1, outlier[-1] + 1)])
                }]
            })
    return cluster
