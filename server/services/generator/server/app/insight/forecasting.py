import numpy as np
import pandas as pd
from typing import List, Dict
from prophet import Prophet

from ..common.utils import ChartTemplateConfiguration, parse_freq


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[Dict]]:
    forecasting_len = kwargs.get('forecasting_len', len(data) // 10)

    data = data[[config.time_field, config.insight.measure[0]]]
    df = data.rename(columns={config.time_field: 'ds', config.insight.measure[0]: 'y'})

    m = Prophet()
    m.fit(df)

    freq = parse_freq(df, 'ds')
    future = m.make_future_dataframe(periods=forecasting_len, freq=f'{freq[1]}{freq[0].value}')
    forecast = m.predict(future)

    predict_gap = np.mean(forecast.yhat_upper) - np.mean(forecast.yhat_lower)
    origin_gap = np.max(data[config.insight.measure[0]]) - np.min(data[config.insight.measure[0]])

    forecast = forecast[len(df):]
    focus = {
        'value': list(forecast.yhat),
        'low': list(forecast.yhat_lower),
        'up': list(forecast.yhat_upper),
        'score': max(1 - predict_gap / origin_gap, 0),
        'field': config.insight.measure[0]
    }
    return [[focus]]
