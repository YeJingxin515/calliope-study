import math
import numpy as np
import pandas as pd
from typing import List, Dict
from tslearn.metrics import dtw
from sklearn.cluster import DBSCAN
from sklearn.metrics import silhouette_score
from sklearn.manifold import MDS

from ..common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[Dict]]:
    """
    Clustering multivariate time series
    :param data:
        DataFrame,Raw time series data
    :param config:
        ChartTemplateConfiguration,The configurations needed to render chart
    :param kwargs:
        Optional parameters
    :return:
        string,The corresponding JSON format string to render chart
    """

    series_name = kwargs.get('series_name', None)
    variable_name = kwargs.get('variable_name', None)
    if series_name is None or variable_name is None:
        return []

    data[config.insight.measure] = data[config.insight.measure].apply(lambda x: (x - np.min(x)) / (np.max(x) - np.min(x)))
    data = data[config.insight.measure]

    split_data = [data[name] for name in series_name]
    distance_matrix = cal_distance_matrix(split_data)
    model = cluster_by_distance_matrix(distance_matrix)

    # Calculate the coordinate after dimensionality reduction for visualization
    plot_data = MDS(n_components=2, dissimilarity='precomputed').fit_transform(distance_matrix)

    cluster_result = build_cluster_result(model)
    representation = choose_representation(cluster_result, distance_matrix)
    scores = cal_cluster_score(distance_matrix=distance_matrix, clusters=cluster_result, representation=representation)
    focus = {}
    focus['cluster'] = []
    focus['outlier'] = []
    for i, series in cluster_result.items():
        current = {}
        if i >= 0:
            current['score'] = scores[i]
            current['position'] = plot_data[series].tolist()
            current['representation'] = {}
            for j, name in enumerate(variable_name):
                current['representation'][name] = series_name[representation[i]][j]
            current['member'] = []
            for s in series:
                tmp = {}
                for j, name in enumerate(variable_name):
                    tmp[name] = series_name[s][j]
                current['member'].append(tmp)
            focus['cluster'].append(current)
        # outlier
        else:
            current['score'] = scores[i]
            current['position'] = plot_data[series].tolist()
            focus['outlier'].append(current)

    focus['field'] = config.time_field
    focus['variable'] = []
    for i, variable in enumerate(variable_name):
        focus['variable'].append({'name': variable, 'member': [series[i] for series in series_name]})
    return [[focus]]


def cal_distance_matrix(data_list):
    '''
    Calculate the distance matrix of all multivariate time series by DTW
    :param data_list
        list[np.ndarray],standardized multivariate time series
    :return
        np.ndarray,distance matrix (series number * series number)
    '''
    n_series = len(data_list)
    distance_matrix = np.zeros(shape=(n_series, n_series), dtype=np.float64)

    for i in range(n_series):
        for j in range(n_series):
            if i != j:
                dist = dtw(data_list[i], data_list[j])
                while math.isnan(dist) or math.isinf(dist):
                    dist = dtw(data_list[i], data_list[j])

                distance_matrix[i, j] = dist
                distance_matrix[j, i] = dist
    return distance_matrix


def cluster_by_distance_matrix(distance_matrix):
    '''
    Clustering multivariate time series by DBSCAN with precomputed distance matrix
    and choose the best model by silhouette score
    :param distance_matrix
        np.ndarray,distance matrix of series to be clustered
    :return

    '''
    n_series = len(distance_matrix)
    maximum = float(np.max(distance_matrix))
    max_score = 0
    best_model = None
    for eps in np.arange(0.01, maximum, maximum / 50.0):
        for min_eg in range(2, int(n_series / 2)):
            cluster = DBSCAN(eps=eps, metric='precomputed', min_samples=min_eg).fit(distance_matrix)
            if len(np.unique(cluster.labels_)) > 1:
                score = silhouette_score(distance_matrix, cluster.labels_, metric='precomputed')
                # Update model when:
                # - max score is lower than current one
                # - max score equals to current one but
                #   current one's number of clusters or outliers is larger than best one's
                if max_score < score or (
                        max_score == score and
                    (len(np.unique(cluster.labels_)) > len(np.unique(best_model.labels_))
                     or np.count_nonzero(cluster.labels_ == -1) < np.count_nonzero(best_model.labels_ == -1))):
                    max_score = score
                    best_model = cluster
    return best_model


def build_cluster_result(model):
    '''
    Convert model to dict of series number
    :param model:
        DBSCAN,sklearn DBSCAN model
    :return
        dict,series number indexed by class label
    '''
    clusters = {}
    outlier_counter = -1
    for i, l in enumerate(model.labels_):
        if l >= 0:
            clusters.setdefault(l, []).append(i)
        else:
            # each outlier is an individual cluster
            clusters.setdefault(outlier_counter, []).append(i)
            outlier_counter -= 1
    return clusters


def choose_representation(clusters, distance_matrix):
    '''
    Choose the center series of each cluster as representation
    :param clusters
        dict,series number indexed by class label
    :param distance_matrix
        np.ndarray,distance matrix of series to be clustered
    :return
        list,index of center series of each cluster
    '''
    representation = []
    for i in range(len(clusters)):
        min_idx = clusters[i][0]
        min_dis = float('inf')
        for m in clusters[i]:
            dis = []
            for n in clusters[i]:
                if m != n:
                    dis.append(distance_matrix[m][n])
            if min_dis > np.mean(dis):
                min_idx = m
                min_dis = np.mean(dis)
        representation.append(min_idx)
    return representation


def cal_cluster_score(distance_matrix, clusters, representation):
    '''
    Calculate Rij of Davies Bouldin Index as each cluster score
    :param distance_matrix:
        np.ndarray,distance matrix of multivariate time series
    :param clusters:
        dict,series number indexed by class labels
    :param representation:
        list,index of center series of each cluster
    :return
        dict,score of each class
    '''

    def compute_Si(i, clusters, cluster_idx):
        s = 0
        for t in clusters[i]:
            s += distance_matrix[t][cluster_idx]
        return s / len(clusters[i])

    def compute_Rij(i, j, clusters, representation):
        Mij = distance_matrix[representation[i]][representation[j]]
        Rij = (compute_Si(i, clusters, representation[i]) + compute_Si(j, clusters, representation[j])) / Mij
        return Rij

    result = {}
    for i in clusters.keys():
        list_r = []
        for j in clusters.keys():
            if i != j:
                temp = compute_Rij(i, j, clusters, representation)
                list_r.append(temp)
        if i >= 0:
            result[i] = max(list_r)
        else:
            result[i] = min(list_r)
    return result
