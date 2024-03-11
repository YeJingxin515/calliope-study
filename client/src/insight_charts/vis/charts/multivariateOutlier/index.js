import * as d3 from 'd3';
import Chart from '../../chart';
import { parseTime, formatTick, formatTicksCount } from '../constant/timeConstant'
const ENGFONT = "OPPOSans";
const COLOR_AXIS = "#000000";
const COLOR_REGULAR = "#808080";
const COLOR_OUTLIER = "#F72D35"
const COLOR_GRID = "#E6E6E6";
const SERIES_COLORS = ["#6C8EF2", "#E1944E", "#8B65BA", "#4B8384"]

class MultivariateOutlier extends Chart {
    constructor() {
        super();
        this._x = '';
        this._y = '';
    }

    display() {
        let factData = this.factdata()
        let measure = this.measure();
        let breakdown = this.breakdown();
        let focus = this.focus();
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))

        let data = factData
        if (focus.length === 0) return

        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 360 }
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 5
        }
        let tickSize = 10
        let tickWidth = 2

        let width = chartSize.width - margin.left - margin.right,
            height = chartSize.height - margin.top - margin.bottom;

        let containerSelector = this.container()
        let svg = d3.select(this.container())
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")")
            .attr("font-family", ENGFONT);

        let lineLayer = svg.append("g").attr('class', 'lineLayer')

        // set the ranges
        let x = d3.scaleTime()
            .range([30, width - 10])
        // Scale the range of the data in the domains
        x.domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }));
        // .padding(0.1);

        // add the x Axis
        let format_TicksCount = formatTicksCount(data[0][breakdown[0].field]);
        let tick_format = formatTick(data[0][breakdown[0].field]);
        let axisX = d3.axisBottom(x).tickFormat(tick_format)
        if (format_TicksCount === d3.timeYear) {
            axisX.ticks(format_TicksCount)
        }

        let tooltipLayer = svg.append('g').attr('class', 'tooltip')
        let tickValues = [];

        let yAxisLayer = svg.append("g").attr("class", "yAxis")
        let ys = []
        let oneYLength = (height - 20 + 15) / focus[0]["clusters"].length
        for (let outlier of focus) {
            let start = Math.max(0, outlier.start - 1)
            let end = Math.min(data.length - 1, outlier.end + 1)
            tickValues.push(parseTime(data[start][breakdown[0].field]))
            tickValues.push(parseTime(data[end][breakdown[0].field]))

            for (let i = 0; i < outlier["clusters"].length; i++) {
                let cluster = outlier["clusters"][i]
                let y = d3.scaleLinear().range([oneYLength * (i + 1) - 15, oneYLength * i])

                // lineLayer
                lineLayer.append('g').selectAll('line.line')
                    .data(y.ticks(5)).enter().append('line')
                    .attr('x1', 30)
                    .attr('x2', chartSize.width)
                    .attr('y1', function (d) { return y(d) })
                    .attr('y2', function (d) { return y(d) })
                    .attr('stroke', COLOR_GRID)
                    .attr('stroke-width', '2px')

                tooltipLayer.append("rect")
                    .attr("width", x(parseTime(data[end][breakdown[0].field])) - x(parseTime(data[start][breakdown[0].field])))
                    .attr("height", oneYLength - 15)
                    .style("fill", "rgb(100%," + (1 - cluster["center"]["score"]) * 100 + "%," + (1 - cluster["center"]["score"]) * 100 + "%, 50%)")
                    .attr("x", x(parseTime(data[start][breakdown[0].field])))
                    .attr("y", oneYLength * i)
                if (i === outlier["clusters"].length - 1) {
                    tooltipLayer.append("rect")
                        .attr("width", x(parseTime(data[end][breakdown[0].field])) - x(parseTime(data[start][breakdown[0].field])))
                        .attr("height", 10)
                        .style("fill", "red")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", oneYLength * (i + 1) - 15)
                }

                y.domain([0, 1])
                for (let other of cluster["other"]) {
                    y.domain(d3.extent([].concat(
                        data.map(function (d) {
                            return d[other["field"]]
                        })
                    )))
                    let lineGen = d3.line().curve(d3.curveMonotoneX)
                        .x(function (d) {
                            return x(parseTime(d[breakdown[0].field]));
                        })
                        .y(function (d) {
                            return y(d[other["field"]]);
                        })
                    lineLayer.append('path')
                        .attr('d', lineGen(data))
                        .attr('stroke', COLOR_REGULAR)
                        .attr('stroke-width', '2px')
                        .attr('fill', 'none')
                        .attr('opacity', 0.5)
                }

                y.domain([0, 1])
                let lineGen = d3.line().curve(d3.curveMonotoneX)
                    .x(function (d) {
                        return x(parseTime(d.x));
                    })
                    .y(function (d) {
                        return y(d.y);
                    })

                let centerPts = []
                for (let o = 0; o < cluster["center"]["value"].length; o++) {
                    centerPts.push({ x: data[start + o][breakdown[0].field], y: cluster["center"]["value"][o] })
                }
                tooltipLayer.append("path")
                    .attr("d", lineGen(centerPts))
                    .attr("stroke", SERIES_COLORS[i])
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")

                let forecastPts = []
                forecastPts.push({ x: data[start][breakdown[0].field], y: cluster["center"]["value"][0] })
                for (let o = 0; o < cluster["center"]["forecast"].length; o++) {
                    forecastPts.push({ x: data[start + 1 + o][breakdown[0].field], y: cluster["center"]["forecast"][o] })
                }
                forecastPts.push({ x: data[end][breakdown[0].field], y: cluster["center"]["value"][cluster["center"]["value"].length - 1] })

                tooltipLayer.append("path")
                    .attr("d", lineGen(forecastPts))
                    .attr("stroke", SERIES_COLORS[i])
                    .attr("stroke-width", "2px")
                    .attr("stroke-dasharray", "6, 3")
                    .attr("fill", "none")

                if (outlier["clusters"].length <= 3) {
                    y.domain(d3.extent([].concat(
                        data.map(function (d) {
                            return d[cluster["other"][0]["field"]]
                        })
                    )))
                }
                // add the y Axis
                yAxisLayer.append("g")
                    .attr("transform", "translate(30, 0)")
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
                        g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                        g.selectAll(".tick")
                            .select("line")
                            .attr("stroke", COLOR_AXIS)
                            .attr("stroke-width", tickWidth)
                            .attr("x2", -6 * chartSize.width / 640);

                        g.selectAll("text")
                            .attr("x", -9 * chartSize.width / 640);
                    });

                // add y axis label
                let title = yAxisLayer.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -5)
                    .attr("x", 0 - (oneYLength * (2 * i + 1) - 15) / 2)
                    .style("text-anchor", "middle")
                    .style("font-size", "10px")
                    .text(cluster["other"][0]["field"])
                yAxisLayer.append("rect")
                    .attr("transform", "rotate(-90)")
                    .style("text-anchor", "middle")
                    .attr("x", title.node().getBBox().x)
                    .attr("y", title.node().getBBox().y)
                    .attr("width", title.node().getBBox().width + 2)
                    .attr("height", title.node().getBBox().height)
                    .attr("fill", SERIES_COLORS[i])
                title.node().remove()
                yAxisLayer.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -5)
                    .attr("x", 0 - (oneYLength * (2 * i + 1) - 15) / 2)
                    .style("text-anchor", "middle")
                    .style("font-size", "10px")
                    .text(cluster["other"][0]["field"])
                ys.push(y)
            }

            let tooltip = tooltipLayer.append("g")
            let tooltipText = tooltip.append("text")
                .attr("font-size", "10px")
                .attr("font-family", ENGFONT)
                .attr("stroke", COLOR_OUTLIER)
            tooltipText.append("tspan")
                .text("Anomaly score: " + outlier.score.toFixed(4))
                .attr("dy", tooltipText.selectAll("tspan").node().getBBox().height * 0.9)
            let textWidth = tooltip.node().getBBox().width;
            let textHeight = tooltip.node().getBBox().height;
            let textY = height

            let outlierX = (x(parseTime(data[start][breakdown[0].field])) + x(parseTime(data[end + 1][breakdown[0].field]))) / 2
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
                    .attr("y", 9 * chartSize.height / 320)

                let nodes = g.selectAll("text").nodes()
                d3.select(nodes[0]).attr("x", - nodes[0].getBBox().width / 2 + 5)
                d3.select(nodes[1]).attr("x", nodes[0].getBBox().width / 2 - 5)

            });

        // let tableContainer = d3.select(containerSelector).append("div")
        //     .style("position", "absolute")
        //     .style("left", "50px")
        //     .style("top", oneYLength * (focus[0]["clusters"].length + 1))
        //     .style("font-size", "8px")
        //     .style("font-family", ENGFONT)
        //     .style("border", "1px solid #000000")
        //     .style("overflow-y", "auto")
        //     .style("height", "100px")
        // let clusterTable = tableContainer.append("table")
        //     .style("border-collapse", "collapse")
        //     .style("border-spacing", 0)
        //     .attr("width", width)
        //     .style("position", "relative")
        // let headerTd = clusterTable.append("thead")
        //     .style("background", "#eeee")
        //     .style("position", "sticky")
        //     .style("top", 0)
        //     .append("tr")
        //     .style("table-layout", "fixed")
        //     .selectAll("th")
        //     .data(["Rank", "Value", "Lane", "Cluster", "Anomaly score"])
        //     .enter()
        //     .append("th")
        //     .style("text-align", "center")
        //     .style("padding", "5px 15px")
        //     .text(function (d) {
        //         return d
        //     })
        // let tdWidth = headerTd.node().getBoundingClientRect().width + 30 // 30: padding
        // let clusterRows = clusterTable.append("tbody")
        // var count = 1;
        // for (let i = 0; i < focus[0]["clusters"].length; i++) {
        //     let cluster = focus[0]["clusters"][i]
        //     let row = clusterRows.append("tr")
        //         .style("table-layout", "fixed")
        //     for (let other of cluster["other"]) {
        //         let row = clusterRows.append("tr")
        //             .style("text-align", "center")
        //         row.append("td")
        //             .text(count)
        //             .style("text-align", "center")
        //         count++
        //         row.append("td")
        //             .style("text-align", "center")
        //             .text(other["field"])
        //         let lane = row.append("td")
        //             .style("text-align", "center")
        //             .append("svg")
        //             .attr("width", tdWidth)
        //             .attr("height", 12)
        //             .append("g")
        //         for (let j = 0; j < focus[0]["clusters"].length; j++) {
        //             lane.append("rect")
        //                 .style("width", 10)
        //                 .style("height", 10)
        //                 .style("fill", SERIES_COLORS[j])
        //                 .style("x", tdWidth / 2 - focus[0]["clusters"].length * 5 + 10 * j)
        //                 .style("y", 0)
        //         }
        //         lane.append("circle")
        //             .attr("cx", tdWidth / 2 - focus[0]["clusters"].length * 5 + 5 + 10 * i)
        //             .attr("cy", 5)
        //             .attr("r", "3px")
        //             .attr("stroke", "black")
        //             .attr("fill", "black")
        //         row.append("td")
        //             .style("text-align", "center")
        //             .text("C" + i)
        //         row.append("td")
        //             .style("text-align", "center")
        //             .text(other["score"].toFixed(2))
        //     }
        // }
        // tableContainer.style("height", Math.min(15 * count + 15, 100) + "px")
        return svg;
    }
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
//         return d3.timeFormat("%Y-%-m-%-d")
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
//         return d3.timeFormat("%Y/%m/%d/%H")
//     else {
//         return ""
//     }
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

export default MultivariateOutlier;