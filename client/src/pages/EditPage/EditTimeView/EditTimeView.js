import React, { Component } from 'react'
import './EditTimeView.less'
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VisOptionView from '../../../components/SeiresView/VisOptionView/VisOptionView';
import SeriesInsightsEditor from '../../../components/SeiresView/SeriesInsightsEditor';
import FileInformationView from '../../../components/SeiresView/FileInformationView/FileInformationView';
import HeaderOperatorView from '../../../components/SeiresView/HeaderOperatorView/HeaderOperatorView';
import SequenceView from '../../../components/SeiresView/SequenceView';
import Chart from '../../../insight_charts';
import PopInsightCard from '../../../components/SeiresView/SequenceView/PopInsightCard';
import { originChartSize } from '../../../constant/ChartSize';
import * as d3 from 'd3'

// let oneYLength=117.14285714285714
export default class EditTimeView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            mainChart: this.initChart(),
            getCurrentPopinsight: false
        }
    }
    componentDidMount() {
        // this.setState({mainChart:this.initChart()})
    }
    componentDidUpdate() {
    }

    componentDidUpdate(nextProps) {
        const { btnState } = this.props
        if (btnState !== nextProps.btnState) {
            const { dataRange, columnsName, chartScale, chartMargin } = this.props
            // if(dataRange[1]<1200)chartWidth=1200
            let chartWidth = Math.max(dataRange[1] * 2, 1000)
            // if (chartWidth < 6000) chartWidth = 6000
            // else if (chartWidth > 6000) chartWidth = 6000

            this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
            //计算每列的高度(参照origin.js中oneYLength的计算法则)
            this.oneYLength = (120 * columnsName.length - 20) / columnsName.length
            this.setState({ mainChart: this.initChart() })
        }
    }
    componentWillMount = () => {
        const { dataRange, columnsName, chartScale, chartMargin } = this.props
        let chartWidth = Math.max(dataRange[1] * 2, 1000)
        // if(dataRange[1]<1200)chartWidth=1200
        // if (chartWidth < 6000) chartWidth = 6000
        // else if (chartWidth > 6000) chartWidth = 6000

        this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
        //计算每列的高度(参照origin.js中oneYLength的计算法则)
        this.oneYLength = (120 * columnsName.length - 20) / columnsName.length
    }
    //init chart(from file details to create spec to draw chart)
    initChart = () => {
        const { originFileUrl, originSchema, originDataRange, originColumnName } = this.props
        const { file_url, schema, timeColumnName, columnsName, dataRange, rightBtnState } = this.props
        if (rightBtnState === 'Start') {
            //get template
            let oriSpec = require('../../../insight_charts/spec/origin.json');
            let initSpec = _.cloneDeep(oriSpec);
            //edit "chart" field
            initSpec.chart.id = 'origin'
            //TODO:不能把所有的数值都搞成这个大小，应该要有一个转换
            if (originDataRange.length === 0) return {}
            let chartWidth = originDataRange[1]
            // if(dataRange[1]<1200)chartWidth=1200
            if (chartWidth < 1200) chartWidth = 1200
            else if (chartWidth > 2000) chartWidth = 2000
            initSpec.chart.width = chartWidth
            initSpec.chart.height = 360
            initSpec.chart.showTooltip = false
            //edit "fact" field
            initSpec.fact.breakdown[0].field = timeColumnName
            let tempMesure = []
            originColumnName.map((colName, i) => {
                tempMesure.push({ "field": colName, "aggregate": "avg" })
            })
            initSpec.fact.measure = tempMesure
            //edit "data" field
            initSpec.data.url = originFileUrl
            initSpec.data.schema = originSchema
            return initSpec
        }
        else {
            //get template
            let oriSpec = require('../../../insight_charts/spec/origin.json');
            let initSpec = _.cloneDeep(oriSpec);
            //edit "chart" field
            initSpec.chart.id = 'origin'
            //TODO:不能把所有的数值都搞成这个大小，应该要有一个转换
            if (dataRange.length === 0) return {}
            let chartWidth = dataRange[1]
            // if(dataRange[1]<1200)chartWidth=1200
            if (chartWidth < 1200) chartWidth = 1200
            else if (chartWidth > 2000) chartWidth = 2000
            // if(dataRange[1]<1200)chartWidth=1200
            initSpec.chart.width = chartWidth
            initSpec.chart.height = 360
            initSpec.chart.showTooltip = false
            //edit "fact" field
            initSpec.fact.breakdown[0].field = timeColumnName
            let tempMesure = []
            columnsName.map((colName, i) => {
                tempMesure.push({ "field": colName, "aggregate": "avg" })
            })
            initSpec.fact.measure = tempMesure
            //edit "data" field
            initSpec.data.url = file_url
            initSpec.data.schema = schema
            return initSpec
        }
    }
    componentDidMount() {
        let tooltipContainer = "#whole-container";
        this.props.setTooltipContainer(tooltipContainer)
    }

    calcuRecommendCardLocation = (block) => {
        const { columnsName } = this.props
        // let columnsList = ["CPUUsage", "GPUUsage", "FailureRate", "value", "value1", "value2", "value3"]
        if (!block.length > 0) return
        let fields = []
        let start = block[0]["value"][0]["start"]
        let end = block[0]["value"][0]["end"]
        for (let item in block) {
            fields.push(block[item]["field"])
        }
        if (fields.length > 1) {
            return { left: this.scale(start) + 30, top: 15, width: this.scale(end) - this.scale(start), height: this.oneYLength * fields.length - 30 }
        } else {
            let position = columnsName.indexOf(fields[0])
            return { left: this.scale(start) + 30, top: 15 + position * this.oneYLength, width: this.scale(end) - this.scale(start), height: this.oneYLength - 30 }
        }
    }
    calcuUnderCardDivLocation = () => {
        const { columnsName } = this.props
        const { configureInsightColumns, configureInsightTime } = this.props
        // let columnsList = ["CPUUsage", "GPUUsage", "FailureRate", "value", "value1", "value2", "value3"]
        let fields = []
        if (configureInsightColumns[0] === 'selectAll' || configureInsightColumns.length > 1) {
            fields = _.cloneDeep(columnsName)
        }
        else {
            fields.push(configureInsightColumns[0])
        }
        let start = configureInsightTime[0]
        let end = configureInsightTime[1]

        if (!end) return { width: 0, height: 0, left: 0, top: 0 }
        if (fields.length > 1) {
            return { left: this.scale(start) + 30, top: 15, width: this.scale(end) - this.scale(start), height: this.oneYLength * fields.length - 30 }
        } else {
            let position = columnsName.indexOf(fields[0])
            return { left: this.scale(start) + 30, top: 15 + position * this.oneYLength, width: this.scale(end) - this.scale(start), height: this.oneYLength - 30 }
        }
    }
    clickBlock = () => {
        this.props.setPopInsightCardState(true)
        this.findInsightsOfUnderCard()
    }
    findInsightsOfUnderCard = () => {
        const { sequence, segmentInsightsStorage, selectedRecommendCardIndex, selectedCardIndex } = this.props
        this.props.setCurrentPopInsights([])
        if (selectedRecommendCardIndex === -1) {
            let block = sequence[selectedCardIndex].oriBlock
            let field = []
            let location = [block[0].value[0].start, block[0].value[0].end]
            for (let item in block) {
                field.push(block[item].field)
            }
            // set current segment's pop insights
            //TODO:之后可以改成访问API获取pop insight，而不是查表
            let fieldStr = field.sort().toString()
            let locationStr = location.sort().toString()
            let segmentKey = fieldStr + '-' + locationStr
            if (segmentInsightsStorage.hasOwnProperty(segmentKey)) {
                this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            }
        } else {
            let block = sequence[selectedCardIndex]["recommendList"][selectedRecommendCardIndex].block
            let field = []
            let location = [block[0].value[0].start, block[0].value[0].end]
            for (let item in block) {
                field.push(block[item].field)
            }
            let fieldStr = field.sort().toString()
            let locationStr = location.sort().toString()
            let segmentKey = fieldStr + '-' + locationStr
            if (segmentInsightsStorage.hasOwnProperty(segmentKey)) {
                this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            }
        }
    }
    render() {
        const { sequence, selectedCardIndex, rightBtnState, selectedRecommendCardIndex, intl, isPopInsightCard, currentPopInsightList } = this.props;
        const { mainChart, newChart } = this.state
        // let chartSpec=_.cloneDeep(mainChart)
        // console.log(chartSpec)
        let divLocation = {}

        // style={{top:`${}`,left:`${drawScale(30)}`}}
        if (selectedRecommendCardIndex !== -1 && sequence[selectedCardIndex]["recommendList"].length > 0) {
            // timeSeriesSpec.chart.id='origin-recommend'
            let timeBlock = sequence[selectedCardIndex]["recommendList"][selectedRecommendCardIndex].block
            divLocation = this.calcuRecommendCardLocation(timeBlock)
            // timeSeriesSpec.fact.focus=timeBlock
        } else if (selectedRecommendCardIndex === -1) {
            //此时显示下方卡片中的数据在原始序列中的位置
            // timeSeriesSpec.chart.id='origin-sequence'
            divLocation = this.calcuUnderCardDivLocation()
            // timeSeriesSpec.fact.focus=this.jointToBlock()
        }
        return (
            <div style={{ height: "100%", width: "100%" }}>
                <DndProvider backend={HTML5Backend} options={{ enableMouseEvents: true }}>
                    <div className='time-analysis-page'>
                        <div className='time-analysis-middle' >
                            <div className='csv-information'>
                                <FileInformationView {...this.props} />
                                <HeaderOperatorView {...this.props} />
                            </div>
                            <div className='time-analysis-wrapper'>
                                <div className='show-model-selection'>
                                    <VisOptionView {...this.props} />
                                </div>
                                <div className='time-seires-view' id='time-seires-view' onScroll={(e) => { console.log(document.getElementById('time-seires-view').scrollLeft) }}>
                                    <div style={{ width: '100%' }} className='time-seires-view-wapper'>
                                        <div className='time-seires-view-div' id="time-seires-view-div" ref={(node) => this.visNode = node} >
                                            <div
                                                onClick={this.clickBlock}
                                                className='focus-block'

                                                style={rightBtnState === "Start" ? null : {
                                                    left: `${divLocation.left ? divLocation.left + 1 : 0}px`,
                                                    top: `${divLocation.top ? divLocation.top + 1 : 0}px`,
                                                    width: `${divLocation.width ? divLocation.width : 0}px`,
                                                    height: `${divLocation.height ? divLocation.height + 2 : 0}px`,
                                                }}>
                                            </div>
                                            {Object.keys(mainChart).length === 0 ? null : <Chart spec={mainChart} />}
                                            <PopInsightCard intl={intl} />
                                        </div>
                                    </div>
                                </div>
                                <div className='time-sequence-view' style={{ display: 'block', height: "205px" }}>
                                    {rightBtnState === "Start" ? null : <SequenceView />}
                                </div>
                            </div>
                        </div>
                        <div className='time-analysis-right'>
                            <SeriesInsightsEditor {...this.props} />
                        </div>
                    </div>
                </DndProvider >
            </div>

        )
    }
}
