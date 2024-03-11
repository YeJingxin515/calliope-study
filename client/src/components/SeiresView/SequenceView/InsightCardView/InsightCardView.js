import React, { Component } from 'react'
import './InsightCardView.less'
import { CloseOutlined } from '@ant-design/icons'
import Chart from '../../../../insight_charts/Chart';
import _, { forEach } from 'lodash';
import { originChartSize } from '../../../../constant/ChartSize';
import { genFactSentence } from '../../../../insight_charts/caption';
import { hightlightItem } from './helper';
import { findInsight, generateRecommendList } from '../../../../axios';
import * as d3 from 'd3';
import { Tooltip, message } from 'antd';


export default class InsightCardView extends Component {
    constructor(props) {
        super(props);
        this.scriptRef = React.createRef();
        this.state = {
            fact: this.props.insightFact,
            sentence: "",
            requestRecommend: false,
            isRequest: false,
            isRequestInisght: false
        }
    }

    componentDidMount() {
        const { insightSpec, factType, index, sequence, currentLocale, captionId, timeValue } = this.props
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 160 / originChartSize[chartType].width
                let y = 100 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }

        //generate ori caption
        if (insightSpec !== "empty" && insightSpec !== undefined) {
            let caption = genFactSentence(insightSpec.fact, sequence[index].oriBlock, factType, currentLocale, captionId, timeValue, sequence[index].action)
            this.parseCaptionStyle(insightSpec.fact, caption, timeValue)
        }

        //------------计算滚动条的位置所需要的------------
        //设置比例尺
        //1900是画布的宽度
        const { dataRange, columnsName, chartScale, chartMargin } = this.props
        let chartWidth = Math.max(dataRange[1] * 2, 1000)

