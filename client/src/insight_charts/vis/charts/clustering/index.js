import * as d3 from 'd3';
import Chart from '../../chart';

const ENGFONT = "OPPOSans";
const COLOR_CLUSTER = "#74C8F8";
const COLOR_OUTLIER = "#F72D35"
const COLOR_BG_LINE = "#AFAFAF"
const SERIES_COLORS = ["#6C8EF2", "#E1944E", "#8B65BA"]


class Clustering extends Chart {
    constructor() {
        super();
        this._x = '';
        this._y = '';
    }

    display() {
        let factData = this.factdata()
        let breakdown = this.breakdown();
        let focus = this.focus();
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))

        let data = factData
        if (focus.length === 0) return

        // set the dimensions and margins of the graph
        let chartSize = { width: 314, height: 216 }
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        }

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

        // set the ranges
        let x = d3.scaleLinear()
            .range([0, width])
        // .padding(0.1);
        let y = d3.scaleLinear()
            .range([height, 10]);

        let scatterData = []
        let clusterCounter = 1
        let outlierCounter = -1
        for (let i = 0; i < focus[0]["cluster"].length; i++) {
            for (let point of focus[0]["cluster"][i]["position"]) {
                scatterData.push({
                    "x": point[0],
                    "y": point[1],
                    "symbol": clusterCounter
                })
            }
            clusterCounter++
        }
        for (let i = 0; i < focus[0]["outlier"].length; i++) {
            for (let point of focus[0]["outlier"][i]["position"]) {
                scatterData.push({
                    "x": point[0],
                    "y": point[1],
                    "symbol": outlierCounter
                })
            }
            outlierCounter--
        }

        // Scale the range of the data in the domains
        x.domain(d3.extent(scatterData, function (d) { return d.x; }));
        y.domain(d3.extent(scatterData, function (d) { return d.y; }))


        let symbolList = d3.symbols.map(s => d3.symbol().size(18).type(s)())
        svg.append("g")
            .selectAll("path")
            .data(scatterData)
            .join("path")
            .attr("transform", d => `translate(${x(d.x)}, ${y(d.y)})`)
            .attr("fill", d => d.symbol > 0 ? COLOR_CLUSTER : COLOR_OUTLIER)
            .attr("d", d => d.symbol > 0 ? symbolList[d.symbol % symbolList.length] : symbolList[0])

        let tooltipLayer = svg.append("g")
        // draw outline of each cluster
        let valueline = d3.line()
            .x(function (d) { return d[0]; })
            .y(function (d) { return d[1]; })
            .curve(d3.curveCatmullRomClosed)
        for (let i = 1; i < clusterCounter; i++) {
            let positions = scatterData.filter(function (d) { return d.symbol === i })
                .map(function (d) { return [x(d.x), y(d.y)] })
            if (positions.length > 2) {
                let polygon = d3.polygonHull(positions)
                let centroid = d3.polygonCentroid(polygon)
                tooltipLayer.append("g")
                    .attr("transform", "translate(" + centroid[0] + "," + centroid[1] + ") scale(2)")
                    .append("path")
                    .attr("d", () => {
                        return valueline(polygon.map(function (point) {
                            return [point[0] - centroid[0], point[1] - centroid[1]]
                        }))
                    })
                    .attr("stroke", "#000000")
                    .attr("stroke-width", "0.5px")
                    .attr("fill", "none")
            }
        }

        // draw tooltip of each outlier
        for (let i = -1; i > outlierCounter; i--) {
            let position = scatterData.filter(function (d) { return d.symbol === i })[0]
            let p_x = x(position["x"])
            let p_y = y(position["y"])
            let outlierText = tooltipLayer.append("text")
                .attr("font-size", "10px")
                .attr("font-family", ENGFONT)
                .attr("font-weight", "bold")
                .attr("fill", "#000000")
                .attr("y", p_y + 5)
                .text(`Outlier ${-i}`)
            let textWidth = outlierText.node().getBBox().width
            let textSpan, lineSpan1, lineSpan2
            if (p_x > width / 2) {
                if (p_x + 20 > width) {
                    textSpan = -20 - textWidth
                    lineSpan1 = -17
                    lineSpan2 = -8
                } else {
                    textSpan = 20
                    lineSpan1 = 17
                    lineSpan2 = 8
                }
            } else {
                if (p_x - textWidth - 20 < 0) {
                    textSpan = 20
                    lineSpan1 = 17
                    lineSpan2 = 8
                } else {
                    textSpan = -20 - textWidth
                    lineSpan1 = -17
                    lineSpan2 = -8
                }
            }
            outlierText.attr("x", p_x + textSpan)
            tooltipLayer.append("line")
                .attr("x1", p_x + lineSpan1)
                .attr("x2", p_x + lineSpan2)
                .attr("y1", p_y)
                .attr("y2", p_y)
                .attr("stroke", "#000000")
                .attr("stroke-width", "1px")
        }

        let tableContainer = d3.select(containerSelector).append("div")
            .style("position", "absolute")
            .style("left", "318px")
            .style("top", "10px")
            .style("font-size", "8px")
            .style("font-family", ENGFONT)
            .attr("id", "overviewTable")

        let overviewTableContainer = d3.select(containerSelector).append("div")
            .style("position", "absolute")
            .style("left", "10px")
            .style("top", "220")
            .style("font-size", "8px")
            .style("font-family", ENGFONT)
        if (focus[0]["cluster"].length > 0) {
            updateOverviewTable(1, overviewTableContainer, symbolList, focus, data, breakdown)
        }

        // draw cluster table
        let clusterTable = tableContainer.append("table")
            .style("border", "1px solid #000000")
            .style("border-collapse", "collapse")
            .style("border-spacing", 0)
            .attr("width", "300px")
        let headerTd = clusterTable.append("thead")
            .style("background", "#eeee")
            .append("tr")
            .selectAll("th")
            .data(["Cluster", "Number of series", "Similarity in cluster"])
            .enter()
            .append("th")
            .style("padding", "5px 15px")
            .text(function (d) {
                return d
            })
        let tdWidth = headerTd.node().getBoundingClientRect().width + 30 // 30: padding
        let clusterRows = clusterTable.append("tbody")
        for (let i = 1; i < clusterCounter; i++) {
            let row = clusterRows.append("tr")
            let clusterTd = row.append("td")
            let clusterUnit = clusterTd
                .append("svg")
                .attr("width", tdWidth)
                .attr("height", 12)
                .append("g")
                .attr("id", i)
            let clusterName = clusterUnit.append("text")
                .attr("font-size", "8")
                .attr("font-family", ENGFONT)
                .attr("fill", "#000000")
                .text(`Cluster ${i}`)
            let textWidth = clusterName.node().getBBox().width
            clusterUnit.append("path")
                .attr("transform", `translate(${textWidth + 8}, -3)`)
                .attr("d", symbolList[i % symbolList.length])
                .attr("fill", COLOR_CLUSTER)
            textWidth = clusterUnit.node().getBBox().width
            let textHeight = clusterUnit.node().getBBox().height
            clusterUnit.attr("transform", `translate(${tdWidth / 2 - textWidth / 2}, ${textHeight})`)
                .on("click", function (d, i) {
                    updateOverviewTable(d3.select(this).attr("id"), overviewTableContainer, symbolList, focus, data, breakdown)
                })
            row.append("td")
                .text(`${focus[0]["cluster"][i - 1]["position"].length}`)
                .style("text-align", "center")
            clusterUnit = row.append("td")
                .append("svg")
                .attr("width", tdWidth)
                .attr("height", 12)
                .append("g")
            clusterUnit.append("rect")
                .attr("x", 0)
                .attr("y", 2)
                .attr("width", 70)
                .attr("height", 10)
                .attr("fill", "#f3f3f3")
            clusterUnit.append("rect")
                .attr("x", 0)
                .attr("y", 2)
                .attr("width", 70 * focus[0]["cluster"][i - 1]["score"])
                .attr("height", 10)
                .attr("fill", COLOR_CLUSTER)
            clusterUnit.append("text")
                .attr("x", 75)
                .attr("y", 10)
                .text(focus[0]["cluster"][i - 1]["score"].toFixed(2))
        }

        // draw outlier table
        tableContainer = d3.select(containerSelector).append("div")
            .style("position", "absolute")
            .style("left", "318px")
            .style("top", "108px")
            .style("font-size", "8px")
            .style("font-family", ENGFONT)
        let outlierTable = tableContainer.append("table")
            .style("border", "1px solid #000000")
            .style("border-collapse", "collapse")
            .style("border-spacing", 0)
            .attr("width", "300px")
        headerTd = outlierTable.append("thead")
            .style("background", "#eeee")
            .append("tr")
            .selectAll("th")
            .data(["Outlier", "Anomaly score"])
            .enter()
            .append("th")
            .style("padding", "3px 15px")
            .text(function (d) {
                return d
            })
        tdWidth = headerTd.node().getBoundingClientRect().width + 30 // 30: padding
        let outlierRows = outlierTable.append("tbody")
        for (let i = -1; i > outlierCounter; i--) {
            let row = outlierRows.append("tr")
            let outlierTd = row.append("td")
            let outlierUnit = outlierTd
                .append("svg")
                .attr("width", tdWidth)
                .attr("height", "12")
                .append("g")
            let outlierName = outlierUnit.append("text")
                .attr("font-size", "8")
                .attr("font-family", ENGFONT)
                .attr("fill", "#000000")
                .text(`Outlier ${-i}`)
            let textWidth = outlierName.node().getBBox().width
            outlierUnit.append("path")
                .attr("transform", `translate(${textWidth + 8}, -3)`)
                .attr("d", symbolList[0])
                .attr("fill", COLOR_OUTLIER)
            textWidth = outlierUnit.node().getBBox().width
            let textHeight = outlierName.node().getBBox().height
            outlierUnit.attr("transform", `translate(${tdWidth / 2 - textWidth / 2}, ${textHeight})`)
            outlierUnit = row.append("td")
                .append("svg")
                .attr("width", tdWidth)
                .attr("height", 12)
                .append("g")
                .attr("transform", `translate(25, 0)`)
            outlierUnit.append("rect")
                .attr("x", 0)
                .attr("y", 2)
                .attr("width", 70)
                .attr("height", 10)
                .attr("fill", "#f3f3f3")
            outlierUnit.append("rect")
                .attr("x", 0)
                .attr("y", 2)
                .attr("width", 70 * focus[0]["outlier"][-i - 1]["score"])
                .attr("height", 10)
                .attr("fill", COLOR_OUTLIER)
            outlierUnit.append("text")
                .attr("x", 75)
                .attr("y", 10)
                .text(focus[0]["outlier"][-i - 1]["score"].toFixed(2))
        }

        return svg;
    }
}

