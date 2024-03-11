import * as d3 from 'd3';
import { $CombinedState } from 'redux';
import Chart from '../../chart';
import { getPosition } from '../constant/getPosition';
import { parseTime, formatTick, formatTicksCount } from '../constant/timeConstant'
const ENGFONT = "OPPOSans";
const COLOR_AXIS = "#000000";
const COLOR_GRID = "#E6E6E6";
const SERIES_COLORS = ["#6C8EF2", "#92551D", "#8B65BA", "#4B8384", "#5EA211"]
const TICK_VALUE = { 'tickSize': 10, 'tickWidth': 2 }
const RECOMMEND_COLOR = "#f5bf27"
const SEQENCE_COLOR = "#f5bf27"
const gap = 30
let drawMultiBlock = false;

class Origin extends Chart {
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
        //parse focus content
        // this.block=[]
        // this.location=[]
        // if(focus.length>0){
        //     this.location=[focus[0].start,focus[0].end]
        // }
        // for(let i=0;i<focus.length;i++){
        //     this.block.push(focus[i].field)
        // }

        //---------------init chart size--------------------
        let chartResult = this.setChartStandard(data, measure)
        let chartSize = chartResult._chartSize
        let width = chartResult._width
        let height = chartResult._height
        let margin = chartResult._margin

        //------------------init---------------------------
        //init svg
        let svg = this.initSvg(chartSize, margin)

        //------------------draw x axis-------------------
        let xAxisResult = this.drawXAxis(svg, data, breakdown, width, height, chartSize)
        let x = xAxisResult._x

        //-----------------Sets the layers for drawing------------------------
        let lineLayer = svg.append("g").attr('class', 'lineLayer')
        let yAxisLayer = svg.append("g").attr("class", "yAxis")
        let yTextToolitip = svg
            .append("div")
            .attr("id", "text-tooltip")
            .style("z-index", 2000)
            .style("width", "200px")
            .style("height", "115px")
            .style("opacity", 0.9)
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("padding-left", "10px")
        let oneYLength = (height - 20 + gap) / measure.length
        let simiBlockLayer = svg.append('g').attr('class', 'simiblock')

        //--------------------set series color--------------------------------
        let seriesColor = this.setSeriesColor(measure)
        //--------------calculater max and min value of Base Line--------------

