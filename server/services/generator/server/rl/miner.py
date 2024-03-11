import os

import pandas as pd
import torch

from app.common.const import InsightType
from app.common.entity import Insight
from app.common.utils import ChartTemplateConfiguration
from app.insight.autocorrelation import extract as extract_autocorrelation
from app.insight.frequent_pattern import extract as extract_frequent_pattern
from app.insight.multivariate_distribution import extract as extract_multivariate_distribution
from app.insight.multivariate_outlier import extract as extract_multivariate_outlier
from app.insight.outstanding import extract as extract_outstanding
from app.insight.seasonality import extract as extract_seasonality
from app.insight.similarity import extract as extract_similarity
from app.insight.trend import extract as extract_trend
from app.insight.univariate_distribution import extract as extract_univariate_distribution
from app.insight.univariate_outlier import extract as extract_univariate_outlier
from app.insight.score import score


class InsightMiner:
    def __init__(self):
        self.extract_func = {
            InsightType.autocorrelation: extract_autocorrelation,
            InsightType.frequent_pattern: extract_frequent_pattern,
            InsightType.multivariate_distribution: extract_multivariate_distribution,
            InsightType.multivariate_outlier: extract_multivariate_outlier,
            InsightType.outstanding: extract_outstanding,
            InsightType.seasonality: extract_seasonality,
            InsightType.similarity: extract_similarity,
            InsightType.trend: extract_trend,
            InsightType.univariate_distribution: extract_univariate_distribution,
            InsightType.univariate_outlier: extract_univariate_outlier
        }
        self.cache = None

    def mine(self, data: pd.DataFrame, time_field: str, insight: Insight, file_path: str = '.'):
        config = ChartTemplateConfiguration(insight=insight, time_field=time_field, file_path=file_path)
        kwargs = {}
        if insight.type == InsightType.similarity:
            kwargs['base_variable'] = insight.measure[0]
        focus = self.extract_func[insight.type](data, config, **kwargs)
        score_ = 0
        if len(focus) != 0:
            insight.parameter = focus[0]
            score_ = score(data.copy(), insight, focus[0])
        return insight, score_

    def load(self, path: str):
        if path and os.path.exists(path):
            self.cache = torch.load(path)

    def save(self, path: str):
        if path:
            torch.save(self.cache, path)
