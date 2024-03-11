import * as d3 from "d3";
import Chart from "../../chart";
import { tooltipContainerId } from "../constant/getContainer";
import { getPosition } from "../constant/getPosition";
import { parseTime, formatTick, formatTicksCount } from '../constant/timeConstant'
const ENGFONT = "OPPOSans";
const COLOR_REGULAR = "#808080";
const COLOR_CONF = "#E4E4E4";
const COLOR_OUTLIER = "#F72D35"
const COLOR_GRID = "#E6E6E6";
const COLOR_AXIS = "#000000";

class UnivariateOutlier extends Chart {
    constructor() {
        super();
        this._x = "";
        this._y = "";
    }

    display() {

        let factData = this.factdata()
        let measure = this.measure();
        let breakdown = this.breakdown();
        let focus = this.focus();
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))

        let data = factData
        let measureName = measure[0].aggregate === "count" ? "COUNT" : measure[0].field
        if (focus.length === 0) return

        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 280 }
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        }
        let tickSize = 10
        let tickWidth = 2
        let width = chartSize.width - margin.left - margin.right,
            height = chartSize.height - margin.top - margin.bottom;

        let containerSelector = tooltipContainerId
        let svg = d3.select(this.container())
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")")
            .attr("font-family", ENGFONT);

        // set the ranges
        let x = d3.scaleTime()
            .range([0, width - 10])
        // .padding(0.1);
        let y = d3.scaleLinear()
            // 20 = 5(tick) + 5(margin) + 10(text)
            .range([height - 20, 0]);

        // Scale the range of the data in the domains
        x.domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }));
        y.domain(d3.extent([].concat(
            data.map(function (d) { return d[measure[0].field] }),
            // lower.map(function (d) { return d* 0.95 }),
            // heigher.map(function (d) { return d* 1.05}),
            // lower boundary minus margin
            data.map(function (d) { return focus[0]['lower'] * 0.95 }),
            // upper boundary add margin
            data.map(function (d) { return focus[0]['upper'] * 1.05 })
        )));

        // add the x Axis
        let format_TicksCount = formatTicksCount(data[0][breakdown[0].field]);
        let tick_format = formatTick(data[0][breakdown[0].field]);
        let axisX = d3.axisBottom(x).tickFormat(tick_format)
        if (format_TicksCount === d3.timeYear) {
            axisX.ticks(format_TicksCount)
        }

        let lineLayer = svg.append("g").attr("class", "lineLayer")

        lineLayer.append("g").selectAll("line.line")
            .data(y.ticks(5)).enter().append("line")
            .attr("x1", 0)
            .attr("x2", chartSize.width)
            .attr("y1", function (d) { return y(d) })
            .attr("y2", function (d) { return y(d) })
            .attr("stroke", COLOR_GRID)
            .attr("stroke-width", "2px")

        // draw confidence interval first as background
        let conf_data = []
        for (let i = 0; i < focus[0]['lower'].length; i++) {
            conf_data.push({
                'time': data[i][breakdown[0].field],
                'lower': focus[0]['lower'][i],
                'upper': focus[0]['upper'][i]
            })
        }
        let conf_int = d3.area().curve(d3.curveMonotoneX)
            .x(function (d) { return x(parseTime(d['time'])) })
            .y0(function (d) { return y(d['lower']) })
            .y1(function (d) { return y(d['upper']) })
        lineLayer.append("path")
            .attr("stroke", COLOR_CONF)
            .attr("fill", COLOR_CONF)
            .attr("opacity", 0.7)
            .attr("d", conf_int(conf_data))

        let lineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(parseTime(d[breakdown[0].field]));
            })
            .y(function (d) {
                return y(d[measureName]);
            })
        let forecastLineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(parseTime(d.x));
            })
            .y(function (d) {
                return y(d.y);
            })
        let rawPath = lineLayer.append("path")
            .attr("d", lineGen(data))
            .attr("stroke", COLOR_REGULAR)
            .attr("stroke-width", "3px")
            .attr("fill", "none")

        let tooltipLayer = svg.append("g").attr("class", "tooltip");
        let tickValues = [];
        for (let outlier of focus) {
            let outlierX, outlierY, up, start, end
            if (outlier.scope[0] !== outlier.scope[1]) {
                start = Math.max(0, outlier.scope[0] - 1)
                end = Math.min(data.length - 1, outlier.scope[1] + 1)

                let startX = x(parseTime(data[start][breakdown[0].field]))
                let endX = x(parseTime(data[end][breakdown[0].field]))

                outlierX = (startX + endX) / 2
                let middle = Math.floor((start + end) / 2)
                if (data[middle][measureName] < focus[0]['lower'][middle]) {
                    outlierY = d3.max(data.slice(start, end + 1),
                        function (d) { return y(d[measureName]) })
                    up = false
                } else {
                    // else if (data[middle][measureName] > data[middle][measure[0].upper]) {
                    outlierY = d3.min(data.slice(start, end + 1),
                        function (d) { return y(d[measureName]) })
                    up = true
                }

                tooltipLayer.append("line")
                    .attr("x1", startX)
                    .attr("y1", y(data[start][measureName]))
                    .attr("x2", startX)
                    .attr("y2", height - 20)
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "6, 3");
                tooltipLayer.append("line")
                    .attr("x1", endX)
                    .attr("y1", y(data[end][measureName]))
                    .attr("x2", endX)
                    .attr("y2", height - 20)
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "6, 3");
                tickValues.push(parseTime(data[start][breakdown[0].field]))
                tickValues.push(parseTime(data[end][breakdown[0].field]))
            } else {
                start = Math.max(0, outlier.start - 1)
                end = Math.min(data.length, outlier.scope[1] + 1)
                outlierX = x(parseTime(data[outlier.scope[0]][breakdown[0].field]))
                outlierY = y(data[outlier.scope[0]][measureName])
                if (data[outlier.scope[0]][measureName] < focus[0]['lower'][outlier.scope[0]]) {
                    up = false
                } else {
                    // else if (data[outlier.start][measureName] > data[outlier.start][measure[0].upper]) {
                    up = true
                }

                tooltipLayer.append("line")
                    .attr("x1", outlierX)
                    .attr("y1", outlierY)
                    .attr("x2", outlierX)
                    .attr("y2", height - 20)
                    .attr("stroke", "black")
                    .attr("stroke-dasharray", "6, 3");
                tooltipLayer.append("circle").attr("class", "focusDot")
                    .attr("cx", outlierX)
                    .attr("cy", outlierY)
                    .attr("r", "4px")
                    .attr("stroke", COLOR_OUTLIER)
                    .attr("fill", COLOR_OUTLIER)
                tickValues.push(parseTime(data[outlier.scope[0]][breakdown[0].field]))
            }
            let forecastPts = []
            let ptIndex = start
            if (outlier.scope[0] !== 0) {
                forecastPts.push({
                    x: data[ptIndex][breakdown[0].field],
                    y: data[ptIndex][measureName]
                })
                ptIndex += 1
            }
            for (; ptIndex < end; ptIndex++) {
                forecastPts.push({
                    x: data[ptIndex][breakdown[0].field],
                    y: focus[0]['forecast'][ptIndex]
                })
            }
            if (outlier.scope[1] !== data.length - 1) {
                forecastPts.push({
                    x: data[ptIndex][breakdown[0].field],
                    y: data[ptIndex][measureName]
                })
            } else {
                forecastPts.push({
                    x: data[ptIndex][breakdown[0].field],
                    y: focus[0]['forecast'][ptIndex]
                })
            }

            tooltipLayer.append("path")
                .attr("d", forecastLineGen(forecastPts))
                .attr("stroke", "#B1B1B1")
                .attr("stroke-width", "3px")
                .attr("stroke-dasharray", "6, 3")
                .attr("fill", "none")
            tooltipLayer.append("path")
                .attr("d", lineGen(data.slice(start, end + 1)))
                .attr("stroke", COLOR_OUTLIER)
                .attr("stroke-width", "5px")
                .attr("fill", "none")

            let tooltip = tooltipLayer.append("g")
            let tooltipText = tooltip.append("text")
                .attr("font-size", "10px")
                .attr("font-family", ENGFONT)
                .attr("stroke", COLOR_OUTLIER)
            tooltipText.append("tspan")
                .text("Anomaly score: " + outlier.score.toFixed(2))
                .attr("dy", tooltipText.selectAll("tspan").node().getBBox().height * 0.9)
            let textWidth = tooltip.node().getBBox().width;
            let textHeight = tooltip.node().getBBox().height;
            let textY = outlierY
            if (up) {
                textY -= (textHeight + 8)
            } else {
                textY += 8
            }

            tooltip.append("image")
                .attr("xlink:href", "./alert.svg")
                .attr("width", "15px")
                .attr("height", "13px")
                .attr("x", (outlierX - (textWidth + 17) / 2))
                .attr("y", textY + 2);
            tooltipText.attr("width", textWidth)
                .attr("height", textHeight)
                .attr("x", (outlierX - (textWidth + 17) / 2) + 17)
                .attr("y", textY);

        }
        axisX.tickValues(tickValues)

        if (this._showTooltip) {
            renderDetailValue(containerSelector, rawPath, x, y, height,
                data, breakdown, measureName, tick_format, tooltipLayer)
        }
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + (height - 20) + ")")
            .call(axisX)
            .attr("font-family", ENGFONT)
            .call(g => {
                g.attr("font-size", tickSize);
                g.attr("font-family", ENGFONT);

                let domainD = g.selectAll(".domain").attr("d");
                domainD = domainD.replace("6V", (6 * chartSize.height / 320) + "V")
                domainD = domainD.replace("V6", "V" + (6 * chartSize.height / 320))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                g.selectAll(".tick")
                    .selectAll("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", tickWidth)
                    .attr("y2", 6 * chartSize.height / 320);

                g.selectAll("text")
                    .attr("y", 9 * chartSize.height / 320);
            });

        // add the y Axis
        svg.append("g")
            .attr("class", "yAxis")
            .call(d3.axisLeft(y).ticks(5).tickFormat(function (d) {
                if ((d / 1000000) >= 1) {
                    d = d / 1000000 + "M";
                } else if ((d / 1000) >= 1) {
                    d = d / 1000 + "K";
                }
                return d;
            }))
            .call(g => {
                g.attr("font-size", "10px")
                g.attr("font-weight", "light")
                g.attr("font-family", ENGFONT)

                let domainD = g.selectAll(".domain").attr("d");
                domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", tickWidth)
                    .attr("x2", -6 * chartSize.width / 640);

                g.selectAll("text")
                    .attr("x", -9 * chartSize.width / 640);
            });

        return svg;
    }

}


