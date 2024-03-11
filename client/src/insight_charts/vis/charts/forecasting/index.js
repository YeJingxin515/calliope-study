import * as d3 from 'd3';
import Chart from '../../chart';

const ENGFONT = "OPPOSans";
const COLOR_REGULAR = "#6C8EF2";
const COLOR_CONFIDENCE = "#E4E4E4";
const TRANSPARENCY_CONFIDENCE = 0.7;
const COLOR_GRID = "#E6E6E6";
const COLOR_AXIS = "#000000";

class Forecasting extends Chart {
    constructor() {
        super();
        this._x = '';
        this._y = '';
    }

    display() {
        let factData = this.factdata();
        let measure = this.measure();
        let breakdown = this.breakdown();
        let focus = this.focus();

        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))
        let measureName = measure[0].aggregate === 'count' ? "COUNT" : measure[0].field

        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 280 }
        let margin = {
            "top": 15,
            "right": 20,
            "bottom": 15,
            "left": 20
        }
        let tickWidth = 2

        let width = chartSize.width - margin.left - margin.right,
            height = chartSize.height - margin.top - margin.bottom;

        let containerSelector = this.container();
        let svg = d3.select(containerSelector)
            .append("svg")
            .attr("width", chartSize.width)
            .attr("height", chartSize.height)
            .append("g")
            .attr("transform", "translate(" + (margin.left + 10) + "," + margin.top + ")")
            .attr("font-family", ENGFONT);

        // set the ranges
        let x = d3.scaleTime()
            .range([0, width - 20])
        // .padding(0.1);
        let y = d3.scaleLinear()
            .range([height - 20, 0]);

        let pred = []
        let timeDelta = parseTime(factData[1][breakdown[0].field]) - parseTime(factData[0][breakdown[0].field])
        for (let i = 1; i <= focus[0].value.length; i++) {
            let current = {}
            current[breakdown[0].field] = new Date(parseTime(factData[factData.length - 1][breakdown[0].field]).getTime() + timeDelta * i)
            current['value'] = focus[0].value[i - 1]
            current['up'] = focus[0].up[i - 1]
            current['low'] = focus[0].low[i - 1]
            pred.push(current)
        }
        // Scale the range of the data in the domains
        x.domain(d3.extent([parseTime(factData[0][breakdown[0].field]), pred[pred.length - 1][breakdown[0].field]]));
        y.domain(d3.extent([].concat(
            // lower boundary minus margin
            factData.map(function (d) { return d[measure[0].field] * 0.85 }),
            // upper boundary add margin
            factData.map(function (d) { return d[measure[0].field] * 1.15 })
        )));

        // add the x Axis
        let format_TicksCount = formatTicksCount(factData[0][breakdown[0].field]);
        let tick_format = formatTick(factData[0][breakdown[0].field]);
        let axisX = d3.axisBottom(x).tickFormat(tick_format)
        if (format_TicksCount === d3.timeYear) {
            axisX.ticks(format_TicksCount)
        }

        let areaGen = d3.area()
            .x(function (d) {
                return x(d[breakdown[0].field]);
            })
            .y0(function (d) {
                return y(d['low']);
            })
            .y1(function (d) {
                return y(d['up']);
            })
        svg.append('g').selectAll('path.area')
            .data(pred)
            .enter()
            .append('path')
            .attr('class', 'area')
            .attr('d', areaGen(pred))
            .attr('fill', COLOR_CONFIDENCE)
            .attr('opacity', TRANSPARENCY_CONFIDENCE)


        let lineLayer = svg.append("g").attr('class', 'lineLayer')

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
        let lineGenPred = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(d[breakdown[0].field]);
            })
            .y(function (d) {
                return y(d['value']);
            })

        lineLayer.append('path')
            .attr('d', lineGenPred(pred))
            .attr('stroke', COLOR_REGULAR)
            .attr('stroke-width', '3px')
            .attr('fill', 'none')
            .attr('stroke-dasharray', '8px')

        console.log(pred)
        let rawPath = lineLayer.append('path')
            .attr('d', lineGen(factData))
            .attr('stroke', COLOR_REGULAR)
            .attr('stroke-width', '3px')
            .attr('fill', 'none')

        svg.append("line")
            .attr("x1", x(pred[0][breakdown[0].field]))
            .attr("y1", height - 20)
            .attr("x2", x(pred[0][breakdown[0].field]))
            .attr("y2", y(pred[0]['value']))
            .attr("stroke", "black")
            .attr("stroke-width", "1px")
            .attr("stroke-dasharray", "2px")

        let tickValues = [];
        tickValues.push(parseTime(factData[0][breakdown[0].field]))
        tickValues.push(pred[0][breakdown[0].field])
        tickValues.push(pred[pred.length - 1][breakdown[0].field])
        axisX.tickValues(tickValues)

        let tooltipLayer = svg.append("g").attr("class", "tooltip");

        renderDetailValue(containerSelector, rawPath, x, y, height, factData, breakdown, measureName, tick_format, tooltipLayer)

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
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                g.selectAll(".tick")
                    .selectAll("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", tickWidth)
                    .attr("y2", 5);

                g.selectAll("text")
                    .attr("y", 10)
                // .attr("transform", 'rotate(-20)')
                // .attr("style", 'text-anchor: end')
            });

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
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", tickWidth);
                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", tickWidth)
                    .attr("x2", -5);

                g.selectAll("text")
                    .attr("x", -10);
            })
        return svg;
    }
}

let renderDetailValue = (containerSelector, rawPath, x, y, height,
    data, breakdown, measureName, tick_format, tooltipLayer) => {
    let detailValueTooltip = d3.select(containerSelector)
        .append("div")
        .style("width", "95px")
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
            let x0 = x.invert(d3.mouse(this)[0])
            let currentIndex = bisectDate(data, x0, 1)
            let time0 = parseTime(data[currentIndex - 1][breakdown[0].field])
            let time1 = parseTime(data[currentIndex][breakdown[0].field])
            let currentTime = x0 - time0 > time1 - x0 ? time1 : time0
            let currentValue = currentTime === time0 ? data[currentIndex - 1][measureName] : data[currentIndex][measureName]
            let title = tick_format(currentTime)
            detailValueTooltip.style("left", (d3.mouse(this)[0] + 30) + "px")
                .style("top", (d3.mouse(this)[1] + 20) + "px")
            detailValueTitle.html(title)
            detailValueColor.style("fill", COLOR_REGULAR)
            detailValueText.html(measureName + ": " + currentValue)

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
const formatTick = (date) => {
    if (d3.timeParse("%Y-%m-%d")(date))
        return d3.timeFormat("%Y-%-m-%-d");
    else if (d3.timeParse("%Y/%m/%d")(date))
        return d3.timeFormat("%Y/%-m/%-d")
    else if (d3.timeParse("%Y-%m")(date))
        return d3.timeFormat("%Y-%m")
    else if (d3.timeParse("%Y/%m")(date))
        return d3.timeFormat("%Y/%m")
    else if (d3.timeParse("%Y")(date))
        return d3.timeFormat("%Y")
    else if (d3.timeParse("%Y-%m-%dT%H:%M:%S.%fZ")(date))
        return d3.timeFormat("%m/%d %H")
    else
        return ""
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
}


export default Forecasting;