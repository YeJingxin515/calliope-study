import * as d3 from 'd3';
import Chart from '../../chart';
import { tooltipContainerId } from '../constant/getContainer';
import { getPosition } from '../constant/getPosition';
import { parseTime, formatTick, formatTicksCount } from '../constant/timeConstant'
const ENGFONT = "OPPOSans";
const COLOR_AXIS = "#000000";
const COLOR_REGULAR = "#6C8EF2";
const COLOR_STD = "#8ED9AB";
const COLOR_TEXT = "#000000";
const TRANSPARENCY_STD = 0.3;
const COLOR_GRID = "#E6E6E6";
const TICK_WIDTH = 2;

class UnivariateDistribution extends Chart {
    constructor() {
        super();
        this._x = '';
        this._y = '';
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

        //------------------init---------------------------
        let containerSelector = tooltipContainerId
        //init svg
        let svg = this.initSvg(chartSize, margin)
        //init layer
        let tooltipLayer = svg.append('g').attr('class', 'tooltip');

        //------------------draw x axis-------------------
        let xAxisResult = this.drawXAxis(svg, data, breakdown, width, height, chartSize)
        let x = xAxisResult._x
        let axisX = xAxisResult._axisX
        let tick_format = xAxisResult._tick_format

        //------------------draw y axis-------------------
        let y = this.drawYAxis(svg, data, measure, chartSize, height)

        //------------------draw univariate distribution---------------
        let xLeft = x(parseTime(data[0][breakdown[0].field]));
        let xRight = x(parseTime(data[data.length - 1][breakdown[0].field]));
        let uniDistributionResult = this.drawUnivariateDistribution(y, data, xLeft, xRight, breakdown, focus, svg, tooltipLayer, axisX)
        let mean = uniDistributionResult._mean
        let x_mean = uniDistributionResult._x_mean
        let y_mean = uniDistributionResult._y_mean
        tooltipLayer = uniDistributionResult._tooltipLayer

        //-------------------draw original line--------------------
        let lineLayer = svg.append("g").attr('class', 'lineLayer')
        let originLineResult = this.drawBackLine(x, y, data, lineLayer, breakdown, measureName, width)
        let rawPath = originLineResult._rawPath
        let lineGen = originLineResult._lineGen

        //--------------------draw insight text--------------------
        this.drawInsightText(svg, y, xLeft, xRight, mean, x_mean, y_mean)
        if (this._showTooltip) {
            renderDetailValue(containerSelector, rawPath, x, y, height, data, breakdown, measureName, tick_format, tooltipLayer)
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
        let data = factData
        let measureName = measure[0].aggregate === 'count' ? "COUNT" : measure[0].field
        return { _data: data, _measure: measure, _breakdown: breakdown, _focus: focus, _measureName: measureName }
    }
    setChartStandard() {
        /** 
         * calculate size of the chart
         * return chart size parameters
         */
        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 280 }
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        }
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
            .range([0, width - 20])
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
                g.attr("font-size", '10px');
                g.attr("font-family", ENGFONT);
                g.attr("font-weight", 'light')

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
                // .attr("transform", 'rotate(-20)')
                // .attr("style", 'text-anchor: end')
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
        y.domain(d3.extent([].concat(
            // lower boundary minus margin
            data.map(function (d) { return d[measure[0].field] * 0.85 }),
            // upper boundary add margin
            data.map(function (d) { return d[measure[0].field] * 1.15 })
        )));
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
                g.attr("font-size", '10px')
                g.attr("font-weight", 'light')
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
    drawBackLine(x, y, data, lineLayer, breakdown, measureName, width) {
        /**
         * draw series line and back grid
         */
        lineLayer.append('g').selectAll('line.line')
            .data(y.ticks(5)).enter().append('line')
            .attr('x1', 0)
            .attr('x2', width - 20)
            .attr('y1', function (d) { return y(d) })
            .attr('y2', function (d) { return y(d) })
            .attr('stroke', COLOR_GRID)
            .attr('stroke-width', '2px')

        let lineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(parseTime(d[breakdown[0].field]));
            })
            .y(function (d) {
                return y(d[measureName]);
            })
        let rawPath = lineLayer.append('path')
            .attr('d', lineGen(data))
            .attr('stroke', COLOR_REGULAR)
            .attr('stroke-width', '3px')
            .attr('fill', 'none')
        return { _rawPath: rawPath, _lineGen: lineGen }
    }
    drawUnivariateDistribution(y, data, xLeft, xRight, breakdown, focus, svg, tooltipLayer, axisX) {
        let tickValues = [];
        let std = [0, 0];
        let mean = 0;
        let x_mean = 0;
        let y_mean = 0;

        for (let distr of focus) {
            let yVal = y(distr.value);
            if (distr.name === "mean") {
                mean = distr.value;
                x_mean = xRight;
                y_mean = yVal;

            } else if (distr.name === "mean-2std") {
                std[0] = distr.value;
            } else if (distr.name === "mean+2std") {
                std[1] = distr.value;
            } else if (distr.name === "min") {
                tooltipLayer.append('line')
                    .attr('x1', xLeft)
                    .attr('y1', y(distr.value))
                    .attr('x2', xRight)
                    .attr('y2', y(distr.value))
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black')
                    .attr('stroke-dasharray', '6px');

                let tooltip = tooltipLayer.append("text")
                    .attr("font-size", '10px')
                    .attr("font-family", ENGFONT)
                    .attr("fill", COLOR_TEXT);
                tooltip.append("tspan")
                    .text("Min: " + distr.value)
                    .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);
                let textWidth = tooltip.node().getBBox().width;
                let textHeight = tooltip.node().getBBox().height * 1.5;
                tooltip.attr("width", textWidth)
                    .attr("height", textHeight)
                    .attr("x", xRight - textWidth)
                    .attr("y", yVal - textHeight);
            } else if (distr.name === "max") {
                //std[1] = Math.min(distr.value, std[1])
                tooltipLayer.append('line')
                    .attr('x1', xLeft)
                    .attr('y1', y(distr.value))
                    .attr('x2', xRight)
                    .attr('y2', y(distr.value))
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black')
                    .attr('stroke-dasharray', '6px');

                let tooltip = tooltipLayer.append("text")
                    .attr("font-size", '10px')
                    .attr("font-family", ENGFONT)
                    .attr("fill", COLOR_TEXT);
                tooltip.append("tspan")
                    .text("Max: " + distr.value)
                    .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);
                let textWidth = tooltip.node().getBBox().width;
                let textHeight = tooltip.node().getBBox().height * 1.5;
                tooltip.attr("width", textWidth)
                    .attr("height", textHeight)
                    .attr("x", xRight - textWidth)
                    .attr("y", yVal - textHeight);
            }
        }
        // std color block
        svg.append('rect')
            .attr('x', 0)
            .attr('y', y(std[1]))
            .attr('width', xRight - xLeft)
            .attr("height", y(std[0]) - y(std[1]))
            .attr('fill', COLOR_STD)
            .attr('opacity', TRANSPARENCY_STD);

        tickValues.push(parseTime(data[10][breakdown[0].field]))
        tickValues.push(parseTime(data[data.length - 10][breakdown[0].field]))
        axisX.tickValues(tickValues)
        return { _tooltipLayer: tooltipLayer, _mean: mean, _x_mean: x_mean, _y_mean: y_mean }
    }
    drawInsightText(svg, y, xLeft, xRight, mean, x_mean, y_mean) {
        let tooltipLayer2 = svg.append('g').attr('class', 'tooltip').style('background-color', 'white').style('opacity', 0.8);
        tooltipLayer2.append('line')
            .attr('x1', xLeft)
            .attr('y1', y(mean))
            .attr('x2', xRight)
            .attr('y2', y(mean))
            .attr('stroke-width', '1px')
            .attr('stroke', 'black');
        let tooltip = tooltipLayer2.append("text")
            .attr("font-size", '10px')
            .attr("font-family", ENGFONT)
            .attr("fill", COLOR_TEXT);
        tooltip.append("tspan")
            .text("Avg: " + mean)
            .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);

        let textWidth = tooltip.node().getBBox().width;
        let textHeight = tooltip.node().getBBox().height * 1.5;

        svg.append('rect')
            .attr('x', x_mean - textWidth)
            .attr('y', y_mean - textHeight * 1.15)
            .attr('width', textWidth)
            .attr("height", textHeight)
            .attr('fill', 'white')
            .attr('opacity', 0.8);

        tooltip.attr("width", textWidth)
            .attr("height", textHeight)
            .attr("x", x_mean - textWidth)
            .attr("y", y_mean - textHeight);


        let tooltipLayer3 = svg.append('g').attr('class', 'tooltip').style('background-color', 'white').style('opacity', 0.8);
        let tooltip2 = tooltipLayer3.append("text")
            .attr("font-size", '10px')
            .attr("font-family", ENGFONT)
            .attr("fill", COLOR_TEXT);
        tooltip2.append("tspan")
            .text("Avg: " + mean)
            .attr("dy", tooltip2.selectAll("tspan").node().getBBox().height * 0.9);

        tooltip2.attr("width", textWidth)
            .attr("height", textHeight)
            .attr("x", x_mean - textWidth)
            .attr("y", y_mean - textHeight);
    }
}
let renderDetailValue = (containerSelector, rawPath, x, y, height,
    data, breakdown, measureName, tick_format, tooltipLayer) => {
    let detailValueTooltip = d3.select(containerSelector)
        .append("div")
        .attr("id", "value-tooltip")
        .style("z-index", 2000)
        .style("width", "95px")
        .style("width", "fit-content")
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
export default UnivariateDistribution;