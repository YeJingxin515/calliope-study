import * as d3 from "d3";
const parseTime = (date) => {
    if (d3.timeParse("%Y-%m-%d")(date))
        return d3.timeParse("%Y-%m-%d")(date);
    else if (d3.timeParse("%Y/%m/%d")(date))
        return d3.timeParse("%Y/%m/%d")(date);
    else if (d3.timeParse("%Y-%m")(date))
        return d3.timeParse("%Y-%m")(date);
    else if (d3.timeParse("%Y/%m")(date))
        return d3.timeParse("%Y/%m")(date);
    else if (d3.timeParse("%Y")(date))
        return d3.timeParse("%Y")(date);
    else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
        return d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date)
    else if (d3.timeParse("%Y-%m-%d %H:%M:%S")(date))
        return d3.timeParse("%Y-%m-%d %H:%M:%S")(date)
    else if (d3.timeParse("%Y-%m-%d %H:%M:%S.%f")(date))
        return d3.timeParse("%Y-%m-%d %H:%M:%S.%f")(date)
    else 
    {   
        return date
    }

}
const formatTick = (date) => {
    if (d3.timeParse("%Y-%m-%d")(date))
        return d3.timeFormat("%Y-%-m-%-d");

    else if (d3.timeParse("%Y/%m/%d")(date)){
        return d3.timeFormat("%Y/%-m/%-d")
    }

    else if (d3.timeParse("%Y-%m")(date))
        return d3.timeFormat("%Y%-m")

    else if (d3.timeParse("%Y/%m")(date))
        return d3.timeFormat("%Y/%m")

    else if (d3.timeParse("%Y")(date))
        return d3.timeFormat("%Y")

    else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
        return d3.timeFormat("%Y-%m-%dT%H:%M:%S.%fZ")

    else if (d3.timeParse("%Y-%m-%d %H:%M:%S")(date))
        return d3.timeFormat("%Y-%m-%d %H:%M:%S")

    else if (d3.timeParse("%Y-%m-%d %H:%M:%S.%f")(date)){
        return d3.timeFormat("%Y-%m-%d %H:%M:%S.%f")
    }

    else{
        return ""
}
}
const formatTicksCount = (date) => {
    if (d3.timeParse("%Y-%m-%d")(date))
        return d3.timeDay
    else if (d3.timeParse("%Y/%m/%d")(date))
        return d3.timeDay
    else if (d3.timeParse("%Y-%m")(date))
        return d3.timeMonth
    else if (d3.timeParse("%Y/%m")(date))
        return d3.timeMonth
    else if (d3.timeParse("%Y")(date))
        return d3.timeYear
    else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
        return d3.timeFormat("%Y-%m-%dT%H:%M:%S.%fZ")
    else if (d3.timeParse("%Y-%m-%d %H:%M:%S")(date))
        return d3.timeFormat("%Y-%m-%d %H:%M:%S")
    else if (d3.timeParse("%Y-%m-%d %H:%M:%S.%f")(date))
        return d3.timeFormat("%Y-%m-%d %H:%M:%S.%f")
}
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const WEEK = DAY * 7
const MONTH = DAY * 30
const YEAR = DAY * 365
const parseIntervalString = (interval) => {
    if (interval / SECOND < 1) {
        return interval + ' ms'
    } else if (interval / MINUTE < 1) {
        return (interval / SECOND).toFixed(1) + ' s'
    } else if (interval / HOUR < 1) {
        return (interval / MINUTE).toFixed(1) + ' min(s)'
    } else if (interval / DAY < 1) {
        return (interval / HOUR).toFixed(1) + ' hour(s)'
    } else if (interval / WEEK < 1) {
        return (interval / DAY).toFixed(1) + ' day(s)'
    } else if (interval / MONTH < 1) {
        return (interval / WEEK).toFixed(1) + ' week(s)'
    } else if (interval / YEAR < 1) {
        return (interval / MONTH).toFixed(1) + ' month(s)'
    } else {
        return (interval / YEAR).toFixed(1) + ' year(s)'
    }
}
export {parseTime,formatTick,formatTicksCount,parseIntervalString}