const updateOverviewTable = (clusterNumber, tableContainer, symbolList, focus, data, breakdown) => {
    // draw overview table
    tableContainer.selectAll("*").remove()
    let overviewTable = tableContainer.append("table")
        .style("border", "1px solid #000000")
        .style("border-collapse", "collapse")
        .style("border-spacing", 0)
        .attr("width", "600px")
    let overviewTitleUnit = overviewTable.append("thead")
        .style("background", "#eeee")
        .style("text-align", "left")
        .append("tr")
        .append("th")
        .style("padding", "3px 15px")
        .attr("colspan", 2)
        .append("svg")
        .attr("width", 100)
        .attr("height", 12)
        .append("g")
    let overviewTitle = overviewTitleUnit.append("text")
        .attr("font-size", "8")
        .attr("font-family", ENGFONT)
        .attr("fill", "#000000")
        .text(`Overview: Cluster ${clusterNumber}`)
    let textWidth = overviewTitle.node().getBBox().width
    overviewTitleUnit.append("path")
        .attr("transform", `translate(${textWidth + 8}, -3)`)
        .attr("d", symbolList[clusterNumber])
        .attr("fill", COLOR_CLUSTER)
    textWidth = overviewTitleUnit.node().getBBox().width
    let textHeight = overviewTitle.node().getBBox().height
    overviewTitleUnit.attr("transform", `translate(5, ${textHeight})`)
    let overviewRows = overviewTable.append("tbody")
    for (let i = 0; i < focus[0]["variable"].length; i++) {
        let variableName = focus[0]["variable"][i]["name"]
        let row = overviewRows.append("tr")
        // draw variable name
        let overviewTd = row.append("td")
            .style("border", "1px solid #000000")
            .style("width", "50px")
        let overviewUnit = overviewTd
            .append("svg")
            .attr("width", 50)
            .attr("height", 30)
            .append("g")
        let title = overviewUnit.append("text")
            .style("font-size", "8px")
            .text(variableName)
        overviewUnit.append("rect")
            .attr("x", title.node().getBBox().x)
            .attr("y", title.node().getBBox().y)
            .attr("width", title.node().getBBox().width)
            .attr("height", title.node().getBBox().height)
            .attr("fill", SERIES_COLORS[i % SERIES_COLORS.length])
        let textWidth = title.node().getBBox().width
        title.node().remove()
        overviewUnit.append("text")
            .style("font-size", "8px")
            .text(variableName)
        overviewUnit.attr("transform", `translate(${25 - textWidth / 2}, 18)`)

        // draw variable line
        overviewTd = row.append("td")
            .style("border", "1px solid #000000")
            .style("width", "550px")
        overviewUnit = overviewTd
            .append("svg")
            .attr("width", 550)
            .attr("height", 30)
            .append("g")
        // 1. series not in this cluster
        let seriesInClusterIndex = new Map()
        for (let series of focus[0]["cluster"][clusterNumber - 1]["member"]) {
            seriesInClusterIndex.set(series[variableName], 1)
        }
        let lineX = d3.scaleTime()
            .range([0, 550])
        lineX.domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }))
        let lineY = d3.scaleLinear()
            .range([30, 0]);
        for (let series of focus[0]["variable"][i]["member"]) {
            if (!seriesInClusterIndex.has(series)) {
                lineY.domain(d3.extent([].concat(data.map(function (d) { return d[series] }))))
                let lineGen = d3.line().curve(d3.curveMonotoneX)
                    .x(function (d) {
                        return lineX(parseTime(d[breakdown[0].field]));
                    })
                    .y(function (d) {
                        return lineY(d[series]);
                    })
                overviewUnit.append("path")
                    .attr("d", lineGen(data))
                    .attr("stroke", COLOR_BG_LINE)
                    .attr("stroke-width", "1px")
                    .attr("opacity", "20%")
                    .attr("fill", "none")
            }
        }
        for (let series of seriesInClusterIndex.keys()) {
            lineY.domain(d3.extent([].concat(data.map(function (d) { return d[series] }))))
            let lineGen = d3.line().curve(d3.curveMonotoneX)
                .x(function (d) {
                    return lineX(parseTime(d[breakdown[0].field]));
                })
                .y(function (d) {
                    return lineY(d[series]);
                })
            overviewUnit.append("path")
                .attr("d", lineGen(data))
                .attr("stroke", COLOR_BG_LINE)
                .attr("stroke-width", "1px")
                .attr("opacity", "80%")
                .attr("fill", "none")
        }
        lineY.domain(d3.extent([].concat(data.map(function (d) { return d[focus[0]["cluster"][clusterNumber - 1]["representation"][variableName]] }))))
        let lineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return lineX(parseTime(d[breakdown[0].field]));
            })
            .y(function (d) {
                return lineY(d[focus[0]["cluster"][clusterNumber - 1]["representation"][variableName]]);
            })
        overviewUnit.append("path")
            .attr("d", lineGen(data))
            .attr("stroke", SERIES_COLORS[i])
            .attr("stroke-width", "1px")
            .attr("fill", "none")
    }
}

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
    else return date
}

export default Clustering;