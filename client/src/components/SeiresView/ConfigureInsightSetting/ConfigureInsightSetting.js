import React, { Component } from 'react'
import { Collapse, Select, Row, Col, } from 'antd';
import './ConfigureInsightSetting.less'
import TimeRange from "../SeriesInsightsEditor/Settings/TimeRange/TimeRange"
import _, { findLastKey } from 'lodash';
import { generateRecommendList } from '../../../axios';
import { message } from 'antd';
import { generateSingleInsight, generateSubsequent, findInsight } from '../../../axios';
import * as d3 from 'd3';
import InsightTypeTrans from '../../../constant/InsightTypeTrans';
import ConfigureInsightTypeOptions from '../../../constant/ConfigureInsightTypeOptions';
const { Panel } = Collapse;
const { Option } = Select;

let univariate_type = ["trend", "frequent pattern", "univariate distribution", "univariate outlier", "seasonality", "outstanding", "autocorrelation"]
let multivariable_type = ["multivariate distribution", "multivariate outlier", "similarity"]
// let insightTypeList = ["trend", "frequent_pattern", "univariate_distribution", "univariate_outlier", "seasonality", "forecasting",
//     "multivariate_distribution", "multivariate_outlier", "clustering", "similarity"]
let insightTypeList = ["trend", "frequent_pattern", "univariate_distribution", "univariate_outlier", "seasonality",
    "multivariate_distribution", "multivariate_outlier", "similarity", "outstanding", "autocorrelation"]
// let columnList=["selectAll","CPUUsage","GPUUsage","FailureRate","value","value1","value2","value3"]
export default class ConfigureInsightSetting extends Component {
    constructor(props) {
        super(props)
        let columns = this.props.columnsName.slice()
        columns.unshift("selectAll")
        this.state = {
            selectValue: "",
            columnList: columns,
            onlyColumns: this.props.columnsName.slice(),
            requestRecommend: false,
            isRequest: false,
            isRequestInisght: false
        }
        this.changeTime = this.changeTime.bind(this)
    }
    componentDidMount() {
        //------------计算滚动条的位置所需要的------------
        //设置比例尺
        //1900是画布的宽度
        const { dataRange, columnsName, chartScale, chartMargin } = this.props
        let chartWidth = Math.max(dataRange[1] * 2, 1000)

        this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
        //计算每列的高度(参照origin.js中oneYLength的计算法则)
        this.oneYLength = (120 * columnsName.length - 20) / columnsName.length
    }
    changeType = (value) => {
        this.props.setConfigureInsightType(value)
    }
    changeColumns = (value) => {
        const { columnList, onlyColumns } = this.state
        let selected = value[value.length - 1]
        if (selected === "selectAll") {
            this.props.setConfigureInsightColumns(onlyColumns)
            setTimeout(() => {
                this.calcuScrollLocation(onlyColumns)
            }, 200)
        } else {
            this.props.setConfigureInsightColumns(value)
            setTimeout(() => {
                this.calcuScrollLocation(value)
            }, 200)
        }
    }
    changeBreakdown = (breakdown) => {
        this.props.setConfigureInsightBreakdown(breakdown)
    }
    calcuScrollLocation = (fields) => {

        const { columnsName, configureInsightTime } = this.props

        //fields只分两种:全部和单个

        let position = columnsName.indexOf(fields[Math.floor(fields.length / 2)])
        let divLeft = this.scale(configureInsightTime[0]) + 30
        let divWidth = this.scale(configureInsightTime[1]) - this.scale(configureInsightTime[0])
        let divTop = 15 + position * this.oneYLength
        let divHeight = this.oneYLength * fields.length - 30
        let boxWrapper = document.getElementById('time-seires-view')

        let heightPx = window.getComputedStyle(boxWrapper, null).getPropertyValue('height')
        let h = parseFloat(heightPx.substring(0, heightPx.length - 2))
        let widthPx = window.getComputedStyle(boxWrapper, null).getPropertyValue('width')
        let w = parseFloat(widthPx.substring(0, widthPx.length - 2))


        boxWrapper.scrollTop = divTop + divHeight / 2 - h / 2;
        boxWrapper.scrollLeft = divLeft + divWidth / 2 - w / 2;
    }