let getSizeBySize = (size, chartSize, fact, hasSeries = false, moreThan6 = false) => {
    let tickSize, annotationSize, tickWidth, dotR, strokeWidth;

    switch (size) {
        case "small":
            tickSize = 10;
            annotationSize = 16;
            tickWidth = 2;
            dotR = 5;
            strokeWidth = 2;
            break;
        case "middle":
            tickSize = 10;
            annotationSize = 20;
            tickWidth = 2;
            dotR = 5;
            strokeWidth = 3;
            break;
        case "wide":
            tickSize = 10;
            annotationSize = 26;
            dotR = 7;
            tickWidth = 2;
            strokeWidth = 3;
            break;
        case "large":
        default:
            tickSize = 10;
            annotationSize = 40;
            tickWidth = 2;
            dotR = 10;
            strokeWidth = 3;
            break;
    }
    const chartMargin = {
        "small": {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        },
        "middle": {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        },
        "wide": {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        },
        "large": {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        }
    };
    let margin = chartMargin[size];
    return { chartSize: chartSize, margin: margin, tickSize: tickSize, annotationSize: annotationSize, tickWidth, dotR, strokeWidth }
}

let renderDetailValue = (containerSelector, rawPath, x, y, height,
    data, breakdown, measureName, tick_format, tooltipLayer) => {
    let detailValueTooltip = d3.select(containerSelector)
        .append("div")
        .attr("id", "value-tooltip")
        .style("z-index", 2000)
        .style("width", "fit-content")
        .style("height", "40px")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("border-radius", "4px")
        .style("background", "#FFFFFF")
        .style("box-shadow", "0 0 5px #888888")
        .style("padding", "5px")
    let detailValueTitle = detailValueTooltip.append("span")
        .style("font", `9px ${ENGFONT}`)
        .style("font-weight", "bold")
        .style("display", "block")
        .style("color", "#000000")



    let detailValueContent = detailValueTooltip.append("svg")
        .attr("width", "95px")
        .attr("height", "30px")
        .style("display", "block")
        .style("word-break", "normal")
        .style("word-warp", "break-word")
        .style("overflow", "hidden")

    let detailValueColor = detailValueContent.append("circle")
        .attr("r", 4)
        .attr("cx", "5px")
        .attr("cy", "12px")
    let detailValueText = detailValueContent.append("text")
        .style("font", `8px ${ENGFONT}`)
        .style("color", "#000000")
        .attr("x", "14px")
        .attr("y", "14px")

    rawPath.on("mouseover", function (d) {
        detailValueTooltip.transition()
            .duration(200)
            .style("opacity", .9)
        detailValue.transition()
            .duration(200)
            .style("opacity", 1)
    })
        .on("mouseout", function (d) {
            // If the mouse is exactly on the data point, 
            // then the mouse will on the circle instead of the path
            // So here we should keep the tooltip shown when the mouse is still on the circle
            let currentElement = document.elementFromPoint(d3.event.pageX, d3.event.pageY)
            if (currentElement !== detailValueCircle.node()) {
                detailValueTooltip.transition()
                    .duration(500)
                    .style("opacity", 0)
                detailValue.transition()
                    .duration(500)
                    .style("opacity", 0)
            }
        })
        .on("mousemove", function (d) {
            let result = getPosition()
            let x0 = x.invert(d3.mouse(this)[0])
            let currentIndex = bisectDate(data, x0, 1)
            let time0 = parseTime(data[currentIndex - 1][breakdown[0].field])
            let time1 = parseTime(data[currentIndex][breakdown[0].field])
            let currentTime = x0 - time0 > time1 - x0 ? time1 : time0
            let currentValue = currentTime === time0 ? data[currentIndex - 1][measureName] : data[currentIndex][measureName]
            let title = tick_format(currentTime)
            detailValueTooltip.style("left", (result.posX + 30) + "px")
                .style("top", (result.posY + 20) + "px")
            detailValueTitle.html(title)
            detailValueColor.style("fill", COLOR_REGULAR)
            detailValueText.html(measureName + ": " + currentValue.toFixed(2))

            detailValueLine.attr("x1", x(currentTime))
            detailValueLine.attr("x2", x(currentTime))
            detailValueCircle.attr("cx", x(currentTime))
            detailValueCircle.attr("cy", y(currentValue))
            detailValueCircle.attr("stroke", COLOR_REGULAR)
        })

    let bisectDate = d3.bisector(function (d) { return parseTime(d[breakdown[0].field]) }).left
    let detailValue = tooltipLayer.append("g")
        .style("opacity", 0)
    let detailValueLine = detailValue.append("line")
        .attr("y1", height - 20)
        .attr("y2", 0)
        .attr("stroke-width", "2px")
        .attr("stroke", COLOR_GRID)
        .attr("stroke-dasharray", "6, 3")
    let detailValueCircle = detailValue.append("circle")
        .attr("r", 3)
        .attr("fill", "#FFFFFF")
        .attr("stroke-width", "2")
        .style("box-shadow", "0 0 5px #888888")
        .on("mouseover", function (d) {
            // FIXME: This is a nit
            // Even mouse is not on the path, the tooltip will still be shown 
            // but the error area is small
            detailValueTooltip.transition()
                .duration(200)
                .style("opacity", .9)
            detailValue.transition()
                .duration(200)
                .style("opacity", 1)
        }).on("mouseout", function (d) {
            // If the mouse is exactly on the data point, 
            // then the mouse will on the circle instead of the path
            // So here we should hide all the tooltip when moving mouse out of the circle
            detailValueTooltip.transition()
                .duration(500)
                .style("opacity", 0)
            detailValue.transition()
                .duration(500)
                .style("opacity", 0)
        })
}

