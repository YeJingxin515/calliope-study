import * as d3 from "d3";
import Chart from "../../chart";
import { parseTime } from '../constant/timeConstant'

const ENGFONT = "OPPOSans";
const COLOR_REGULAR = "#6C8EF2";
const COLOR_GRID = "#E6E6E6";
const COLOR_AXIS = "#000000";
const TICK_WIDTH = 2;

class Autocorrelation extends Chart {
    constructor() {
        super();
        this._x = "";
        this._y = "";
    }

    display() {
        //parse fact
        let factResult = this.parseFact()
        let data = factResult._data
        let measure = factResult._measure
        let breakdown = factResult._breakdown
        let focus = factResult._focus
        let measureName = factResult._measureName
        if (focus.length === 0) return
        if (breakdown[1] && breakdown[1].field) return;

        //init chart size
        let chartResult = this.setChartStandard()
        let chartSize = chartResult._chartSize
        let width = chartResult._width
        let height = chartResult._height
        let margin = chartResult._margin

        //init svg
        let svg = this.initSvg(chartSize, margin)
        //init layer
        let lineLayer = svg.append("g").attr("class", "lineLayer")

        //draw x axis
        let xAxisResult = this.drawXAxis(svg, data, breakdown, focus, width, height, chartSize)
        let x = xAxisResult._x

        //draw y axis
        let y = this.drawYAxis(svg, data, measure, focus, chartSize, height)

        //draw original line
        this.drawBackLine(x, y, data, lineLayer, breakdown, measureName, focus, chartSize, height)

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
    drawXAxis(svg, data, breakdown, focus, width, height, chartSize) {
        /**
         * Draw the X axis
         */
        // set the ranges
        let x = d3.scaleLinear().range([0, width])
        // Scale the range of the data in the domains
        x.domain([-1, focus[0].correlation.length])
        // add the x Axis
        let tickValues = [];
        for (let i = 0; i < focus[0].correlation.length; i++) {
            tickValues.push(i);
        }
        let axisX = d3.axisBottom(x)
            .tickValues(tickValues)
            .ticks(tickValues.length)
            .tickFormat(d3.format('d'))

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", "translate(0," + (height - 20) + ")")
            .call(axisX)
            .call(g => {
                g.attr("font-size", "10px");
                g.attr("font-family", ENGFONT);
                g.attr("font-weight", "lighter")

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
        return { _x: x, _axisX: axisX }
    }
    drawYAxis(svg, data, measure, focus, chartSize, height) {
        /**
         * Draw the Y axis
         */
        // .padding(0.1);
        let y = d3.scaleLinear()
            .range([height - 20, 0]);

        y.domain(d3.extent([].concat(
            // lower boundary minus margin
            focus[0].correlation.map(function (d) { if (d >= 0) { return d * 0.9 } else { return d * 2.0 } }),
            // upper boundary add margin
            focus[0].correlation.map(function (d) { return d * 1.1 })
        )));

        // add the y Axis
        svg.append("g")
            .attr("class", "yAxis")
            // .attr("transform", `translate(,0)`)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.1f')))
            .call(g => {
                g.attr("font-size", "10px")
                g.attr("font-weight", "lighter")
                g.attr("font-family", ENGFONT)

                g.selectAll(".tick")
                    .select("line")
                    .attr("stroke", COLOR_AXIS)
                    .attr("stroke-width", TICK_WIDTH)
                    .attr("x2", -5);

                g.selectAll("text")
                    .attr("x", -10);
            })
        //Hide y axis
        // yAxis.select("path")
        //      .attr("display", "none")
        // yAxis.selectAll(".tick line")
        //     //  .attr("stroke-width", 0)
        //     .attr("opacity", 0)
        return y
    }
    drawBackLine(x, y, data, lineLayer, breakdown, measureName, focus, chartSize, height) {
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

        for (let i = 0; i < focus[0].correlation.length; i++) {
            lineLayer.append("circle")
                .attr("cx", x(i))
                .attr("cy", y(focus[0].correlation[i]))
                .attr("r", 4)
                .attr("fill", COLOR_REGULAR)
            lineLayer.append("line")
                .attr("x1", x(i))
                .attr("y1", d3.min([y(0), (height - 20)]))
                .attr("x2", x(i))
                .attr("y2", y(focus[0].correlation[i]))
                .attr("stroke", COLOR_REGULAR)
                .attr("stroke-width", "2.5px")
        }
        if (d3.min(focus[0].correlation) < 0) {
            let xLeft = x(-1);
            let xRight = x(focus[0].correlation.length)
            lineLayer.append("line")
                .attr("x1", xLeft)
                .attr("y1", y(0))
                .attr("x2", xRight)
                .attr("y2", y(0))
                .attr("stroke", "gray")
                .attr("stroke-width", "2px")
                .attr("opacity", 0.8)
        }
    }

}

export default Autocorrelation;