    changeTime = (value) => {
        this.props.setConfigureInsightTime(value[0], value[1])
    }
    findInsightsOfUnderCard = (index) => {
        const { isRequestInisght } = this.state
        const { sequence, file_url, timeColumnName, segmentInsightsStorage } = this.props

        if (isRequestInisght) return
        let block = sequence[index].oriBlock
        let field = []
        let location = [block[0].value[0].start, block[0].value[0].end]
        if (sequence[index].type === "similarity" || sequence[index].type === "seasonality" || sequence[index].type === "frequent_pattern") {
            location = sequence[index].spec.fact.focus[0].scope
        }
        for (let item in block) {
            field.push(block[item].field)
        }
        // set current segment's pop insights
        //TODO:之后可以改成访问API获取pop insight，而不是查表
        let fieldStr = field.sort().toString()
        let locationStr = location.sort().toString()
        let segmentKey = fieldStr + '-' + locationStr
        this.props.setCurrentPopInsights([])

        if (!segmentInsightsStorage.hasOwnProperty(segmentKey)) {
            this.setState({ isRequestInisght: true })
            //请求api,response成功后再set current pop insights
            findInsight(file_url, field, timeColumnName, location).then(response => {
                // message.destroy()
                // message.success({content:'Generate success!',duration:1,style:{ marginTop: '35vh'}})
                this.setState({ isRequestInisght: false })
                // this.props.addPopInsights(segmentKey, response.data.insights)
                let pop_insights = []
                let insight_type = []
                for (let item in response.data.insights) {
                    insight_type.push(response.data.insights[item].type)
                }
                if (!insight_type.includes(sequence[index].type)) {
                    pop_insights = [{ "spec": sequence[index].spec, "type": sequence[index].type, "action": sequence[index].hasOwnProperty("action") ? sequence[index].action : -1 }].concat(response.data.insights)
                    this.props.setCurrentPopInsights(pop_insights)
                } else {
                    pop_insights = response.data.insights
                    this.props.setCurrentPopInsights(pop_insights)
                }
                this.props.addPopInsights(segmentKey, pop_insights)
                // this.props.setCurrentPopInsights(response.data.insights)
                // setTimeout(()=>{this.findRecommendList()},500)
                // this.props.setSequence(response.data)
                // this.props.changeBtnState("Back")

            }).catch(error => {
                console.log('失败', error)
                this.setState({ isRequestInisght: false })
                let pop_insights = [{
                    "spec": sequence[index].spec,
                    "type": sequence[index].type,
                    "action": sequence[index].hasOwnProperty("action") ? sequence[index].action : -1
                }]
                this.props.addPopInsights(segmentKey, pop_insights)
                this.props.setCurrentPopInsights(pop_insights)
                // message.error({ content: 'Sorry, no insights!', duration: 1, style: { marginTop: '35vh' } })
            })

        } else {
            let pop_insights = []
            let insight_type = []
            for (let item in segmentInsightsStorage[segmentKey]) {
                insight_type.push(segmentInsightsStorage[segmentKey][item].type)
            }
            if (!insight_type.includes(sequence[index].type)) {
                pop_insights = [{ "spec": sequence[index].spec, "type": sequence[index].type, "action": sequence[index].hasOwnProperty("action") ? sequence[index].action : -1 }].concat(segmentInsightsStorage[segmentKey])
                this.props.addPopInsights(segmentKey, pop_insights)
                this.props.setCurrentPopInsights(pop_insights)
            } else {
                this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            }
        }
    }
    judgeRequestRation = () => {
        const { configureInsightColumns, configureInsightTime, configureInsightType } = this.props
        //三者均要有值
        if (configureInsightColumns.length === 0) {
            message.warning({ content: 'The columns are empty', duration: 1, style: { marginTop: '35vh' } })
            return false
        } else if (configureInsightTime[0] === configureInsightTime[1]) {
            message.warning({ content: 'The time range is empty', duration: 1, style: { marginTop: '35vh' } })
            return false
        } else if (configureInsightType === '') {
            message.warning({ content: 'Type is empty', duration: 1, style: { marginTop: '35vh' } })
            return false
        }

        //多选的column的type不能是单维度
        if (configureInsightColumns.length > 1) {
            if (univariate_type.includes(configureInsightType)) {
                message.warning({ content: 'Insight type does not match columns', duration: 1, style: { marginTop: '35vh' } })
                return false
            }
        } else {
            if (multivariable_type.includes(configureInsightType)) {
                message.warning({ content: 'Insight type does not match column', duration: 1, style: { marginTop: '35vh' } })
                return false
            }
        }
        return true
    }
    generateSingle = () => {
        if (!this.judgeRequestRation()) return
        const { isRequest } = this.state
        const { configureInsightColumns, configureInsightTime, configureInsightType, selectedCardIndex, file_url, timeColumnName, sequence } = this.props
        if (isRequest) {
            message.warning({ content: 'Requesting, please wait!', duration: 1, style: { marginTop: '35vh' } })
            return
        }
        //TODO:调用接口
        this.setState({ isRequest: true })
        message.loading({ content: 'Generating, please wait a moment', duration: 0, style: { marginTop: '35vh' } })
        generateSingleInsight(file_url, configureInsightColumns, timeColumnName, configureInsightTime, [configureInsightType.replace(" ", "_")]).then(response => {
            message.destroy()
            if (response.data.insights.length === 0) {
                this.setState({ isRequest: false })
                message.warning({ content: 'The current segment does not have this insight!', duration: 1, style: { marginTop: '35vh' } })
                return
            }
            let result = response.data.insights[0]
            // console.log(response.data.sequence)
            // this.props.setSequence(response.data.sequence)
            //取出当前的这个空白的卡片的recommededList，captionId，并且拼接oriBlock
            //TODO：如果这个卡片已经是最后一张了怎么办，它的前面没有
            //TODO:暂且先不考虑最后一张
            let captionId = Math.floor(Math.random() * 3);
            let oriBlock = []
            for (let i = 0; i < configureInsightColumns.length; i++) {
                oriBlock.push({ "field": configureInsightColumns[i], "value": [{ "start": configureInsightTime[0], "end": configureInsightTime[1] }] })
            }
            // let recommededList = sequence[selectedCardIndex].recommendList
            this.props.fixCard(selectedCardIndex, result.spec, result.type, [], oriBlock, captionId)
            //TODO:可以把它的下一张卡片的recommendList置空，这样就会点击时新生成
            if (selectedCardIndex !== sequence.length - 1) this.props.addRecommendList(selectedCardIndex + 1, [])
            //TODO：当前卡片的推荐列表感觉得接着换
            setTimeout(() => { this.findRecommendList() }, 500)
            this.findInsightsOfUnderCard(selectedCardIndex)
            this.setState({ isRequest: false })
            message.success({ content: 'Generate success!', duration: 1, style: { marginTop: '35vh' } })
            setTimeout(() => { message.destroy() }, 3000)
        }).catch(error => {
            console.log('失败', error)
            this.setState({ isRequest: false })
            message.error({ content: 'Sorry, generate current failed!', duration: 1, style: { marginTop: '35vh' } })
            setTimeout(() => { message.destroy() }, 3000)
        })
    }
    findRecommendList = () => {
        //当前index不为0，当前的推荐列表为空时才需要找
        const { selectedCardIndex, sequence, currentPopInsightList, timeColumnName, file_url, task } = this.props
        //防止多次点击，多次请求
        const { requestRecommend } = this.state
        if (selectedCardIndex !== 0 && sequence[selectedCardIndex]["recommendList"] !== undefined && sequence[selectedCardIndex]["recommendList"].length === 0 && !requestRecommend) {
            // if (sequence[selectedCardIndex - 1].spec === "empty") return
            //传递前面所有信息
            let previous = []
            for (let i = 0; i < selectedCardIndex; i++) {
                if (sequence[i].spec === "empty") {
                    continue
                }
                let fields = []
                let p = {}
                for (let j = 0; j < sequence[i]["oriBlock"].length; j++) {
                    fields.push(sequence[i]["oriBlock"][j].field)
                }
                let start_end = sequence[i]["oriBlock"][0]["value"][0]
                p["location"] = [start_end.start, start_end.end]
                p["chosen_insight"] = sequence[i]["type"]
                p["fields"] = fields
                previous.push(p)
            }

            let current = {}
            //传递当前卡片的
            if (sequence[selectedCardIndex].spec !== "empty") {
                let fields = []
                for (let i = 0; i < sequence[selectedCardIndex]["oriBlock"].length; i++) {
                    fields.push(sequence[selectedCardIndex]["oriBlock"][i].field)
                }
                let start_end = sequence[selectedCardIndex]["oriBlock"][0]["value"][0]
                current["location"] = [start_end.start, start_end.end]
                current["chosen_insight"] = sequence[selectedCardIndex]["type"]
                current["fields"] = fields
            }
            this.setState({ requestRecommend: true })

            // todo
            generateRecommendList(file_url, timeColumnName, task, previous, current).then(response => {
                this.props.addRecommendList(selectedCardIndex, response.data.recommendList)
                this.setState({ requestRecommend: false })
                this.props.setCurrentPopInsights(currentPopInsightList)
            }).catch(error => {
                console.log('失败', error)
                message.error({ content: 'Sorry, no recommendations found!', duration: 1, style: { marginTop: '35vh' } })
            })
        }
    }

