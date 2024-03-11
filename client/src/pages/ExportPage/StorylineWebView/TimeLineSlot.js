import React, { Component } from 'react'
import { Textfit } from '@kyo_ago/react-textfit';
import { insightColors } from '../../../constant/RecommendedInsightColor';
import Chart from '../../../insight_charts/Chart';
import _ from 'lodash';
import { originChartSize } from '../../../constant/ChartSize';
import { genFactSentence } from '../../../insight_charts/caption';
import { hightlightItem } from '../../../components/SeiresView/SequenceView/InsightCardView/helper';
import InsightTypeTrans from '../../../constant/InsightTypeTrans';
import InsightTypeZh from '../../../constant/InsightTypeZh';
export default class TimeLineSlot extends Component {
    constructor(props) {
        super(props)
        this.styleHlight = React.createRef();
        this.desFitRef = React.createRef();
        this.textFitRef = React.createRef();
        this.headerRef = React.createRef();
        this.state = {

        }
    }
    componentDidMount() {
        const { insightSpec, captionId, timeValue, factType, currentLocale, sequence, index } = this.props

        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 150 / originChartSize[chartType].width
                let y = 120 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
        let caption = ''
        if (insightSpec !== "empty" && insightSpec !== undefined) {
            caption = genFactSentence(insightSpec.fact, sequence[index].oriBlock, factType, currentLocale, captionId, timeValue, sequence[index].action)
        } else return
        this.parseCaptionStyle(insightSpec.fact, caption, timeValue)
    }
    componentWillUnmount() {
    }
    componentDidUpdate() {
        if (this.visNode) {
            let vis = this.visNode.children[0];
            if (vis) {
                let chartType = this.props.factType
                let x = 150 / originChartSize[chartType].width
                let y = 120 / originChartSize[chartType].height
                vis.style.transform = `scaleX(${x})scaleY(${y})`;
            }
        }
    }
    computeDes() {
        let styles = {};
        styles['width'] = '100%';
        styles['height'] = 'fit-content';
        styles['textOverflow'] = 'ellipsis'
        styles['display'] = '-webkit-box'
        styles['WebkitBoxOrient'] = 'vertical'
        styles['WebkitLineClamp'] = '2'
        styles['overflow'] = 'hidden'
        styles['lineHeight'] = '18px'
        return styles
    }
    computeDesScripts() {
        let styles = {};
        styles['width'] = '100%';
        styles['height'] = '75px';
        styles['textOverflow'] = 'ellipsis'
        styles['display'] = '-webkit-box'
        styles['WebkitBoxOrient'] = 'vertical'
        styles['WebkitLineClamp'] = '5'
        styles['overflowY'] = 'scroll'
        styles['wordBreak'] = 'break-all';
        return styles
    }

    parseScript() {

        if (!this.desFitRef) {
            return
        }
        if (this.desFitRef._child.offsetHeight >= 75) {
            this.desFitRef._child.style['font-size'] = '10px';
            this.desFitRef._child.style['transform-origin'] = "top left";
            this.desFitRef._child.style['line-height'] = 1.1
        } else {
            // console.log(this.desFitRef)
            this.desFitRef._child.style.transform = 'scale(1)';
            this.desFitRef._child.style['font-size'] = '10px';
            this.desFitRef._child.style['transform-origin'] = "top left";
            this.desFitRef._child.style['line-height'] = 1.1
        }
        // this.desFitRef._child.innerHTML = hightlight(events[i].fact)
        this.desFitRef._child.contentEditable = false
        this.desFitRef._child.spellCheck = false
    }


    titleFitReady() {
        // // console.log('title',i, this.textFitRef, this.state.subtitle, events[i].fact.generatedSubtitle)
        // if (!this.textFitRef) {
        //     return
        // }
        // let padTop = (50 - this.textFitRef._child.offsetHeight) / 2 >= 0 ?(40 - this.textFitRef._child.offsetHeight) / 2  : 0 
        // padTop = this.textFitRef.props.children==='    ' ? 3:padTop
        // this.headerRef.style['padding-top'] = padTop + 'px'
        // this.textFitRef._child.contentEditable=this.props.forPublish? false: events[i].fact.aggregated && events[i].fact.aggregatedFact ? false : true
        // this.textFitRef._child.spellCheck=false
        // this.textFitRef._child.suppressContentEditableWarning= true
        // //this.textFitRef._child.contentEditable = false //设置不能编辑
    }
    parseCaptionStyleToEmpty = () => {
        if (!this.styleHlight) {
            return
        }
        this.styleHlight.innerHTML = ""
    }
    parseCaptionStyle(fact, caption, data) {
        const { sequence, factType, index, currentLocale } = this.props
        if (!this.desFitRef._child) {
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
        this.desFitRef._child.innerHTML = newScrpit
        // return newScrpit
    }

    render() {
        const { sequence, timeValue, font_min_size, insightSpec, captionId, factType, index, currentLocale } = this.props
        let exportSpec = insightSpec

        let caption = ''
        if (insightSpec !== "empty" && insightSpec !== undefined) {
            caption = genFactSentence(insightSpec.fact, sequence[index].oriBlock, factType, currentLocale, captionId, timeValue, sequence[index].action)
            exportSpec.chart.id = 'export-' + index.toString() + '-' + factType
            exportSpec.chart.width = originChartSize[factType].width
            exportSpec.chart.height = originChartSize[factType].height
            exportSpec.chart.showTooltip = false
        }
        return (
            <div className='onetime' style={{ display: 'flex', flexDirection: 'column', height: '250px', outline: '3px solid' + insightColors[InsightTypeTrans[factType].toLowerCase()], outlineOffset: '-3px' }}>
                <div className='vis' ref={(node) => this.visNode = node} style={{ overflow: 'hidden' }}>
                    {insightSpec === "empty" ? null : <Chart spec={exportSpec} />}
                </div>
                <div className='des tl-edit' spellCheck="false"
                    style={{
                        lineHeight: 1.5
                    }}
                    ref={this.styleHlight}>
                    {/* {(insightSpec !== "empty"&&insightSpec!==undefined) ?this.parseCaptionStyle(insightSpec.fact,caption,timeValue): this.parseCaptionStyleToEmpty()} */}

                    <Textfit
                        key={insightSpec}
                        ref={el => this.desFitRef = el}
                        mode="multi"
                        max={14}
                        style={this.computeDesScripts()}
                        onReady={() => this.parseScript()}>
                        {/* {(insightSpec !== "empty"&&insightSpec!==undefined) ?this.parseCaptionStyle(insightSpec.fact,caption,timeValue): this.parseCaptionStyleToEmpty()} */}
                        {/* {genFactSentence(insightSpec.fact,factType,currentLocale,captionId,timeValue)} */}
                    </Textfit>
                </div>
                <div className='header_type tl-edit' ref={el => this.headerRef = el} style={{ paddingTop: 0 }}>
                    <Textfit
                        ref={el => this.textFitRef = el}
                        className="text"
                        mode="multi"
                        max={30}
                        min={font_min_size}
                        style={this.computeDes}
                        onReady={() => this.titleFitReady()}>
                        {currentLocale === "en-US" ? InsightTypeTrans[factType] : InsightTypeZh[factType]}
                    </Textfit>
                </div>
            </div>
        )
    }
}
