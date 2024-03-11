import * as d3 from 'd3';
import Chart from '../../chart';
import { parseTime, formatTick } from '../constant/timeConstant'
import { getPosition } from '../constant/getPosition';
import { tooltipContainerId } from '../constant/getContainer';

const ENGFONT = "OPPOSans";
const COLOR_AXIS = "#000000";
const COLOR_GRID = "#E6E6E6";
const COLOR_TOOLTIP_DARK = "#3E3A39";
const COLOR_TOOLTIP_LIGHT = "#FCFBE7";
// const SERIES_COLORS = ["#6C8EF2","#8B65BA","#4B8384","#E1944E" ,"#5EA211"]
const SERIES_COLORS = ["#6C8EF2", "#92551D", "#8B65BA", "#4B8384", "#5EA211"]
const BLOCK_COLOR = { 'baseline': '#d2cffd', 'Compare': '#f5bf27' };
const BASELINE_SERIES_COLOR = "#5B8EF9"
const TITLE_BLOCK = '#000000'
const COLOR_LEGEND = { 'max': '#ffc136', 'min': '#ffffff' }
const TICK_VALUE = { 'tickSize': 10, 'tickWidth': 2 }

class Similarity extends Chart {
    constructor(props) {
        super(props);
        this._x = '';
        this._y = '';
        this.props = props
    }
    display() {
        /**
         * The main drawing function
         */
        //---------------parse fact-------------------------
        let factResult = this.parsrFact()
        let data = factResult.data
        let measure = factResult.measure
        let breakdown = factResult.breakdown
        let focus = factResult.focus
        let subspace = factResult.subspace
        if (focus.length === 0) return

        //---------------init chart size--------------------
        let chartResult = this.setChartStandard(measure, focus)
        let chartSize = chartResult._chartSize
        let width = chartResult._width
        let height = chartResult._height
        let margin = chartResult._margin

        //------------------init---------------------------
        //get container
        // let containerSelector = this.container()
        let containerSelector = tooltipContainerId
        //init svg
        let svg = this.initSvg(chartSize, margin)
        //draw legend
        this.drawLegend(svg, width)

        //------------------draw x axis-------------------
        let xAxisResult = this.drawXAxis(svg, data, breakdown, width, height, chartSize)
        let x = xAxisResult._x
        let tick_format = xAxisResult._tick_format

        //-----------------Sets the layers for drawing------------------------
        let lineLayer = svg.append("g").attr('class', 'lineLayer')
        let yAxisLayer = svg.append("g").attr("class", "yAxis")
        let simiBlockLayer = svg.append('g').attr('class', 'simiblock')
        let oneYLength = (height - 20 + 15) / measure.length
        //--------------------set series color--------------------------------
        let seriesColor = this.setSeriesColor(measure)
        let tooltipPathList = [];
        let tooltipPathData = [];
        //--------------calculater max and min value of Base Line--------------
        let baseLineMaxMin, baseStart, baseEnd, baseLineField;
        focus.forEach(function (item, index) {
            if (item.value[0].text === "Base Line") {
                baseStart = item.value[0].start
                baseEnd = item.value[0].end
                baseLineField = item.field
                baseLineMaxMin = d3.extent(data.slice(baseStart, baseEnd + 1), function (d) { return d[baseLineField] })
            }
        })

        //------------Draw all time series data-------------------------------
        for (let i = 0; i < measure.length; i++) {
            let currentMeasureName = measure[i].field
            //draw y axis
            let y = this.drawYAxis(data, yAxisLayer, chartSize, oneYLength, currentMeasureName, seriesColor, i)
            //draw back grid
            let lineGen = this.drawBackLine(lineLayer, data, x, y, chartSize, breakdown, currentMeasureName, seriesColor)
            //set simi block transparency
            let backColor = d3.scaleLinear().domain([0, 1]).range([0.001, 0.5])
            //draw similarity part
            this.drawSimiPart(subspace, data, x, oneYLength, focus, breakdown, measure, simiBlockLayer, tooltipPathList, tooltipPathData, baseLineMaxMin, lineGen, seriesColor, backColor, currentMeasureName, i)

        }
        if (this._showTooltip) {
            renderTooltip(this.tooltipId, containerSelector, tooltipPathList, tooltipPathData, data, breakdown, tick_format, { "field": baseLineField, "start": baseStart, "end": baseEnd }, seriesColor)
        }
        return svg;
    }

