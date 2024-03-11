import React, { Component } from 'react'
import { Tooltip } from 'antd';
import { insightColors } from '../../../../constant/RecommendedInsightColor';
import PopInsightCard from '../../SequenceView/PopInsightCard';
import Chart from '../../../../insight_charts/Chart';
import { originChartSize } from '../../../../constant/ChartSize';
import FindPopInsight from '../../../../constant/FindPopInsight';
import { findInsight } from '../../../../axios';
import InsightTypeTrans from '../../../../constant/InsightTypeTrans';
import * as d3 from 'd3';

export default class RecommendedInsightCard extends Component {
    constructor(props) {
        super(props);
        //如果父组件传来该方法 则调用方法将子组件this指针传过去
        if (props.onRef) {
            props.onRef(this)
        }
    }
    componentDidMount() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 0
                if (chartType === "multivariate_distribution") {
                    x = 180 / originChartSize[chartType].width
                } else {
                    x = 260 / originChartSize[chartType].width
                }
                let y = 110 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }

        //------------计算滚动条的位置所需要的------------
        //设置比例尺
        const { dataRange, columnsName, chartScale, chartMargin } = this.props

        let chartWidth = Math.max(dataRange[1] * 2, 1000)

        this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
        //计算每列的高度(参照origin.js中oneYLength的计算法则)
        this.oneYLength = (120 * columnsName.length - 20) / columnsName.length
    }
    shouldComponentUpdate(nextProps) {
        const { insightSpec, selected } = this.props
        if (selected !== nextProps.selected) return true
        let nextFact = nextProps.insightSpec["fact"];
        return !_.isEqual(insightSpec["fact"], nextFact);
    }
    componentDidUpdate() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 0
                if (chartType === "multivariate_distribution") {
                    x = 180 / originChartSize[chartType].width
                } else {
                    x = 260 / originChartSize[chartType].width
                }
                let y = 110 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
    calcuRecommendScrollLocation = (start, end, fields) => {
        //fields只分两种:全部和单个
        const { columnsName } = this.props
        let position = columnsName.indexOf(fields[Math.floor(fields.length / 2)])
        let divLeft = this.scale(start) + 30
        let divWidth = this.scale(end) - this.scale(start)
        let divTop = 15 + position * this.oneYLength
        let divHeight = this.oneYLength * fields.length - 30
        let boxWrapper = document.getElementById('time-seires-view')

        let heightPx = window.getComputedStyle(boxWrapper, null).getPropertyValue('height')
        let h = parseFloat(heightPx.substring(0, heightPx.length - 2))
        let widthPx = window.getComputedStyle(boxWrapper, null).getPropertyValue('width')
        let w = parseFloat(widthPx.substring(0, widthPx.length - 2))

        boxWrapper.scrollTop = divTop + divHeight / 2 - h / 2;
        boxWrapper.scrollLeft = divLeft + divWidth / 2 - w / 2 + 100;
    }
    clickRecommendCard = () => {
        const { factType, insightSpec, index, segmentInsightsStorage, file_url, timeColumnName, sequence, insightIndex } = this.props;
        this.props.setSelectedRecommendCard(index)

        let block = this.props.block
        let field = []
        let location = [block[0].value[0].start, block[0].value[0].end]
        for (let item in block) {
            field.push(block[item].field)
        }

        this.calcuRecommendScrollLocation(location[0], location[1], field)
        // set current segment's pop insights
        //TODO:之后可以改成访问API获取pop insight，而不是查表
        let fieldStr = field.sort().toString()
        let locationStr = location.sort().toString()
        let segmentKey = fieldStr + '-' + locationStr
        this.props.setCurrentPopInsights([])
        if (!segmentInsightsStorage.hasOwnProperty(segmentKey)) {
            //请求api,response成功后再set current pop insights
            findInsight(file_url, field, timeColumnName, location).then(response => {
                // message.destroy()
                // message.success({content:'Generate success!',duration:1,style:{ marginTop: '35vh'}})
                // this.props.addPopInsights(segmentKey, response.data.insights)
                // this.props.setCurrentPopInsights(response.data.insights)
                //判断是否有当前这张卡片的内容
                let pop_insights = []
                let insight_type = []
                for (let item in response.data.insights) {
                    insight_type.push(response.data.insights[item].type)
                }
                if (!insight_type.includes(factType)) {
                    pop_insights = [{ "spec": insightSpec, "type": factType, "action": -1 }].concat(response.data.insights)
                    this.props.setCurrentPopInsights(pop_insights)
                } else {
                    pop_insights = response.data.insights
                    this.props.setCurrentPopInsights(pop_insights)
                }
                this.props.addPopInsights(segmentKey, pop_insights)

            }).catch(error => {
                console.log('失败', error)
                let pop_insights = [{
                    "spec": insightSpec,
                    "type": factType,
                    "action": -1
                }]
                this.props.addPopInsights(segmentKey, pop_insights)
                this.props.setCurrentPopInsights(pop_insights)
                // this.props.setCurrentPopInsights([])
            })

        } else {
            // this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            //throught key value set current pop insights
            let pop_insights = []
            let insight_type = []
            for (let item in segmentInsightsStorage[segmentKey]) {
                insight_type.push(segmentInsightsStorage[segmentKey][item].type)
            }
            if (!insight_type.includes(factType)) {
                pop_insights = [{ "spec": insightSpec, "type": factType, "action": -1 }].concat(segmentInsightsStorage[segmentKey])
                this.props.addPopInsights(segmentKey, pop_insights)
                this.props.setCurrentPopInsights(pop_insights)
            } else {
                this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            }
        }
    }
    deleteRecommendCard = () => {
        // this.props.setSelectedRecommendCard(this.props.index)
        this.props.removeRecommendCard(this.props.index)
        this.props.setSelectedRecommendCard(-1)
    }

    render() {
        const { factType, insightSpec, index, selected } = this.props;
        //修改图表显示的格式
        insightSpec.chart.id = 'recommend-' + index.toString()
        insightSpec.chart.width = originChartSize[factType].width
        insightSpec.chart.height = originChartSize[factType].height
        insightSpec.chart.showTooltip = false
        return (
            <li>
                <div className='single-insight' style={{ border: selected ? 'rgb(244, 158, 40) 3px solid' : `${insightColors[InsightTypeTrans[factType].toLowerCase()]} 3px solid `, boxShadow: selected ? "rgba(0, 0,0,0.2) 1px 1px 0px 2px" : "rgb(0, 0 ,0) 0px 0px 0px 0px" }} >
                    <Tooltip title={InsightTypeTrans[factType]}>
                        <div className="insight-title">{InsightTypeTrans[factType]}</div>
                    </Tooltip>
                    <div className='delete' onClick={this.deleteRecommendCard}></div>
                    <div
                        className='vis'
                        ref={(node) => this.visNode = node}
                        onClick={this.clickRecommendCard}
                        style={(factType === "multivariate_outlier") ? { overflowY: 'scroll', overflowX: 'hidden' } : null}
                    >
                        <Chart spec={insightSpec} />
                    </div>
                </div>
            </li>
        )
    }
}
