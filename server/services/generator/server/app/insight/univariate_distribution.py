import pandas as pd
from typing import List

from ..common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List:
    """
    Find univariate_distribution insight in univariate temporal data
    :param data:
        DataFrame,Raw time series data
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param kwargs:
        Optional parameters
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    data = data[config.insight.measure[0]][config.insight.subspace[0]:config.insight.subspace[1]]
    value_field = config.insight.measure[0]
    insight = {
        'mean': float(data.mean()),
        'mean+2std': float(data.mean() + 2 * data.std()),
        'mean-2std': float(data.mean() - 2 * data.std()),
        'min': float(data.min()),
        'max': float(data.max())
    }
    return [[{'field': value_field, 'value': value, 'name': key} for key, value in insight.items()]]
