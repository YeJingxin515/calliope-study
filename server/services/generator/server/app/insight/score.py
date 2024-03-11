import warnings
from typing import List, Dict

import numpy as np
import pandas as pd
from scipy.stats import norm, logistic, shapiro
from scipy.spatial import distance
from sklearn.linear_model import LinearRegression

from ..common.const import InsightType
from ..common.entity import Insight


def _autocorrelation(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return focus[0].get('p') * 0.6


def _clustering(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    scores = []
    for cluster in focus[0].get('cluster', []):
        scores.append(cluster.get('score', 0))
    for outlier in focus[0].get('outlier', []):
        scores.append(outlier.get('score', 0))
    return np.mean(scores)


def _forecasting(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    pass


def _frequent_pattern(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return focus[0]['score']


def _multivariate_distribution(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    all_data = data[insight.measure].values.reshape(-1)
    subspace_data = np.random.choice(data[insight.measure][insight.subspace[0]:insight.subspace[1]].values.reshape(-1),
                                     len(all_data))
    s = distance.jensenshannon(subspace_data, all_data)
    if not np.isnan(s):
        return s
    return 0


def _multivariate_outlier(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return focus[0]['score']


def _outstanding(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    measure_value = list(data[insight.measure[0]].values)
    subspace_max = np.max(data[insight.measure].values[insight.subspace[0]:insight.subspace[1]])
    # 1. We sort x in descending order
    measure_value.sort(reverse=True)

    # 2. We assume the long-tail shape obeys a power-law function.
    # Then we conduct regression analysis for the values in {𝑥}\𝑥 𝑚𝑎𝑥 using power-law functions 𝛼 ∙ 𝑖 −𝛽 ,
    # where 𝑖 is an order index and in our current implementation we fix β = 0.7 in the power-law fitting;
    y = measure_value
    indexs = list(map(lambda x: x + 1, list(range(len(measure_value)))))
    X = list(map(lambda x: [x**-0.7], indexs))
    reg = LinearRegression().fit(X, y)
    prediction_list = reg.predict(X)

    # 3. We assume the regression residuals obey a Gaussian distribution.
    # Then we use the residuals in the preceding regression analysis to train a Gaussian model 𝐻;
    residual_list = [prediction_list[i] - measure_value[i] for i in range(len(prediction_list))]
    parameters = norm.fit(residual_list)

    # 4. We use the regression model to predict 𝑥 𝑚𝑎𝑥 and get the corresponding residual 𝑅;
    subspace_max_idx = 0
    for i in range(len(prediction_list)):
        if measure_value[i] == subspace_max:
            subspace_max_idx = i
            break
    max_residual = residual_list[subspace_max_idx]
    with warnings.catch_warnings():
        warnings.filterwarnings("ignore")
        cd = norm(parameters[0], parameters[1]).cdf(max_residual)

    # 5. The p-value will be calculated via 𝑃(𝑅|𝐻).
    p = 0
    if np.isnan(cd):
        return p
    if cd > 0.5:
        p = 2 * (1 - cd)
    else:
        p = 2 * cd
    return 1 - p


def _seasonality(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return focus[0]['p']


def _similarity(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    scores = []
    for segment in focus:
        if segment.get('tag') == 'Compare':
            for item in segment.get('value'):
                scores.append(item['similarity_value'])
    return np.mean(scores)


def _trend(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    data = data[insight.measure][focus[0].get('scope')[0]:focus[0].get('scope')[1]].values
    if len(data) <= 3:
        return 0
    else:
        X = np.array(range(len(data))).reshape(-1, 1)
        y = data
        reg = LinearRegression()
        reg.fit(X, y)
        # r^2
        r2 = reg.score(X, y) * 2
        if r2 < 0:
            r2 = 0
        # slope
        slope = reg.coef_[0]
        vals = logistic.cdf(slope, loc=0, scale=0.00001)[0]
        if slope >= 0:
            p = (1 - vals)
        else:
            p = vals
        sig = r2 * (1 - p)
        return sig


def _univariate_distribution(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    all_data = data[insight.measure].values.reshape(-1)
    subspace_data = np.random.choice(data[insight.measure][insight.subspace[0]:insight.subspace[1]].values.reshape(-1),
                                     len(all_data))
    s = distance.jensenshannon(subspace_data, all_data)
    if not np.isnan(s):
        return s
    return 0


def _univariate_outlier(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return focus[0]['score']


score_methods = {
    InsightType.autocorrelation: _autocorrelation,
    InsightType.clustering: _clustering,
    InsightType.forecasting: _forecasting,
    InsightType.frequent_pattern: _frequent_pattern,
    InsightType.multivariate_distribution: _multivariate_distribution,
    InsightType.multivariate_outlier: _multivariate_outlier,
    InsightType.outstanding: _outstanding,
    InsightType.seasonality: _seasonality,
    InsightType.similarity: _similarity,
    InsightType.trend: _trend,
    InsightType.univariate_distribution: _univariate_distribution,
    InsightType.univariate_outlier: _univariate_outlier
}


def score(data: pd.DataFrame, insight: Insight, focus: List[Dict]):
    return score_methods[insight.type](data, insight, focus)
