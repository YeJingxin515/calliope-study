import * as d3 from "d3";
import Chart from "../../chart";
import { uuid } from "../constant/uuid";
import { parseTime, formatTick, formatTicksCount, parseIntervalString } from '../constant/timeConstant'
import { tooltipContainerId } from "../constant/getContainer";

const ENGFONT = "OPPOSans";
const COLOR_REGULAR = "#808080";
const COLOR_SEASONAL = "#6C8EF2";
const COLOR_GRID = "#E6E6E6";
const COLOR_AXIS = "#000000";
const COLOR_TOOLTIP_DARK = "#3E3A39";
const COLOR_TOOLTIP_LIGHT = "#FCFBE7"
const NUM_TOOLTIP_DISPLAY_LEFT_PERIOD = 2
const NUM_TOOLTIP_DISPLAY_RIGHT_PERIOD = 3
const TICK_WIDTH = 2;

class Seasonality extends Chart {
    constructor() {
        super();
        this._x = "";
        this._y = "";
    }
    display() {
        /**
        * The main drawing function
        */
        //---------------parse fact-------------------------
        let factResult = this.parseFact()
        let data = factResult._data
        let measure = factResult._measure
        let breakdown = factResult._breakdown
        let focus = factResult._focus
        let measureName = factResult._measureName
        if (focus.length === 0) return
        if (breakdown[1] && breakdown[1].field) return;

        //---------------init chart size--------------------
        let chartResult = this.setChartStandard()
        let chartSize = chartResult._chartSize
        let width = chartResult._width
        let height = chartResult._height
        let margin = chartResult._margin

        let startIndex = data.length
        let endIndex = 0
        for (let seasonality of focus) {
            let interval = seasonality.interval
            for (let i = 0; i < seasonality.seasonal.length; i++) {
                startIndex = Math.max(0, Math.min(startIndex, seasonality.seasonal[i].start - Math.floor(interval / 2)))
                endIndex = Math.min(data.length, Math.max(endIndex, seasonality.seasonal[i].end + Math.floor(interval / 2)))
            }
        }
        data = data.slice(startIndex, endIndex)

        //------------------init---------------------------
        let containerSelector = tooltipContainerId
        //init svg
        let svg = this.initSvg(chartSize, margin)
        //init layer
        let lineLayer = svg.append("g").attr("class", "lineLayer")
        let tooltipLayer = svg.append("g").attr("class", "tooltip");

        //------------------draw x axis-------------------
        let xAxisResult = this.drawXAxis(svg, data, breakdown, width, height, chartSize)
        let x = xAxisResult._x
        let axisX = xAxisResult._axisX
        let tick_format = xAxisResult._tick_format
        //------------------draw y axis-------------------
        let y = this.drawYAxis(svg, data, measure, chartSize, height)

        //------------------draw original line------------
        let originLineResult = this.drawBackLine(x, y, data, lineLayer, breakdown, measureName, chartSize)
        let rawPath = originLineResult._rawPath
        let lineGen = originLineResult._lineGen

        //-----------------draw seasonality insight---------
        let tooltipPathList = this.drawSeasonality(x, data, breakdown, focus, height, tooltipLayer, axisX, lineGen, startIndex)
        if (this._showTooltip) {
            renderDetailValue(containerSelector, rawPath, x, y, height, data, breakdown, measureName, tick_format, tooltipLayer)
            renderTooltip(containerSelector, tick_format, data, breakdown, tooltipPathList, focus[0], x, measureName)
        }
        return svg;
    }
    parseFact() {
        /**
         * Parse fact json
         * return:The contents of each field in fact
         */
        let factData = this.factdata()
        let measure = this.measure();
        let breakdown = this.breakdown();
        let focus = this.focus();
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))
        let data = factData;
        let measureName = measure[0].aggregate === "count" ? "COUNT" : measure[0].field
        return { _data: data, _measure: measure, _breakdown: breakdown, _focus: focus, _measureName: measureName }
    }
    setChartStandard() {
        /** 
         * calculate size of the chart
         * return chart size parameters
         */
        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 280 }
        // eslint-disable-next-line
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        };
        let width = chartSize.width - margin.left - margin.right,
            height = chartSize.height - margin.top - margin.bottom;
        return { _width: width, _height: height, _chartSize: chartSize, _margin: margin }
    }
    initSvg(chartSize, margin) {
        /**
         * Initialize SVG based on the drawing area size
         * return :svg 
         */
        let svg = d3.select(this.container())
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")")
            .attr("font-family", ENGFONT);
        return svg
    }
    drawXAxis(svg, data, breakdown, width, height, chartSize) {
        /**
         * Draw the X axis
         */
        // set the ranges
        let x = d3.scaleTime()
            .range([0, width])
        // Scale the range of the data in the domains
        x.domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }));
        // add the x Axis
        let format_TicksCount = formatTicksCount(data[0][breakdown[0].field]);
        let tick_format = formatTick(data[0][breakdown[0].field]);
        let axisX = d3.axisBottom(x).tickFormat(tick_format)
        if (format_TicksCount === d3.timeYear) {
            axisX.ticks(format_TicksCount)
        }
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + (height - 20) + ")")
            .call(axisX)
            .call(g => {
                g.attr("font-size", "10px");
                g.attr("font-family", ENGFONT);
                g.attr("font-weight", "lighter")

                let domainD = g.selectAll(".domain").attr("d");
                domainD = domainD.replace("6V", (6 * chartSize.height / 320) + "V")
                domainD = domainD.replace("V6", "V" + (6 * chartSize.height / 320))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", TICK_WIDTH);
                g.selectAll(".tick")
                    .selectAll("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_WIDTH)
                    .attr("y2", 5);

                g.selectAll("text")
                    .attr("y", 10)
                // .attr("transform", "rotate(-20)")
                // .attr("style", "text-anchor: end")
            });
        return { _x: x, _axisX: axisX, _tick_format: tick_format }
    }
    drawYAxis(svg, data, measure, chartSize, height) {
        /**
         * Draw the Y axis
         */
        // .padding(0.1);
        let y = d3.scaleLinear()
            .range([height - 20, 0]);
        y.domain(extendYAxis(data, measure[0].field))
        // add the y Axis
        svg.append("g")
            .attr("class", "yAxis")
            // .attr("transform", `translate(,0)`)
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
                g.attr("font-weight", "lighter")
                g.attr("font-family", ENGFONT)
                let domainD = g.selectAll(".domain").attr("d");
                domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", TICK_WIDTH);
                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_WIDTH)
                    .attr("x2", -5);

                g.selectAll("text")
                    .attr("x", -10);
            })
        return y
    }
    drawBackLine(x, y, data, lineLayer, breakdown, measureName, chartSize) {
        /**
         * draw series line and back grid
         */
        lineLayer.append("g").selectAll("line.line")
            .data(y.ticks(5)).enter().append("line")
            .attr("x1", 0)
            .attr("x2", chartSize.width)
            .attr("y1", function (d) { return y(d) })
            .attr("y2", function (d) { return y(d) })
            .attr("stroke", COLOR_GRID)
            .attr("stroke-width", "2px")

        let lineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(parseTime(d[breakdown[0].field]));
            })
            .y(function (d) {
                return y(d[measureName]);
            })
        let rawPath = lineLayer.append("path")
            .attr("d", lineGen(data))
            .attr("stroke", COLOR_REGULAR)
            .attr("stroke-width", "5px")
            .attr("fill", "none")
        return { _rawPath: rawPath, _lineGen: lineGen }
    }
    drawSeasonality(x, data, breakdown, focus, height, tooltipLayer, axisX, lineGen, startIndex) {
        /**
         * draw Seasonality insight
         */
        let tooltipPathList = []
        let tickValues = []
        for (let seasonality of focus) {
            for (let i = 0; i < seasonality.seasonal.length; i++) {
                let tooltipPeriod = seasonality.seasonal[i]
                let tooltipPeriodStart = tooltipPeriod.start - startIndex
                let tooltipPeriodEnd = tooltipPeriod.end - startIndex
                if (i === 0 && tooltipPeriodStart > 0) {
                    let xPos = x(parseTime(data[tooltipPeriodStart][breakdown[0].field]))
                    tooltipLayer.append("line")
                        .attr("x1", xPos)
                        .attr("y1", 0)
                        .attr("x2", xPos)
                        .attr("y2", height - 20)
                        .attr("stroke-width", "1px")
                        .attr("stroke", "black")
                        .attr("stroke-dasharray", "6, 3")
                    tickValues.push(parseTime(data[tooltipPeriodStart][breakdown[0].field]))
                }
                if (i < seasonality.seasonal.length - 1 || tooltipPeriodEnd < data.length - 1) {
                    let xPos = x(parseTime(data[tooltipPeriodEnd][breakdown[0].field]))
                    tooltipLayer.append("line")
                        .attr("x1", xPos)
                        .attr("y1", 0)
                        .attr("x2", xPos)
                        .attr("y2", height - 20)
                        .attr("stroke-width", "1px")
                        .attr("stroke", "black")
                        .attr("stroke-dasharray", "6, 3")
                    tickValues.push(parseTime(data[tooltipPeriodEnd][breakdown[0].field]))
                }
                if (tooltipPeriod.seasonal) {
                    tooltipPathList.push(
                        tooltipLayer.append("path")
                            .attr("d", lineGen(data.slice(tooltipPeriodStart, tooltipPeriodEnd + 1)))
                            .attr("stroke", COLOR_SEASONAL)
                            .attr("stroke-width", "5px")
                            .attr("fill", "none"))
                }
            }
        }
        axisX.tickValues(tickValues)
        return tooltipPathList
    }

}