        this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
        //计算每列的高度(参照origin.js中oneYLength的计算法则)
        this.oneYLength = (120 * columnsName.length - 20) / columnsName.length


    }
    componentDidUpdate() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 160 / originChartSize[chartType].width
                let y = 100 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
    calcuRecommendScrollLocation = (index) => {

        const { columnsName, sequence } = this.props
        if (sequence[index]["spec"] === "empty") return
        let block = sequence[index]["oriBlock"]
        let fields = []
        let start = block[0].value[0].start
        let end = block[0].value[0].end

        for (let item in block) {
            fields.push(block[item].field)
        }
        //fields只分两种:全部和单个

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
        boxWrapper.scrollLeft = divLeft + divWidth / 2 - w / 2;
    }
    deleteInsight = (e, index) => {
        //仅剩一张时，不允许删除
        if (this.props.sequence.length === 1) return

        this.props.removeCard(index);
        //防止触发外部的点击事件
        e.stopPropagation();
        setTimeout(() => {
            //通知父组件，整个sequence list，告知当前删除的是哪一个card
            this.props.deleteSequenceCard(index);
        }, 100)

    }


    shouldComponentUpdate(nextProps) {
        const { insightSpec, isSelected } = this.props
        if (isSelected !== nextProps.isSelected) return true
        let nextFact = nextProps.insightSpec["fact"];
        return !_.isEqual(insightSpec["fact"], nextFact);
    }
    endEditing = () => {
        let script = this.scriptRef.current.innerText;
        this.changeCardIndexAndConfigure()

    }
    clickInsight = () => {
        this.changeCardIndexAndConfigure()
        this.findRecommendList()
        // setTimeout(()=>{this.findRecommendList()},500)

        // this.props.setSelectedCardIndex(this.props.index)
        // this.props.setConfigureInsightColumns(this.props.selectedCardColumns)
    }

    findRecommendList = () => {
        const { isRequest } = this.state
        //当前index不为0，当前的推荐列表为空时才需要找
        const { index, sequence, currentPopInsightList, selectedCardIndex } = this.props
        //防止多次点击，多次请求
        if (isRequest) {
            // message.warning({ content: 'Requesting, please wait!', duration: 1, style: { marginTop: '35vh' } })
            return
        }

        const { timeColumnName, file_url, task } = this.props
        if (index !== 0 && sequence[index]["recommendList"] !== undefined && sequence[index]["recommendList"].length === 0) {
            if (sequence[index - 1].spec === "empty") return
            //传递前面所有信息
            let previous = []
            for (let i = 0; i < index; i++) {
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
            if (sequence[index].spec !== "empty") {
                let fields = []
                for (let i = 0; i < sequence[index]["oriBlock"].length; i++) {
                    fields.push(sequence[index]["oriBlock"][i].field)
                }
                let start_end = sequence[index]["oriBlock"][0]["value"][0]
                if (sequence[index].type === "similarity" || sequence[index].type === "seasonality" || sequence[index].type === "frequent_pattern") {
                    start_end = sequence[index].spec.fact.focus[0].scope
                }
                current["location"] = [start_end.start, start_end.end]
                current["chosen_insight"] = sequence[index]["type"]
                current["fields"] = fields
            }
            this.setState({ isRequest: true })
            generateRecommendList(file_url, timeColumnName, task, previous, current).then(response => {
                this.props.addRecommendList(index, response.data.recommendList)
                this.setState({ isRequest: false })

            }).catch(error => {
                console.log('失败', error)
                this.setState({ isRequest: false })
                message.error({ content: 'Sorry, no recommendations found!', duration: 1, style: { marginTop: '35vh' } })
            })

        }
    }

    findInsightsOfUnderCard = (index) => {
        const { isRequestInisght } = this.state
        const { sequence, file_url, timeColumnName, segmentInsightsStorage } = this.props

        if (isRequestInisght) return
        let block = sequence[index].oriBlock
        let field = []
        let location = [block[0].value[0].start, block[0].value[0].end]
        console.log(sequence[index])
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

                //判断是否有当前这张卡片的内容
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
            // this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
            //throught key value set current pop insights
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
    changeCardIndexAndConfigure = () => {
        const { index, dataRange, sequence } = this.props
        this.props.setSelectedCardIndex(index)
        if (sequence[index]["spec"] !== "empty") {
            this.findInsightsOfUnderCard(index)
        }
        this.calcuRecommendScrollLocation(index)

    }
    parseCaptionStyle(fact, caption, data) {
        const { factType, index, sequence, currentLocale } = this.props
        if (!this.scriptContent) {
            return
        }
        if (data === undefined) {
            return
        }
        let newScrpit = ''
        let timeStr = ''
        let blockValue = sequence[index]["oriBlock"][0]["value"][0]
        if (factType === "similarity" || factType === "frequent_pattern" || factType === "seasonality") {
            timeStr = data[blockValue.start] + `${currentLocale === "en-US" ? ' and ' : '到'}` + data[blockValue.end]
        } else {
            //TODO:如果子空间不为空，如果子空间为空则是整个区间范围
            if (fact.subspace.length > 0) {
                timeStr = data[fact.subspace[0]] + `${currentLocale === "en-US" ? ' and ' : '到'}` + data[fact.subspace[1]]
            } else {
                timeStr = data[0] + `${currentLocale === "en-US" ? ' and ' : '到'}` + data[data.length - 1]
            }
        }
        if (caption.indexOf('timeline-highlight') === -1) {
            newScrpit = hightlightItem(caption, timeStr)
            newScrpit = hightlightItem(newScrpit, timeStr.replace('and', 'to'))
        }
        this.scriptContent.innerHTML = newScrpit
        // return newScrpit
    }
    parseCaptionStyleToEmpty = () => {
        if (!this.scriptContent) {
            return
        }
        this.scriptContent.innerHTML = ""
    }
    render() {
        const { insightSpec, factType, index, isSelected, currentLocale, captionId, timeValue, sequence } = this.props
        let caption = ''
        if (insightSpec !== "empty" && insightSpec !== undefined) {
            caption = genFactSentence(insightSpec.fact, sequence[index].oriBlock, factType, currentLocale, captionId, timeValue, sequence[index].action)
            insightSpec.chart.id = 'senquence-' + index.toString()
            insightSpec.chart.width = originChartSize[factType].width
            insightSpec.chart.height = originChartSize[factType].height
            insightSpec.chart.showTooltip = false
        }
        return (
            <div
                className='insight-card'
                onClick={this.clickInsight}
                style={{
                    position: "relative",
                    zIndex: 0,
                    boxShadow: isSelected ? "rgb(244, 158, 40) 0px 0px 0px 3px" : "rgb(0, 0 ,0) 0px 0px 0px 0px"
                }}>
                <CloseOutlined
                    style={{ fontSize: '14px' }}
                    className='close-icon'
                    onClick={(e) => this.deleteInsight(e, index)}
                />
                <div
                    className="insight-preview"
                    ref={(node) => this.visNode = node}
                    style={(factType === "multivariate_outlier") ? { overflowY: 'scroll', overflowX: 'hidden' } : null}
                >
                    {insightSpec === "empty" ? null : <Chart spec={insightSpec} />}
                </div>
                <Tooltip title={caption} style={{ wordBreak: 'break-all' }}>
                    <div
                        style={{ zIndex: 10 }}
                        ref={(current) => this.scriptContent = current}
                        className="script-preview"
                        // contentEditable={isSelected}
                        suppressContentEditableWarning={true}
                    // onBlur={this.endEditing}
                    >
                        {(insightSpec !== "empty" && insightSpec !== undefined) ? this.parseCaptionStyle(insightSpec.fact, caption, timeValue) : this.parseCaptionStyleToEmpty()}
                    </div>
                </Tooltip>
            </div >
        )
    }
}
