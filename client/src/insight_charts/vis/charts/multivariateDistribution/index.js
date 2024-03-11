import * as d3 from 'd3';
import Chart from '../../chart';
import { parseTime, formatTick, formatTicksCount } from '../constant/timeConstant'

const ENGFONT = "OPPOSans";
const COLOR_REGULAR = "#6C8EF2";
const COLOR_ELLIPSE = "#E4E4E4";
const COLOR_CIRCLE = "#F28AB3";
const TRANSPARENCY_ELLIPSE = 0.7;
const COLOR_STD = "#8ED9AB";
const COLOR_TEXT = "#000000";
const TRANSPARENCY_STD = 0.3;
const SERIES_COLORS = ["#6C8EF2", "#E1944E", "#8B65BA"]

const COLOR_GRID = "#E6E6E6";
const COLOR_AXIS = "#000000";

class MultivariateDistribution extends Chart {
    constructor() {
        super();
        this._x = '';
        this._y = '';
    }

    display() {
        let factData = this.factdata();
        let breakdown = this.breakdown();
        let focus = this.focus();
        let focusMeasure = []

        // set data
        let data = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))
        if (focus.length === 0) return

        // set the dimensions and margins of the graph
        let chartSize = { width: 550, height: 440 }
        let margin = {
            "top": 15,
            "right": 10,
            "bottom": 15,
            "left": 60
        }
        let tickWidth = 2

        let containerSelector = this.container()
        let svg = d3.select(containerSelector)
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")")
            .attr("font-family", ENGFONT);

        var means = []
        var stds = []
        var rxs = []
        var rys = []
        var rads = []
        var mins = []
        var maxs = []
        let tempList = []
        for (let distr of focus) {
            if (!tempList.includes(distr.field)) {
                tempList.push(distr.field)
                focusMeasure.push({ "field": distr.field })
            }
        }
        let oneChartWidth = Math.floor(chartSize.width / focusMeasure.length)
        let oneChartHeight = Math.floor(chartSize.height / focusMeasure.length)
        for (let distr of focus) {
            for (let j = 0; j < focusMeasure.length; j++) {
                if (distr.field === focusMeasure[j].field) {
                    if (distr.name === "mean") {
                        means[j] = distr.value
                    } else if (distr.name === "std") {
                        stds[j] = distr.value
                    } else if (distr.name === "a") {
                        rxs[j] = distr.value
                    } else if (distr.name === "b") {
                        rys[j] = distr.value
                    } else if (distr.name === "rad") {
                        rads[j] = distr.value
                    } else if (distr.name === 'min') {
                        mins[j] = distr.value
                    } else if (distr.name === 'max') {
                        maxs[j] = distr.value
                    }
                }
            }
        }

        let tooltipLayer = svg.append('g').attr('class', 'tooltip')
        for (let i = 0; i <= focusMeasure.length - 1; i++) {
            for (let j = 0; j <= focusMeasure.length - 1; j++) {
                let startX = oneChartWidth * i
                let startY = oneChartHeight * j
                if (i === j) {
                    let x = d3.scaleTime()
                        .range([startX, startX + oneChartWidth / 2])
                    // .padding(0.1);
                    let y = d3.scaleLinear()
                        .range([startY + oneChartWidth / 2, startY]);
                    x.domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }));
                    y.domain(d3.extent([].concat(
                        // lower boundary minus margin
                        data.map(function (d) { return d[focusMeasure[i].field] * 0.95 }),
                        // upper boundary add margin
                        data.map(function (d) { return d[focusMeasure[i].field] * 1.05 })
                    )));

                    // add the x Axis
                    let format_TicksCount = formatTicksCount(data[0][breakdown[0].field]);
                    let tick_format = formatTick(data[0][breakdown[0].field]);
                    let axisX = d3.axisBottom(x).tickFormat(tick_format)
                    if (format_TicksCount === d3.timeYear) {
                        axisX.ticks(format_TicksCount)
                    }

                    let mean = means[i]
                    let std = [mean - 2 * stds[i], mean + 2 * stds[i]]
                    let min = mins[i]
                    let max = maxs[i]
                    let xLeft = x(parseTime(data[0][breakdown[0].field]));
                    let xRight = x(parseTime(data[data.length - 1][breakdown[0].field]));

                    // std
                    svg.append('rect')
                        .attr('x', xLeft)
                        .attr('y', y(std[1]))
                        .attr('width', xRight - xLeft)
                        .attr("height", y(std[0]) - y(std[1]))
                        .attr('fill', COLOR_STD)
                        .attr('opacity', TRANSPARENCY_STD);

                    let lineLayer = svg.append("g").attr('class', 'lineLayer')
                    // line
                    lineLayer.append('g').selectAll('line.line')
                        .data(y.ticks(5)).enter().append('line')
                        .attr('x1', startX)
                        .attr('x2', startX + oneChartWidth / 2)
                        .attr('y1', function (d) { return y(d) })
                        .attr('y2', function (d) { return y(d) })
                        .attr('stroke', COLOR_GRID)
                        .attr('stroke-width', '2px')
                    // min
                    tooltipLayer.append('line')
                        .attr('x1', xLeft)
                        .attr('y1', y(min))
                        .attr('x2', xRight)
                        .attr('y2', y(min))
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black')
                        .attr('stroke-dasharray', '6px');

                    // max
                    tooltipLayer.append('line')
                        .attr('x1', xLeft)
                        .attr('y1', y(max))
                        .attr('x2', xRight)
                        .attr('y2', y(max))
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black')
                        .attr('stroke-dasharray', '6px');

                    let lineLayer2 = svg.append("g").attr('class', 'lineLayer')
                    let lineGen = d3.line().curve(d3.curveMonotoneX)
                        .x(function (d) {
                            return x(parseTime(d[breakdown[0].field]));
                        })
                        .y(function (d) {
                            return y(d[focusMeasure[i].field]);
                        })
                    lineLayer2.append('path')
                        .attr('d', lineGen(data))
                        .attr('stroke', COLOR_REGULAR)
                        .attr('stroke-width', '1px')
                        .attr('fill', 'none')

                    let tickValues = [];
                    tickValues.push(parseTime(data[10][breakdown[0].field]))
                    tickValues.push(parseTime(data[data.length - 10][breakdown[0].field]))
                    axisX.tickValues(tickValues)


                    let tooltipLayer2 = svg.append('g').attr('class', 'tooltip');

                    let tooltip = tooltipLayer2.append("text")
                        .attr("font-size", '5.5px')
                        .attr("font-family", ENGFONT)
                        .attr("fill", COLOR_TEXT);
                    tooltip.append("tspan")
                        .text("Min: " + min)
                        .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);
                    let textWidth = tooltip.node().getBBox().width;
                    let textHeight = tooltip.node().getBBox().height * 1.5;
                    tooltip.attr("width", textWidth)
                        .attr("height", textHeight)
                        .attr("x", xRight - textWidth)
                        .attr("y", y(min) - textHeight);

                    tooltip = tooltipLayer2.append("text")
                        .attr("font-size", '5.5px')
                        .attr("font-family", ENGFONT)
                        .attr("font-weight", "light")
                        .attr("fill", COLOR_TEXT);
                    tooltip.append("tspan")
                        .text("Max: " + max)
                        .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);
                    textWidth = tooltip.node().getBBox().width;
                    textHeight = tooltip.node().getBBox().height * 1.5;
                    tooltip.attr("width", textWidth)
                        .attr("height", textHeight)
                        .attr("x", xRight - textWidth)
                        .attr("y", y(max) - textHeight);


                    tooltipLayer2.append('line')
                        .attr('x1', xLeft)
                        .attr('y1', y(mean))
                        .attr('x2', xRight)
                        .attr('y2', y(mean))
                        .attr('stroke-width', '1px')
                        .attr('stroke', 'black');
                    tooltip = tooltipLayer2.append("text")
                        .attr("font-size", '5.5px')
                        .attr("font-family", ENGFONT)
                        .attr("font-weight", "light")
                        .attr("fill", COLOR_TEXT);
                    tooltip.append("tspan")
                        .text("Avg: " + mean)
                        .attr("dy", tooltip.selectAll("tspan").node().getBBox().height * 0.9);

                    textWidth = tooltip.node().getBBox().width;
                    textHeight = tooltip.node().getBBox().height * 1.5;

                    svg.append('rect')
                        .attr('x', xRight - textWidth)
                        .attr('y', y(mean) - textHeight * 1.15)
                        .attr('width', textWidth)
                        .attr("height", textHeight)
                        .attr('fill', 'white')
                        .attr('opacity', 0.8);

                    tooltip.attr("width", textWidth)
                        .attr("height", textHeight)
                        .attr("x", xRight - textWidth)
                        .attr("y", y(mean) - textHeight);

                    let tooltipLayer3 = svg.append('g').attr('class', 'tooltip').style('background-color', 'white').style('opacity', 0.8);
                    let tooltip2 = tooltipLayer3.append("text")
                        .attr("font-size", '5.5px')
                        .attr("font-family", ENGFONT)
                        .attr("fill", COLOR_TEXT);
                    tooltip2.append("tspan")
                        .text("Avg: " + mean)
                        .attr("dy", tooltip2.selectAll("tspan").node().getBBox().height * 0.9);

                    tooltip2.attr("width", textWidth)
                        .attr("height", textHeight)
                        .attr("x", xRight - textWidth)
                        .attr("y", y(mean) - textHeight);

                    // renderDetailValue(containerSelector, rawPath, x, y, 90, data, breakdown, breakdown[i].field, tick_format, tooltipLayer)

                    svg.append("g")
                        .attr("class", "xAxis")
                        .attr("transform", "translate(0," + (startY + oneChartWidth / 2) + ")")
                        .call(axisX)
                        .call(g => {
                            g.attr("font-size", '8px');
                            g.attr("font-family", ENGFONT);
                            g.attr("font-weight", 'light')

                            let domainD = g.selectAll(".domain").attr("d");
                            domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                            domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                            g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                            g.selectAll(".tick")
                                .selectAll("line")
                                .attr("stroke", COLOR_AXIS)
                                .attr("stroke-width", tickWidth)
                                .attr("y2", 5);

                            g.selectAll("text")
                                .attr("y", 10)
                        });


                    // add the y Axis
                    let yAxisLayer = svg.append("g").attr("class", "yAxis")
                    yAxisLayer.attr("transform", "translate(" + startX + ",0)")
                        .call(d3.axisLeft(y).ticks(5).tickFormat(function (d) {
                            if ((d / 1000000) >= 1) {
                                d = d / 1000000 + "M";
                            } else if ((d / 1000) >= 1) {
                                d = d / 1000 + "K";
                            }
                            return d;
                        }))
                        .call(g => {
                            g.attr("font-size", '8px')
                            g.attr("font-weight", 'light')
                            g.attr("font-family", ENGFONT)
                            let domainD = g.selectAll(".domain").attr("d");
                            domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                            domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                            g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                            g.selectAll(".tick")
                                .select("line")
                                .attr("stroke", COLOR_AXIS)
                                .attr("stroke-width", tickWidth)
                                .attr("x2", -5);

                            g.selectAll("text")
                                .attr("x", -10);
                        })

                    yAxisLayer.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", -35)
                        .attr("x", 0 - startY - 45)
                        .style("text-anchor", "middle")
                        .style("font-size", "10px")
                        .attr("font-weight", "heavy")
                        .attr("fill", SERIES_COLORS[i])
                        .text(cutTitle(focusMeasure[i].field))
                } else {
                    let x = d3.scaleLinear()
                        .range([startX, startX + oneChartWidth / 2])
                    let y = d3.scaleLinear()
                        .range([startY + oneChartWidth / 2, startY]);
                    x.domain(d3.extent([].concat(
                        // lower boundary minus margin
                        data.map(function (d) { return d[focusMeasure[i].field] * 0.95 }),
                        // upper boundary add margin
                        data.map(function (d) { return d[focusMeasure[i].field] * 1.05 })
                    )));
                    y.domain(d3.extent([].concat(
                        // lower boundary minus margin
                        data.map(function (d) { return d[focusMeasure[j].field] * 0.95 }),
                        // upper boundary add margin
                        data.map(function (d) { return d[focusMeasure[j].field] * 1.05 })
                    )));
                    // Scale the range of the data in the domains

                    let cx = means[i]
                    let cy = means[j]
                    let xmin = mins[i]
                    let ymin = mins[j]
                    let xmax = maxs[i]
                    let ymax = maxs[j]
                    let index, rx, ry, rad
                    if ((i === 0 && j === 1) || (i === 1 && j === 0)) {
                        index = 0
                    } else if ((i === 0 && j === 2) || (i === 2 && j === 0)) {
                        index = 1
                    } else if ((i === 1 && j === 2) || (i === 2 && j === 1)) {
                        index = 2
                    }
                    if (i < j) {
                        rx = rxs[index]
                        ry = rys[index]
                        rad = -rads[index]
                    } else {
                        rx = rys[index]
                        ry = rxs[index]
                        rad = rads[index] - 180
                    }

                    let g = svg.append("g")
                    g.selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", function (d) {
                            return x(d[focusMeasure[i].field]);
                        })
                        .attr("cy", function (d) {
                            return y(d[focusMeasure[j].field]);
                        })
                        .attr("r", '2.5px')
                        .attr('fill', COLOR_CIRCLE);

                    let xAxisLayer = svg.append("g").attr("class", "xAxis")
                    xAxisLayer.attr("transform", "translate(0," + (startY + oneChartWidth / 2) + ")")
                        .call(d3.axisBottom(x).ticks(3).tickFormat(function (d) {
                            if ((d / 1000000) >= 1) {
                                d = d / 1000000 + "M";
                            } else if ((d / 1000) >= 1) {
                                d = d / 1000 + "K";
                            }
                            return d;
                        }))
                        .call(g => {
                            g.attr("font-size", '8px');
                            g.attr("font-family", ENGFONT);
                            g.attr("font-weight", 'light')

                            let domainD = g.selectAll(".domain").attr("d");
                            domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                            domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                            g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                            g.selectAll(".tick")
                                .selectAll("line")
                                .attr("stroke", COLOR_AXIS)
                                .attr("stroke-width", tickWidth)
                                .attr("y2", 5);

                            g.selectAll("text")
                                .attr("y", 10)
                        });


                    // add the y Axis
                    let yAxisLayer = svg.append("g").attr("class", "yAxis")
                    yAxisLayer.attr("transform", "translate(" + startX + ",0)")
                        .call(d3.axisLeft(y).ticks(5).tickFormat(function (d) {
                            if ((d / 1000000) >= 1) {
                                d = d / 1000000 + "M";
                            } else if ((d / 1000) >= 1) {
                                d = d / 1000 + "K";
                            }
                            return d;
                        }))
                        .call(g => {
                            g.attr("font-size", '8px')
                            g.attr("font-weight", 'light')
                            g.attr("font-family", ENGFONT)
                            let domainD = g.selectAll(".domain").attr("d");
                            domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                            domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                            g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                            g.selectAll(".tick")
                                .select("line")
                                .attr("stroke", COLOR_AXIS)
                                .attr("stroke-width", tickWidth)
                                .attr("x2", -5);

                            g.selectAll("text")
                                .attr("x", -10);
                        })

                    let title = xAxisLayer.append("text")
                        .attr("y", 30)
                        .attr("x", startX + 45)
                        .style("text-anchor", "middle")
                        .style("font-size", "10px")
                        .attr("fill", SERIES_COLORS[i])
                        .text(cutTitle(focusMeasure[i].field))

                    title = yAxisLayer.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", -35)
                        .attr("x", 0 - startY - 45)
                        .style("text-anchor", "middle")
                        .style("font-size", "10px")
                        .attr("fill", SERIES_COLORS[j])
                        .text(cutTitle(focusMeasure[j].field))
                }
            }
        }

        return svg;

    }
}

let getSizeBySize = (size, chartSize, hasSeries = false, moreThan6 = false) => {
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
            tickSize = 13;
            annotationSize = 20;
            tickWidth = 2;
            dotR = 5;
            strokeWidth = 3;
            break;
        case "wide":
            tickSize = 16;
            annotationSize = 26;
            dotR = 7;
            tickWidth = 2;
            strokeWidth = 3;
            break;
        case "large":
        default:
            tickSize = 20;
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

const cutTitle = (title) => {
    if (title.length > 16) {
        return title.slice(0, 16) + "..."
    } else {
        return title
    }
}

export default MultivariateDistribution;