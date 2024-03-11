import string
import numpy as np
import pandas as pd
from typing import List
from statistics import mean
from statsmodels.tsa.seasonal import seasonal_decompose

from ..common.utils import ChartTemplateConfiguration, parse_freq, detect_period


def extract(data: pd.DataFrame, config: ChartTemplateConfiguration, **kwargs) -> List[List[dict]]:
    """
    Find trend insight in univariate temporal data
    :param data:
        DataFrame,Raw time series data
    :param json_requires:
        dict,The JSON content needed to draw the diagram
    :param kwargs:
        Optional parameters
    :return:
        dict,The corresponding JSON format of the visual chart
    """
    if config.time_field in data.columns:
        freq = parse_freq(data, config.time_field)
    else:
        freq = config.insight.breakdown
    raw_data = data.copy(deep=True)
    data = data[config.insight.measure[0]]
    potential_period = detect_period(data, freq)
    if potential_period > (config.insight.subspace[1] - config.insight.subspace[0]) // 2:
        potential_period = potential_period // 2

    # Slice a dataframe here
    data = raw_data[config.insight.measure][config.insight.subspace[0]:config.insight.subspace[1]]
    all_scale = np.max(data.values) - np.min(data.values)
    if all_scale == 0:
        return []

    try:
        # Use moving averages for seasonal decomposition
        data, raw_trends, trend_field, decompose_result = decompose(data, config.insight.measure[0], potential_period)
        # calculate trend
        sorted_insight = find_trend(decompose_result, raw_trends, trend_field, all_scale)
        # Process the data
        if 'Up Trend' in data.columns:
            data.drop(columns=["Up Trend"], inplace=True)
        if 'Down Trend' in data.columns:
            data.drop(columns=["Down Trend"], inplace=True)
    except Exception as e:
        print(e)
        return []

    focus = []
    for trend in sorted_insight:
        if trend['index'][-1] - trend['index'][0] >= potential_period:
            focus.append([{
                'field': config.insight.measure[0],
                'scope': [trend['index'][0], trend['index'][-1]],
                'value': trend['scale'],
                'regression': trend['data']
            }])
    return focus


def decompose(df, value_field, potential_period):
    """
    Mining trends based on the data and corresponding sequence names
    :param df:
        DataFrame,Raw time series data
    :param value_field:
        string, time series column name
    :return:
        Result of analysis
    """
    # Use moving averages for seasonal decomposition
    decompose_result = seasonal_decompose(df.copy(), period=potential_period, extrapolate_trend="freq")
    # The decomposed trend results are saved in the original data to form new columns
    trend_field = value_field + "_trend"
    df[trend_field] = decompose_result.trend
    data = df.reset_index()
    # identify trends
    raw_trends = identify_df_trends(data, trend_field, window_size=5)
    return data, raw_trends, trend_field, decompose_result


def find_trend(decompose_result, raw_trends, trend_field, all_scale):
    """
    Look for trend insights based on seasonal decomposition results
    :param decompose_result:
        seasonal decompose results
    :param raw_trends:
        DataFrame,Raw time series trend data
    :param trend_field:
        string,column name of trend data
    :return:
        list, trends list sorted by scale
    """
    trends = []
    current_up_idx = []
    current_up = []
    current_down_idx = []
    current_down = []
    for index, item in raw_trends.iterrows():
        if "Up Trend" in raw_trends.columns and not pd.isna(item["Up Trend"]):
            current_up_idx.append(index)
            current_up.append(item[trend_field])
        elif len(current_up_idx) != 0:
            trends.append({
                "index": current_up_idx,
                "data": current_up,
                "scale": abs((current_up[-1] - current_up[0]) / all_scale)
            })
            current_up_idx = []
            current_up = []
        if "Down Trend" in raw_trends.columns and not pd.isna(item["Down Trend"]):
            current_down_idx.append(index)
            current_down.append(item[trend_field])
        elif len(current_down_idx) != 0:
            trends.append({
                "index": current_down_idx,
                "data": current_down,
                "scale": abs((current_down[-1] - current_down[0]) / all_scale)
            })
            current_down_idx = []
            current_down = []
    sorted_insight = sorted(trends, key=lambda t: t["scale"], reverse=True)
    return sorted_insight


def judge_df_format(df, trend_field, window_size, identify):
    """
    Determine whether the data format is correct
    :param df:
        Dataframe,Time series data
    :param trend_field:
        string,Column name of the trend data
    :param window_size:
        int,Sliding window size
    :param identify:
        string,Pattern of trends
    :return:
        None
    """
    if df is None:
        raise ValueError("df argument is mandatory and needs to be a `pandas.DataFrame`.")

    if not isinstance(df, pd.DataFrame):
        raise ValueError("df argument is mandatory and needs to be a `pandas.DataFrame`.")

    if trend_field is None:
        raise ValueError("column parameter is mandatory and must be a valid column name.")

    if trend_field and not isinstance(trend_field, str):
        raise ValueError("column argument needs to be a `str`.")

    if trend_field not in df.columns:
        raise ValueError("introduced column does not match any column from the specified `pandas.DataFrame`.")
    if not isinstance(window_size, int):
        raise ValueError("window_size must be an `int`")

    if isinstance(window_size, int) and window_size < 3:
        raise ValueError("window_size must be an `int` equal or higher than 3!")

    if not isinstance(identify, str):
        raise ValueError("identify should be a `str` contained in [both, up, down]!")

    if isinstance(identify, str) and identify not in ["both", "up", "down"]:
        raise ValueError("identify should be a `str` contained in [both, up, down]!")