let renderTooltip = (containerSelector, tick_format, data, breakdown,
    tooltipPathList, pattern, x, measureName) => {
    let tooltipId = uuid()
    let bisectDate = d3.bisector(function (d) { return parseTime(d[breakdown[0].field]) }).left
    let hoverTooltip = d3.select(containerSelector)
        .append("div")
        .attr("id", "hover-tooltip")
        .style("z-index", 2000)
        .style("width", "200px")
        .style("height", "115px")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("padding-left", "10px")
    let hoverTooltipTitle = hoverTooltip.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("height", "15px")
        .style("width", "190px")
        .style("border", `2px solid ${COLOR_TOOLTIP_DARK}`)
        .style("border-radius", "4px 4px 0px 0px")
        .style("padding-left", "5px")
        .style("padding-right", "5px")
        .style("background", COLOR_TOOLTIP_DARK)
        .style("font", `7px ${ENGFONT}`)
        .style("font-weight", "bold")
        .style("color", COLOR_TOOLTIP_LIGHT)
        .style("text-overflow", "ellipsis")
        .style("overflow", "hidden")
        .style("white-space", "nowrap")
    let hoverTooltipContent = hoverTooltip.append("div")
        .style("width", "200px")
        .style("height", "100px")
        .style("border", `2px solid ${COLOR_TOOLTIP_DARK}`)
        .style("border-radius", "0px 4px 4px 4px")
        .style("background", COLOR_TOOLTIP_LIGHT)
    hoverTooltipContent.append("span")
        .style("position", "absolute")
        .style("left", "-10px")
        .style("top", "60px")
        .style("border-width", "10px")
        .style("border-style", "dashed solid dashed dashed")
        .style("border-color", `transparent ${COLOR_TOOLTIP_DARK} transparent transparent`)
        .style("font-size", 0)
        .style("line-height", 0)
    hoverTooltipContent.append("em")
        .style("position", "absolute")
        .style("left", "-4px")
        .style("top", "62px")
        .style("border-width", "8px")
        .style("border-style", "dashed solid dashed dashed")
        .style("border-color", `transparent ${COLOR_TOOLTIP_LIGHT} transparent transparent`)
        .style("font-size", 0)
        .style("line-height", 0)
    hoverTooltipContent.append("div")
        .attr("id", "tooltip-chart" + tooltipId)

    let tooltipX = d3.scaleLinear()
        .range([10, 190])
    let tooltipY = d3.scaleLinear()
        .range([90, 10])
    let tooltipLenGen = d3.line().curve(d3.curveMonotoneX)
        .x(function (d) {
            return tooltipX(d.x);
        })
        .y(function (d) {
            return tooltipY(d.y);
        })
    let tooltipAvgY = d3.scaleLinear()
        .range([90, 10])
    tooltipAvgY.domain(extendYAxis(pattern.average))
    let tooltipAvgLenGen = d3.line().curve(d3.curveMonotoneX)
        .x(function (d) {
            return tooltipX(d.x);
        })
        .y(function (d) {
            return tooltipAvgY(d.y);
        })
    let intervalString = parseIntervalString(parseTime(data[pattern.interval][breakdown[0].field]) - parseTime(data[0][breakdown[0].field]))

    for (let i = 0; i < tooltipPathList.length; i++) {
        let tooltipPath = tooltipPathList[i]
        tooltipPath
            .on("mouseover", function (d) {
                hoverTooltip.transition()
                    .duration(200)
                    .style("opacity", .9)
            })
            .on("mouseout", function (d) {
                hoverTooltip.transition()
                    .duration(500)
                    .style("opacity", 0)
            })
            // eslint-disable-next-line
            .on("mousemove", function (d) {
                let result = { posX: d3.mouse(this)[0], posY: d3.mouse(this)[1] }
                let x0 = x.invert(d3.mouse(this)[0])
                let currentIndex = bisectDate(data, x0, 1)
                let periodLeft = Math.floor(currentIndex / pattern.interval) * pattern.interval
                let periodRight = periodLeft + pattern.interval - 1
                let title = tick_format(parseTime(data[periodLeft][breakdown[0].field])) + "-" +
                    tick_format(parseTime(data[periodRight][breakdown[0].field]))
                hoverTooltip.style("left", (result.posX + 30) + "px")
                    .style("top", (result.posY - 50) + "px")
                // no need to render chart
                let previousSvg = d3.select("#tooltip-chart" + tooltipId).node().getElementsByTagName("svg")[0]
                if (previousSvg && previousSvg.getAttribute("class") === title) {
                    return
                }

                // render chart
                hoverTooltipTitle.html(title)
                d3.select("#tooltip-chart" + tooltipId).selectAll("*").remove()

                let currentPeriod = Math.floor(currentIndex / pattern.interval)
                let tooltipData = []
                let dataLeft = currentPeriod <= NUM_TOOLTIP_DISPLAY_LEFT_PERIOD ? 0 : periodLeft - NUM_TOOLTIP_DISPLAY_LEFT_PERIOD * pattern.interval
                let dataRight = currentPeriod + NUM_TOOLTIP_DISPLAY_RIGHT_PERIOD + 1 >= data.length / pattern.interval ? data.length : periodRight + NUM_TOOLTIP_DISPLAY_RIGHT_PERIOD * pattern.interval
                for (let i = dataLeft; i < dataRight; i++) {
                    tooltipData.push({ x: i - dataLeft, y: data[i][measureName] })
                }
                tooltipX.domain([0, dataRight - dataLeft + 1])
                tooltipY.domain(extendYAxis(tooltipData, "y"))
                let tooltipLayer = d3.select("#tooltip-chart" + tooltipId)
                    .append("svg")
                    .attr("class", title)
                    .attr("width", "200")
                    .attr("height", "100")
                    .append("g")
                tooltipLayer.append("rect")
                    .style("width", tooltipX(periodRight - dataLeft) - tooltipX(periodLeft - dataLeft))
                    .style("height", "70px")
                    .style("fill", "#ffffff")
                    .style("x", tooltipX(periodLeft - dataLeft))
                    .style("y", "20px")
                for (let i = 0; i <= (dataRight - dataLeft) / pattern.interval; i++) {
                    let xPos = tooltipX(i * pattern.interval)
                    tooltipLayer.append("line")
                        .attr("x1", xPos)
                        .attr("y1", 20)
                        .attr("x2", xPos)
                        .attr("y2", 90)
                        .attr("stroke-width", "1px")
                        .attr("stroke", "black")
                }
                tooltipLayer.append("path")
                    .attr("d", tooltipLenGen(tooltipData))
                    .attr("stroke", COLOR_REGULAR)
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                for (let seasonal of pattern.seasonal) {
                    let start = Math.max(seasonal.start, dataLeft) - dataLeft
                    let end = Math.min(seasonal.end, dataRight) - dataLeft
                    if (end < 0) {
                        continue
                    }
                    for (let i = 0; i < (end - start) / pattern.interval; i++) {
                        let newAvgData = []
                        for (let j = 0; j < pattern.average.length; j++) {
                            newAvgData.push({ x: start + i * pattern.interval + j, y: pattern.average[j] })
                        }
                        tooltipLayer.append("path")
                            .attr("d", tooltipAvgLenGen(newAvgData))
                            .attr("stroke", "#FFBB8A")
                            .attr("stroke-width", "2px")
                            .attr("stroke-dasharray", "6, 3")
                            .attr("fill", "none")
                    }
                    tooltipLayer.append("path")
                        .attr("d", tooltipLenGen(tooltipData.slice(start, end + 1)))
                        .attr("stroke", COLOR_SEASONAL)
                        .attr("stroke-width", "3px")
                        .attr("fill", "none")
                }

                let legendLayer = tooltipLayer.append("g")
                    .style("font-size", "6px")
                    .style("font-weight", "bold")
                    .style("font-family", ENGFONT)
                    .style("color", COLOR_TOOLTIP_DARK)
                legendLayer.append("line")
                    .attr("x1", "6px")
                    .attr("y1", "8px")
                    .attr("x2", "21px")
                    .attr("y2", "8px")
                    .attr("stroke-width", "2px")
                    .attr("stroke", "#FFBB8A")
                    .attr("stroke-dasharray", "6, 3")
                    .attr("fill", "none")
                legendLayer.append("text")
                    .attr("x", "25px") // 6 + 15 + 4
                    .attr("y", "10px")
                    .text("Seasonality")
                legendLayer.append("text")
                    .attr("x", "135px")
                    .attr("y", "10px")
                    .text("Interval " + intervalString)
            })
    }
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
            let result = { posX: d3.mouse(this)[0], posY: d3.mouse(this)[1] }
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

let extendYAxis = (data, measureField) => {
    let minValue = d3.max(data.map(function (d) { return measureField === undefined ? d : d[measureField] }))
    let maxValue = d3.min(data.map(function (d) { return measureField === undefined ? d : d[measureField] }))
    return [maxValue + (maxValue - minValue) * 0.2, minValue - (maxValue - minValue) * 0.2]
}

export default Seasonality;