    parsrFact() {
        /**
         * Parse fact json
         * return:The contents of each field in fact
         */
        let factData = this.factdata()
        let measure = this.measure();
        let breakdown = this.breakdown();
        let focus = this.focus();
        let subspace = this.subspace();
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))
        let data = factData
        return { data: data, measure: measure, breakdown: breakdown, focus: focus, subspace: subspace }
    }

    setChartStandard(measure, focus) {
        /** 
         * calculate size of the chart
         * return chart size parameters
         */
        // set the dimensions and margins of the graph
        let chartSize = { width: 600, height: 360 }
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

    drawLegend(svg, width) {
        /**
         * Draw a legend in SVG(Located in the upper right corner of SVG)
         */
        //set scale
        let linear = d3.scaleLinear().domain([400, width - 70]).range([0, 1])
        //Set the legend gradient color
        let compute = d3.interpolate(COLOR_LEGEND['max'], COLOR_LEGEND['min'])
        //draw legend rect
        svg.selectAll("rect")
            .data(d3.range(400, width - 70, 1))
            .enter()
            .append("rect")
            .attr("x", function (d, i) {
                return i + 400;
            })
            .attr("y", function (d, i) {
                return -10;
            })
            .attr("width", 1.1)
            .attr("height", 8)
            .style("stroke", function (d) {
                return compute(linear(d))
            })
            .style("fill", function (d) {
                return compute(linear(d));
            });
        //text:100,Color maximum value
        svg.append("text")
            .attr("y", -2)
            .attr("x", 400)
            .style("text-anchor", "start")
            .style("font-size", "8px")
            .text('100')
        //text:0,Color minmum value
        svg.append("text")
            .attr("y", -2)
            .attr("x", width - 70)
            .style("text-anchor", "start")
            .style("font-size", "8px")
            .text('0')
        //text:Similarity Score
        svg.append("text")
            .attr("y", -2)
            .attr("x", width - 60 + 7)
            .style("text-anchor", "start")
            .style("font-size", "8px")
            .text('Similarity Score')
    }

    drawXAxis(svg, data, breakdown, width, height, chartSize) {
        /**
         * Draw the X axis
         */
        let tick_format = formatTick(data[0][breakdown[0].field]);
        // set the ranges
        let x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }))
            .range([30, width - 10])
        // Scale the range of the data in the domains
        let axisX = d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%Y/%m/%d/%H"))
        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + (height - 20) + ")")
            .call(axisX)
            .attr("font-family", ENGFONT)
            .call(g => {
                g.attr("font-size", TICK_VALUE.tickSize);
                g.attr("font-family", ENGFONT);
                let domainD = g.selectAll(".domain").attr("d");
                domainD = domainD.replace("6V", (6 * chartSize.height / 320) + "V")
                domainD = domainD.replace("V6", "V" + (6 * chartSize.height / 320))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", TICK_VALUE.tickWidth);
                g.selectAll(".tick")
                    .selectAll("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_VALUE.tickWidth)
                    .attr("y2", 6 * chartSize.height / 320);

                g.selectAll("text")
                    .attr("y", 9 * chartSize.height / 320);
            })
            .call(axisX)
        return { _x: x, _tick_format: tick_format }
    }
    drawYAxis(data, yAxisLayer, chartSize, oneYLength, currentMeasureName, seriesColor, i) {
        /**
         * Draw the Y axis
         */
        let y = d3.scaleLinear().range([oneYLength * (i + 1) - 15, oneYLength * i])
        y.domain(d3.extent([].concat(
            // lower boundary minus margin
            data.map(function (d) { return d[currentMeasureName] * 0.95 }),
            // upper boundary add margin
            data.map(function (d) { return d[currentMeasureName] * 1.05 })
        )));
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
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", TICK_VALUE.tickWidth);
                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_VALUE.tickWidth)
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
            .text(currentMeasureName)
        yAxisLayer.append("rect")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("x", title.node().getBBox().x)
            .attr("y", title.node().getBBox().y)
            .attr("width", title.node().getBBox().width + 2)
            .attr("height", title.node().getBBox().height)
            .attr("fill", seriesColor[currentMeasureName])
        title.node().remove()
        yAxisLayer.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -5)
            .attr("x", 0 - (oneYLength * (2 * i + 1) - 15) / 2)
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .text(currentMeasureName)
        return y
    }

    setSeriesColor(measure) {
        /**
         * set series color
         */
        let seriesColor = {}
        for (let i = 0; i < measure.length; i++) {
            seriesColor[measure[i].field] = SERIES_COLORS[i % SERIES_COLORS.length]
        }
        return seriesColor
    }

    drawBackLine(lineLayer, data, x, y, chartSize, breakdown, currentMeasureName, seriesColor) {
        /**
         * draw series line and back grid
         */
        //draw Grid
        lineLayer.append('g').selectAll('line.line')
            .data(y.ticks(5)).enter().append('line')
            .attr('x1', 30)
            .attr('x2', chartSize.width)
            .attr('y1', function (d) { return y(d) })
            .attr('y2', function (d) { return y(d) })
            .attr('stroke', COLOR_GRID)
            .attr('stroke-width', '2px')
        //draw series
        let lineGen = d3.line().curve(d3.curveMonotoneX)
            .x(function (d) {
                return x(parseTime(d[breakdown[0].field]));
            })
            .y(function (d) {
                return y(d[currentMeasureName]);
            })
        lineLayer.append('path')
            .attr('d', lineGen(data))
            .attr('stroke', seriesColor[currentMeasureName])
            .attr('stroke-width', '2px')
            .attr('fill', 'none')
        return lineGen
    }

    drawSimiPart(subspace, data, x, oneYLength, focus, breakdown, measure, simiBlockLayer, tooltipPathList, tooltipPathData, baseLineMaxMin, lineGen, seriesColor, backColor, currentMeasureName, i) {
        /**
         * draw similarity block
         */
        for (let similarity_slice of focus) {
            if (similarity_slice.field === currentMeasureName) {
                let value = similarity_slice.value
                for (let item of value) {
                    //Locate the similarity part
                    let start = Math.max(0, item.start)
                    let end = Math.min(data.length - 1, item.end + 1)

                    //Draw similarity background box boundary rect
                    let tooltipPath = simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", oneYLength * i)
                        .attr("width", x(parseTime(data[end][breakdown[0].field])) - x(parseTime(data[start][breakdown[0].field])))
                        .attr("height", oneYLength - 15)
                        .attr("fill", BLOCK_COLOR[similarity_slice.tag])
                        .attr("fill-opacity", function () {
                            if (similarity_slice.tag === 'baseline') {
                                return 0.4
                            } else {
                                return backColor(item.similarity_value)
                            }
                        })
                    //If it is not baseline, the Tooltip small box appears
                    if (similarity_slice.tag !== "baseline") {
                        //Find the maximum and minimum values for this section for the tooltip
                        let minmax = d3.extent(data.slice(start, end + 1), function (d) { return d[currentMeasureName]; })
                        tooltipPathList.push(tooltipPath)
                        //Compare the minimum and maximum values to the baseline and pass them to the tooltip
                        tooltipPathData.push(
                            {
                                "field": similarity_slice.field,
                                "start": start,
                                "end": end,
                                "ymax": minmax[1] > baseLineMaxMin[1] ? minmax[1] : baseLineMaxMin[1],
                                "ymin": minmax[0] < baseLineMaxMin[0] ? minmax[0] : baseLineMaxMin[0],
                                "similarity_value": item.similarity_value
                            })
                    }
                    //Draw a similarity line
                    simiBlockLayer.append("path")
                        .attr("d", lineGen(data.slice(start, end + 1)))
                        .attr("stroke", seriesColor[measure[i].field])
                        .attr("stroke-width", "2px")
                        .attr("fill", "none")

                    //Draw the line to the left of the Similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", oneYLength * i)
                        .attr("width", 1)
                        .attr("height", oneYLength - 15)
                        .attr("fill", BLOCK_COLOR[similarity_slice.tag])

                    //Draw the line to the right of the Similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[end][breakdown[0].field])) - 1)
                        .attr("y", oneYLength * i)
                        .attr("width", 1)
                        .attr("height", oneYLength - 15)
                        .attr("fill", BLOCK_COLOR[similarity_slice.tag])

                    //Add a simi block title
                    simiBlockLayer.append("text")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])) + 5)
                        .attr("y", oneYLength * i + 7 + 5)
                        .attr("fill", TITLE_BLOCK)
                        .style("font-size", "7px")
                        .style("font-family", ENGFONT)
                        .style("font-weight", "bold")
                        .text(item.text)
                }
            }
        }
    }

}
let renderTooltip = (tooltipId, containerSelector, tooltipPathList, tooltipPathData, data, breakdown, tick_format, baseline_local, seriesColor) => {
    //外部的整个div
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
    //大框界里面的标题栏
    let hoverTooltipTitle = hoverTooltip.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("height", "15px")
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
    //大框界下面的绘图栏
    let hoverTooltipContent = hoverTooltip.append("div")
        .style("width", "200px")
        .style("height", "100px")
        .style("border", `2px solid ${COLOR_TOOLTIP_DARK}`)
        .style("border-radius", "0px 4px 4px 4px")
        .style("background", COLOR_TOOLTIP_LIGHT)

    //左侧的指向性箭头
    hoverTooltipContent.append("span")
        .style("position", "absolute")
        .style("left", "-10px")
        .style("top", "60px")
        .style("border-width", "10px")
        .style("border-style", "dashed solid dashed dashed")
        .style("border-color", `transparent ${COLOR_TOOLTIP_DARK} transparent transparent`)
        .style("font-size", 0)
        .style("line-height", 0)

    //左侧指向性箭头内部的白色小三角
    hoverTooltipContent.append("em")
        .style("position", "absolute")
        .style("left", "-4px")
        .style("top", "62px")
        .style("border-width", "8.2px")
        .style("border-style", "dashed solid dashed dashed")
        .style("border-color", `transparent ${COLOR_TOOLTIP_LIGHT} transparent transparent`)
        .style("font-size", 0)
        .style("line-height", 0)
    //内部画图区域
    hoverTooltipContent.append("div")
        .attr("id", "tooltip-chart" + tooltipId)

    for (let i = 0; i < tooltipPathList.length; i++) {

        tooltipPathList[i]
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
            .on("mousemove", function (d) {
                let position = getPosition()
                hoverTooltip.style("left", (position.posX + 30) + "px").style("top", (position.posY - 50) + "px")
                let title = tick_format(parseTime(data[tooltipPathData[i].start][breakdown[0].field])) + "-" + tick_format(parseTime(data[tooltipPathData[i].end][breakdown[0].field]))
                hoverTooltipTitle.html(title)
                //x轴的定义域为：当前选中数据点的顺序
                let tooltipX = d3.scaleLinear().domain([0, tooltipPathData[i].end - tooltipPathData[i].start]).range([0, 195])
                let tooltipY = d3.scaleLinear().domain([tooltipPathData[i].ymin * 0.9, tooltipPathData[i].ymax * 1.1]).range([100, 0])
                let tooltipBaslineGen = d3.line().curve(d3.curveMonotoneX)
                    .x(function (d, i) {
                        return tooltipX(i);
                    })
                    .y(function (d, i) {
                        return tooltipY(d[baseline_local.field]);
                    })
                let tooltipCompareGen = d3.line().curve(d3.curveMonotoneX)
                    .x(function (d, i) {
                        return tooltipX(i);
                    })
                    .y(function (d) {
                        return tooltipY(d[tooltipPathData[i].field]);
                    })
                //绘制tooltip上的图形
                d3.select("#tooltip-chart" + tooltipId).selectAll("*").remove()
                let tooltipSvg = d3.select("#tooltip-chart" + tooltipId)
                    .append("svg")
                    .attr("class", tooltipPathData[i].field)
                    .attr("width", "200")
                    .attr("height", "100")
                let tooltipLayer = tooltipSvg.append("g")
                    .attr("font-family", ENGFONT)

                //绘制baseline的折线图
                tooltipLayer.append("path")
                    .attr("d", tooltipBaslineGen(data.slice(baseline_local.start, baseline_local.end + 1)))
                    .attr("stroke", BASELINE_SERIES_COLOR)
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                //绘制与baseline进行比对的序列的折线图
                tooltipLayer.append("path")
                    .attr("d", tooltipCompareGen(data.slice(tooltipPathData[i].start, tooltipPathData[i].end + 1)))
                    .attr("stroke", seriesColor[tooltipPathData[i].field])
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                //绘制baseline图例rect
                tooltipLayer.append("rect")
                    .attr("x", 6)
                    .attr("y", 100 - 5 - 6)
                    .attr("width", 15)
                    .attr("height", 5)
                    .attr("fill", BASELINE_SERIES_COLOR)

                //添加文字
                //文字"Base Line"
                tooltipLayer.append("text")
                    .attr("x", 6 + 15 + 6)
                    .attr("y", 100 - 5 - 2)
                    .attr("fill", "#3e3a39")
                    .style("font-size", "6px")
                    .style("font-family", ENGFONT)
                    .style("font-weight", "bolder")
                    .text("Base Line")

                //数字"similarity"的值
                tooltipLayer.append("text")
                    .attr("x", 6)
                    .attr("y", 8)
                    .attr("fill", "#ffc111")
                    .style("font-size", "7px")
                    .style("font-family", ENGFONT)
                    .style("font-weight", "bolder")
                    .text((tooltipPathData[i].similarity_value * 100).toFixed(2))

                //文字"Similarity"
                tooltipLayer.append("text")
                    .attr("x", 30)
                    .attr("y", 8)
                    .attr("fill", "#3e3a39")
                    .style("font-size", "7px")
                    .style("font-family", ENGFONT)
                    .style("font-weight", "bolder")
                    .text("Similarity")
                // add y axis
                tooltipSvg.append("g")
                    .attr("transform", "translate(200, 0)")
                    .call(d3.axisLeft(tooltipY).ticks(3).tickFormat(function (d) {
                        if ((d / 1000000) >= 1) {
                            d = d / 1000000 + "M";
                        } else if ((d / 1000) >= 1) {
                            d = d / 1000 + "K";
                        }
                        return d;
                    }))
                    .call(g => {
                        g.attr("font-size", '6px')
                        g.attr("font-weight", 'light')
                        g.attr("font-family", ENGFONT)

                        let domainD = g.selectAll(".domain").attr("d");
                        domainD = domainD.replace("M-6", "M-" + (6 * 200 / 640))
                        domainD = domainD.replace("H-6", "H-" + (6 * 200 / 640))
                        g.selectAll(".domain").attr("d", domainD).attr("stroke-width", "1px");
                        g.selectAll(".tick")
                            .select("line")
                            .attr("stroke", COLOR_AXIS)
                            .attr("stroke-width", "1px")
                            .attr("x2", -6 * 200 / 640);

                        g.selectAll("text")
                            .attr("x", -9 * 200 / 640);
                    });
            })
    }

}

export default Similarity;