def extract_trends_obj(df, trend_field, identify):
    """
    Extract objects based on the parsed trend
    :param df:
        Dataframe,Time series data
    :param trend_field:
        string,Column name of the trend data
    :param identify:
        string,Pattern of trends
    :return:
        list,The extracted object
    """
    objs = list()
    up_trend = {"name": "Up Trend", "element": np.negative(df[trend_field])}
    down_trend = {"name": "Down Trend", "element": df[trend_field]}
    if identify == "both":
        objs.append(up_trend)
        objs.append(down_trend)
    elif identify == "up":
        objs.append(up_trend)
    elif identify == "down":
        objs.append(down_trend)
    return objs


def struct_trend_result(df, objs, window_size):
    """
    Form trends into fixed results
    :param df:
        Dataframe,Time series data
    :param objs:
        list,The extracted object
    :param window_size:
        int,Sliding window size
    :return:
        dict,fixed results of trend in time series data
    """
    results = dict()
    for obj in objs:
        limit = None
        values = list()
        trends = list()
        for index, value in enumerate(obj["element"], 0):
            if limit and limit > value:
                values.append(value)
                limit = mean(values)
            elif limit and limit < value:
                if len(values) > window_size:
                    min_value = min(values)

                    for counter, item in enumerate(values, 0):
                        if item == min_value:
                            break
                    to_trend = min(from_trend + counter, len(df) - 1)
                    trend = {
                        "from": df.index.tolist()[from_trend],
                        "to": df.index.tolist()[to_trend],
                    }
                    trends.append(trend)
                limit = None
                values = list()
            else:
                from_trend = index
                values.append(value)
                limit = mean(values)
        if len(values) > 1:
            trends.append({"from": df.index.tolist()[from_trend], "to": df.index.tolist()[-1]})
        results[obj["name"]] = trends
    return results


def identify_trends_by_model(df, identify, results):
    """
    According to the trend results, mark the trend location and construct the data form
    :param df:
        Dataframe,Time series data
    :param identify:
        string,Pattern of trends
    :param results:
        dict,fixed results of trend in time series data
    :return:
        Dataframe,The parsed data form
    """
    if identify == "both":
        up_trends = list()

        for up in results["Up Trend"]:
            flag = True

            for down in results["Down Trend"]:
                if down["from"] < up["from"] < down["to"] or down["from"] < up["to"] < down["to"]:
                    if (up["to"] - up["from"]) > (down["to"] - down["from"]):
                        flag = True
                    else:
                        flag = False
                else:
                    flag = True

            if flag is True:
                up_trends.append(up)

        labels = [letter for letter in string.ascii_uppercase[:len(up_trends)]]

        for up_trend, label in zip(up_trends, labels):
            for index, row in df[up_trend["from"]:up_trend["to"]].iterrows():
                df.loc[index, "Up Trend"] = label

        down_trends = list()

        for down in results["Down Trend"]:
            flag = True

            for up in results["Up Trend"]:
                if up["from"] < down["from"] < up["to"] or up["from"] < down["to"] < up["to"]:
                    if (up["to"] - up["from"]) < (down["to"] - down["from"]):
                        flag = True
                    else:
                        flag = False
                else:
                    flag = True

            if flag is True:
                down_trends.append(down)

        labels = [letter for letter in string.ascii_uppercase[:len(down_trends)]]

        for down_trend, label in zip(down_trends, labels):
            for index, row in df[down_trend["from"]:down_trend["to"]].iterrows():
                df.loc[index, "Down Trend"] = label

        return df
    elif identify == "up":
        up_trends = results["Up Trend"]

        up_labels = [letter for letter in string.ascii_uppercase[:len(up_trends)]]

        for up_trend, up_label in zip(up_trends, up_labels):
            for index, row in df[up_trend["from"]:up_trend["to"]].iterrows():
                df.loc[index, "Up Trend"] = up_label

        return df
    elif identify == "down":
        down_trends = results["Down Trend"]

        down_labels = [letter for letter in string.ascii_uppercase[:len(down_trends)]]

        for down_trend, down_label in zip(down_trends, down_labels):
            for index, row in df[down_trend["from"]:down_trend["to"]].iterrows():
                df.loc[index, "Down Trend"] = down_label

        return df


def identify_df_trends(df, trend_field, window_size=5, identify="both"):
    """
    Look for trends in the sequence
    :param df:
        DataFrame,Time series data
    :param trend_field:
        string,Trend column name identified based on raw time series data (in updated data files)
    :param window_size:
        int,The size of the sliding window to identify trends
    :param identify:
        string,Identify patterns adopted by trends.By default, various trends will be identified["both", "up", "down"]
    :return:
        Dataframe,The parsed data form
    """
    # Determine whether the data format is correct
    judge_df_format(df, trend_field, window_size, identify)
    # Extract objects based on the parsed trend
    objs = extract_trends_obj(df, trend_field, identify)
    # Form trends into fixed results
    results = struct_trend_result(df, objs, window_size)
    # According to the trend results, mark the trend location and construct the data form
    df = identify_trends_by_model(df, identify, results)
    return df
