import enum


class InsightType(enum.IntEnum):
    autocorrelation = 0
    frequent_pattern = 1
    multivariate_distribution = 2
    multivariate_outlier = 3
    outstanding = 4
    seasonality = 5
    similarity = 6
    trend = 7
    univariate_distribution = 8
    univariate_outlier = 9
    clustering = 10
    forecasting = 11

UNIVARIATE_INSIGHT = [
    InsightType.autocorrelation, InsightType.frequent_pattern, InsightType.outstanding, InsightType.seasonality,
    InsightType.trend, InsightType.univariate_distribution, InsightType.univariate_outlier
]

MULTIVARIATE_INSIGHT = [InsightType.multivariate_distribution, InsightType.multivariate_outlier, InsightType.similarity]

GLOBAL_INSIGHT = [InsightType.seasonality, InsightType.frequent_pattern, InsightType.similarity, InsightType.clustering]

TIME_FORMAT = ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S', '%Y/%m/%d', '%Y-%m', '%Y-%m-%d']

class PandasTimeLabel(enum.Enum):
    Millisecond = 'L'
    Second = 'S'
    Minute = 'T'
    Hour = 'H'
    Day = 'D'
    Month = 'M'
    Year = 'A'


class ActionType(enum.Enum):
    # type-related
    Type = 0
    # subspace-related
    Previous = 1
    Proceeding = 2
    Periodic = 3
    # measure-related
    Variable = 4
    Expand = 5
    Narrow = 6
    # EOS
    Eos = 7
    Unknown = 8
