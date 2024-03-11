import pandas as pd

from app.preprocessing.const import PandasTimeLabel


def parse_granularity(time1, time2):
    time_delta = (time2 - time1).total_seconds() * 1e3

    # millisecond
    if time_delta < 1000:
        return PandasTimeLabel.Millisecond.name, time_delta
    # second
    elif time_delta < 60000:
        return PandasTimeLabel.Second.name, (time_delta // 1000)
    # minute
    elif time_delta < 3600000:
        return PandasTimeLabel.Minute.name, (time_delta // 60000)
    # hour
    elif time_delta < 3600000 * 24:
        return PandasTimeLabel.Hour.name, (time_delta // 3600000)
    # day
    elif time_delta < 3600000 * 24 * 7:
        return PandasTimeLabel.Day.name, (time_delta // (3600000 * 24))
    # week
    elif time_delta < 3600000 * 24 * 30:
        return PandasTimeLabel.Week.name, (time_delta // (3600000 * 24 * 7))
    # month
    elif time_delta < 3600000 * 24 * 365:
        return PandasTimeLabel.Month.name, (time_delta // (3600000 * 24 * 30))
    # year
    else:
        return PandasTimeLabel.Year.name, (time_delta // (3600000 * 24 * 365))