    generateUpdate = () => {
        if (!this.judgeRequestRation()) return
        const { isRequest } = this.state
        const { configureInsightColumns, configureInsightTime, configureInsightType, selectedCardIndex, file_url, timeColumnName, sequence } = this.props
        if (isRequest) {
            message.warning({ content: 'Requesting, please wait!', duration: 1, style: { marginTop: '35vh' } })
            return
        }
        this.setState({ isRequest: true })
        //TODO:调用接口
        //先添加前几个的oriBlock
        let existing_insights = []
        for (let i = 0; i <= selectedCardIndex - 1; i++) {
            let temp = _.cloneDeep(sequence[i].oriBlock)
            for (let j = 0; j < temp.length; j++) {
                temp[j]["insight"] = sequence[i].type
            }
            existing_insights.push(temp)
        }
        let oriBlock = []
        //再添加当前的卡片的oriBlock
        for (let i = 0; i < configureInsightColumns.length; i++) {
            if (configureInsightColumns[i] !== "selectAll") {
                oriBlock.push({
                    "field": configureInsightColumns[i],
                    "value": [{ "start": configureInsightTime[0], "end": configureInsightTime[1] }],
                    "insight": configureInsightType.replace(" ", "_")
                })
            }
        }
        existing_insights.push(oriBlock)
        message.loading({ content: 'Generating, please wait a moment', duration: 0, style: { marginTop: '35vh' } })
        console.log("请求generateSubsequent", existing_insights)
        generateSubsequent(file_url, timeColumnName, existing_insights, this.props.task).then(response => {
            message.destroy()
            message.success({ content: 'Generate success!', duration: 1, style: { marginTop: '35vh' } })
            let result = response.data.sequence
            console.log("generateSubsequent", result)
            if (selectedCardIndex === 0) this.props.setSequence(result)
            else {
                let newSeqence = _.cloneDeep(sequence)
                let sliceSequence = newSeqence.slice(0, selectedCardIndex)
                this.props.setSequence(result)
                // this.props.setRedundantRecommend(response.data.add["recommendList"])
                //最后一个recommend list也要改变
                this.findRecommendList()
                this.findInsightsOfUnderCard(selectedCardIndex)
            }
            this.setState({ isRequest: false })
        }).catch(error => {
            console.log('失败', error)
            this.setState({ isRequest: false })
            message.error({ content: 'Sorry, generate subsequent failed!', duration: 1, style: { marginTop: '35vh' } })
            setTimeout(() => { message.destroy() }, 1000)
        })
    }