// const parseTime = (date) => {
//     if (d3.timeParse("%Y-%m-%d")(date))
//         return d3.timeParse("%Y-%m-%d")(date);
//     else if (d3.timeParse("%Y/%m/%d")(date))
//         return d3.timeParse("%Y/%m/%d")(date);
//     else if (d3.timeParse("%Y-%m")(date))
//         return d3.timeParse("%Y-%m")(date);
//     else if (d3.timeParse("%Y/%m")(date))
//         return d3.timeParse("%Y/%m")(date);
//     else if (d3.timeParse("%Y")(date))
//         return d3.timeParse("%Y")(date);
//     else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
//         return d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date)
//     else if (d3.timeParse("%Y-%m-%d %H:%M:%S")(date))
//         return d3.timeParse("%Y-%m-%d %H:%M:%S")(date)
//     else return date
// }
// const formatTick = (date) => {
//     if (d3.timeParse("%Y-%m-%d")(date))
//         return d3.timeFormat("%Y-%-m-%-d");
//     else if (d3.timeParse("%Y/%m/%d")(date))
//         return d3.timeFormat("%Y/%-m/%-d")
//     else if (d3.timeParse("%Y-%m")(date))
//         return d3.timeFormat("%Y-%m")
//     else if (d3.timeParse("%Y/%m")(date))
//         return d3.timeFormat("%Y/%m")
//     else if (d3.timeParse("%Y")(date))
//         return d3.timeFormat("%Y")
//     else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
//         return d3.timeFormat("%Y/%m/%d/%H")
//     else if (d3.timeParse("%Y-%m-%d %H:%M:%S")(date))
//         return d3.timeFormat("%Y/%m/%d %H:%M:%S")

//     else
//         return ""
// }

// const formatTicksCount = (date) => {
//     if (d3.timeParse("%Y-%m-%d")(date))
//         return d3.timeDay
//     else if (d3.timeParse("%Y/%m/%d")(date))
//         return d3.timeDay
//     else if (d3.timeParse("%Y-%m")(date))
//         return d3.timeMonth
//     else if (d3.timeParse("%Y/%m")(date))
//         return d3.timeMonth
//     else if (d3.timeParse("%Y")(date))
//         return d3.timeYear
// }

export default UnivariateOutlier;