        //------------Draw all time series data-------------------------------
        for (let i = 0; i < measure.length; i++) {
            let currentMeasureName = measure[i].field
            //draw y axis
            let y = this.drawYAxis(data, yAxisLayer, yTextToolitip, chartSize, oneYLength, currentMeasureName, seriesColor, i)
            //draw back grid
            let lineGen = this.drawBackLine(lineLayer, data, x, y, width, breakdown, currentMeasureName, seriesColor)
            // //univariate insight
            // if (focus.length === 1) {
            //     this.drawUniFocusPart(data, x, oneYLength, focus, breakdown, measure, simiBlockLayer, lineGen, seriesColor, currentMeasureName, i)
            // }
            // //multivariate insight
            // //绘制一遍block(采用全局变量drawMultiBlock进行控制),循环绘制多遍序列
            // else if (focus.length > 1) {
            //     this.drawMultiFocusPart(data, x, oneYLength * measure.length, focus, breakdown, measure, simiBlockLayer, lineGen, seriesColor, currentMeasureName, i)
            // }

        }
        if (drawMultiBlock) drawMultiBlock = false;
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
        // set data
        factData = factData.sort((a, b) => parseTime(a[breakdown[0].field]) - parseTime(b[breakdown[0].field]))
        let data = factData
        return { data: data, measure: measure, breakdown: breakdown, focus: focus }
    }

    setChartStandard(data, measure) {
        /** 
         * calculate size of the chart
         * return chart size parameters
         */
        // set the dimensions and margins of the graph
        let chartSize = { width: Math.max(data.length * 2, 1000), height: 120 * measure.length }
        let margin = {
            "top": 15,
            "right": 50,
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
        // let tick_format = formatTick(data[0][breakdown[0].field]);
        // set the ranges
        let x = d3.scaleTime()
            .domain(d3.extent(data, function (d) { return parseTime(d[breakdown[0].field]); }))
            .range([60, width - 10])
        // Scale the range of the data in the domains
        // let format_TicksCount = formatTicksCount(data[0][breakdown[0].field]);
        let tick_format = formatTick(data[0][breakdown[0].field]);
        let axisX = d3.axisBottom(x).ticks(5).tickFormat(tick_format)
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
    drawYAxis(data, yAxisLayer, yTextToolitip, chartSize, oneYLength, currentMeasureName, seriesColor, i) {
        /**
         * Draw the Y axis
         */
        let y = d3.scaleLinear().range([oneYLength * (i + 1) - gap, oneYLength * i])
        y.domain(d3.extent([].concat(
            // lower boundary minus margin
            data.map(function (d) { return d[currentMeasureName] * 0.95 }),
            // upper boundary add margin
            data.map(function (d) { return d[currentMeasureName] * 1.05 })
        )));
        yAxisLayer.append("g")
            .attr("transform", "translate(60, 0)")
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
                domainD = domainD.replace("M-6", "M-" + (6 * 1))
                domainD = domainD.replace("M-6", "M-" + (6 * 1))
                // domainD = domainD.replace("M-6", "M-" + (6 * chartSize.width / 640))
                // domainD = domainD.replace("H-6", "H-" + (6 * chartSize.width / 640))
                g.selectAll(".domain").attr("d", domainD).attr("stroke-width", TICK_VALUE.tickWidth);
                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_VALUE.tickWidth)
                    .attr("x2", -6);
                // .attr("x2", -6 * chartSize.width / 640);

                g.selectAll("text")
                    // .attr("x", -9 * chartSize.width / 640);
                    .attr("x", -9);
            });
        let yText = currentMeasureName
        if (currentMeasureName.length > 15) {
            yText = yText.substr(0, 15) + '...'
        }
        yAxisLayer.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 20)
            .attr("x", 0 - (oneYLength * (2 * i + 1) - gap) / 2)
            .style("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", seriesColor[currentMeasureName])
            .style("text-decoration", "underline")
            .style("cursor", "pointer")
            .text(yText)
            .on('mouseover', function (d, i) {
                yTextToolitip.html(currentMeasureName)
                yTextToolitip.transition()
                    .duration(200)
                    .style("opacity", .9)

            })
            .on("mouseout", function (d) {
                yTextToolitip.transition()
                    .duration(500)
                    .style("opacity", 0)
            })
            .on("mousemove", function (d) {
                let position = getPosition()
                yTextToolitip.style("left", (position.posX + 30) + "px").style("top", (position.posY - 50) + "px")
            })

        return y
    }
    drawUniFocusPart(data, x, oneYLength, focus, breakdown, measure, simiBlockLayer, lineGen, seriesColor, currentMeasureName, i) {
        /**
         * draw uni focus block
         */
        let pointer = this.props;
        for (let similarity_slice of focus) {
            if (similarity_slice.field === currentMeasureName) {
                let value = similarity_slice.value
                for (let item of value) {
                    //Locate the similarity part
                    let start = Math.max(0, item.start - 1)
                    let end = Math.min(data.length - 1, item.end + 1)

                    //Draw similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", oneYLength * i)
                        .attr("width", x(parseTime(data[end][breakdown[0].field])) - x(parseTime(data[start][breakdown[0].field])))
                        .attr("height", oneYLength - 30)
                        .attr("fill", function () {
                            if (pointer.spec.chart.id === "origin-recommend") return RECOMMEND_COLOR
                            else return SEQENCE_COLOR
                        }
                        )
                        .attr("fill-opacity", 0.2)
                        .attr("cursor", "pointer")
                        .attr("id", currentMeasureName + "-" + item.start + "-" + item.end)
                        .attr("class", "insight-block false")
                        .on("mouseover", function () {
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("fill-opacity", 0.5)
                        })
                        .on("mouseout", function () {
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("fill-opacity", 0.2)
                        })
                        .on("click", function () {
                            // d3.select(this)
                            // .attr("class","insight-block true")
                            if (!pointer.isPopInsightCard) {
                                pointer.setPopInsightCardState(true)
                            }
                        })
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
                        .attr("height", oneYLength - 30)
                        .attr("fill", RECOMMEND_COLOR)

                    //Draw the line to the right of the Similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[end][breakdown[0].field])) - 1)
                        .attr("y", oneYLength * i)
                        .attr("width", 1)
                        .attr("height", oneYLength - 30)
                        .attr("fill", RECOMMEND_COLOR)
                }
            }
        }
    }
    drawMultiFocusPart(data, x, blockHeight, focus, breakdown, measure, simiBlockLayer, lineGen, seriesColor, currentMeasureName, i) {
        let pointer = this.props;
        for (let content of focus) {
            if (content.field === currentMeasureName) {
                let item = content.value[0]
                //Locate the similarity part
                let start = Math.max(0, item.start - 1)
                let end = Math.min(data.length - 1, item.end + 1)
                //only draw background rect once
                if (!drawMultiBlock) {
                    //Draw similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", 0)
                        .attr("width", x(parseTime(data[end][breakdown[0].field])) - x(parseTime(data[start][breakdown[0].field])))
                        .attr("height", blockHeight - 30)
                        .attr("fill", function () {
                            if (pointer.spec.chart.id === "origin-recommend") return RECOMMEND_COLOR
                            else return SEQENCE_COLOR
                        })
                        .attr("fill-opacity", 0.2)
                        .attr("cursor", "pointer")
                        .attr("id", currentMeasureName + "-" + item.start + "-" + item.end)
                        .attr("class", "insight-block false")
                        .on("mouseover", function () {
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("fill-opacity", 0.5)
                        })
                        .on("mouseout", function () {
                            d3.select(this)
                                .transition()
                                .duration(500)
                                .attr("fill-opacity", 0.2)
                        })
                        .on("click", function () {
                            if (!pointer.isPopInsightCard) {
                                pointer.setPopInsightCardState(true)
                            }
                        })
                }
                //Draw a similarity line
                simiBlockLayer.append("path")
                    .attr("d", lineGen(data.slice(start, end + 1)))
                    .attr("stroke", seriesColor[measure[i].field])
                    .attr("stroke-width", "2px")
                    .attr("fill", "none")
                if (!drawMultiBlock) {
                    //Draw the line to the left of the Similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[start][breakdown[0].field])))
                        .attr("y", 0)
                        .attr("width", 1)
                        .attr("height", blockHeight - 30)
                        .attr("fill", RECOMMEND_COLOR)
                        .attr("fill-opacity", 0.4)

                    //Draw the line to the right of the Similarity background box boundary rect
                    simiBlockLayer.append("rect")
                        .attr("x", x(parseTime(data[end][breakdown[0].field])) - 1)
                        .attr("y", 0)
                        .attr("width", 1)
                        .attr("height", blockHeight - 30)
                        .attr("fill", RECOMMEND_COLOR)
                        .attr("fill-opacity", 0.4)

                }
            }
        }
        if (!drawMultiBlock) drawMultiBlock = true;
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

    drawBackLine(lineLayer, data, x, y, width, breakdown, currentMeasureName, seriesColor) {
        /**
         * draw series line and back grid
         */
        //draw Grid
        lineLayer.append('g').selectAll('line.line')
            .data(y.ticks(5)).enter().append('line')
            .attr('x1', 60)
            .attr('x2', width - 10)
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
}

export default Origin;