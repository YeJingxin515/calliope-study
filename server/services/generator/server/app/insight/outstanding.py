import numpy as np
import pandas as pd
from typing import List

from app.common.utils import ChartTemplateConfiguration


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Find outstanding insight in univariate temporal data
    :param data:
        DataFrame,Raw time series data
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param kwargs:
        Optional parameters
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    outstanding_idx = np.argmax(data[config.insight.measure[0]][config.insight.subspace[0]:config.insight.subspace[1]])
    return [[{
        'field': config.insight.measure[0],
        'name': 'top1',
        'index': int(outstanding_idx),
        'value': float(np.max(data[config.insight.measure[0]][config.insight.subspace[0]:config.insight.subspace[1]]))
    }]]