    render() {
        const { columnList, onlyColumns } = this.state
        const { task, intl, dataRange, timeValue, configureInsightColumns, configureInsightTime, configureInsightType, configureInsightBreakdown, granularityName } = this.props
        return (
            <Collapse defaultActiveKey={["insight-chart"]}>
                <Panel header={intl.get("InsightChartConfigure")} key="insight-chart" >
                    <div className='insight-configuration'>
                        <div className="config-control-detail">
                            <Row >
                                <Col span={8} >{intl.get("Range")}</Col>
                                <Col span={16}>
                                    <TimeRange
                                        timeValue={timeValue}
                                        changeTime={this.changeTime}
                                        min={dataRange[0]}
                                        max={dataRange[1]}
                                        start={configureInsightTime[0]}
                                        end={configureInsightTime[1]}
                                    />
                                </Col>
                            </Row>
                            <Row >
                                <Col span={8} >{intl.get("Column")}</Col>
                                <Col span={16}>
                                    <Select
                                        onChange={this.changeColumns}
                                        value={configureInsightColumns}
                                        defaultValue={configureInsightColumns}
                                        mode="multiple"
                                        style={{ width: "100%" }}>
                                        {columnList.map((key) => <Option key={key} value={key}>{key}</Option>)}
                                    </Select>
                                </Col>
                            </Row>
                            <Row >
                                <Col span={8} >{intl.get("type")}</Col>
                                <Col span={16}>
                                    <Select
                                        style={{ width: "100%" }}
                                        onChange={this.changeType}
                                        value={InsightTypeTrans[configureInsightType.replace(" ", "_")]}
                                        defaultValue={InsightTypeTrans[configureInsightType.replace(" ", "_")]}>
                                        {configureInsightColumns.length > 1 ? multivariable_type.map((key) => <Option key={key} value={key}>{InsightTypeTrans[key.replace(" ", "_")]}</Option>) : univariate_type.map((key) => <Option key={key} value={key}>{InsightTypeTrans[key.replace(" ", "_")]}</Option>)}
                                    </Select>
                                </Col>
                            </Row>
                            <Row >
                                <Col span={8} >{intl.get("breakdown")}</Col>
                                <Col span={16}>
                                    <Select
                                        onChange={this.changeBreakdown}
                                        value={configureInsightBreakdown}
                                        defaultValue={configureInsightBreakdown}
                                        style={{ width: "100%" }}>
                                        {granularityName.map((key) => <Option key={key} value={key}>{key}</Option>)}
                                    </Select>
                                </Col>
                            </Row>
                            <Row >
                                <Col span={12} style={{ borderRight: '1px solid white', height: '50px', lineHeight: '50px' }} onClick={this.generateSingle}>{intl.get("GenerateOnlyone")}</Col>
                                <Col span={12} style={{ borderLeft: '1px solid white', height: '50px', lineHeight: '50px', fontSize: '12px' }} onClick={this.generateUpdate}>{intl.get("GenerateAndUpdate")}</Col>
                            </Row>
                        </div>
                    </div>
                </Panel>
            </Collapse>
        )
    }
}
