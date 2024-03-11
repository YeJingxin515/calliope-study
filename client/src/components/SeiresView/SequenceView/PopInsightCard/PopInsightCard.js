import React, { Component } from 'react'
import { Modal, Tabs } from 'antd';
import Draggable from 'react-draggable';
import './PopInsightCard.less'
import { PlusCircleOutlined } from '@ant-design/icons';
import PopInsightCardContent from './PopInsightCardContent';
import _ from 'lodash'
import { findInsight } from '../../../../axios';
import { message ,Spin } from 'antd';
import InsightTypeTrans from '../../../../constant/InsightTypeTrans';
const { TabPane } = Tabs;

const insights_list = ["trend", "univariate_distribution", "seasonality"]

export default class PopInsightCard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tabKey: "0",
            disabled: true,
            bounds: { left: 0, top: 0, bottom: 0, right: 0 },
        }
        this.draggleRef = React.createRef();

    }
    shouldComponentUpdate(nextProps) {
        const { currentPopInsightList } = this.props
        if (!_.isEqual(currentPopInsightList, nextProps.currentPopInsightList)) this.clearTooltip()
        return true
    }
    componentWillUnmount(){
        
    }
    onCancel = () => {
        if (this.props.isPopInsightCard) {
            this.props.setPopInsightCardState(false)
        }
        let block = document.getElementsByClassName("insight-block");
        for (let i = 0; i < block.length; i++) {
            block[i].setAttribute("class", "insight-block false")
        }
        this.setState({
            tabKey: "0",
            getCurrentPopinsight: false
        })
        // this.clearTooltip()
        // this.props.setCurrentPopInsights([])
        this.props.setCurrentPopInsights([])
        //clear hover-tooltip
        // this.clearTooltip()
    }
    clearTooltip = () => {
        let parentContainer = document.querySelectorAll("#whole-container")[0]
        if (parentContainer) {
            let willDeleted = parentContainer.querySelectorAll("#hover-tooltip");
            let willDeletedValue = parentContainer.querySelectorAll("#value-tooltip")
            for (let i = 0; i < willDeleted.length; i++) {
                parentContainer.removeChild(willDeleted[i])
            }
            for (let i = 0; i < willDeletedValue.length; i++) {
                parentContainer.removeChild(willDeletedValue[i])
            }
        }
    }
    addInsightToSequence = e => {
        const { tabKey } = this.state
        const { currentPopInsightList, selectedRecommendCardIndex, sequence, selectedCardIndex } = this.props
        //TODO:如果type不相等的话

        let sequenceInsightSpec = sequence[selectedCardIndex].spec
        let willAddInsight = currentPopInsightList[parseInt(tabKey)]
        if (sequenceInsightSpec !== "empty") {
            // console.log(sequenceInsightSpec.chart.type, willAddInsight.spec.chart.type,_.isEqual(sequenceInsightSpec.chart.type, willAddInsight.spec.chart.type))
            // console.log(sequenceInsightSpec.data.schema.sort(), willAddInsight.spec.data.schema.sort(),_.isEqual(sequenceInsightSpec.data.schema.sort(), willAddInsight.spec.data.schema.sort()))
            // console.log(sequenceInsightSpec.fact.subspace.sort(), willAddInsight.spec.fact.subspace.sort(),_.isEqual(sequenceInsightSpec.fact.subspace.sort(), willAddInsight.spec.fact.subspace.sort()))
            if (_.isEqual(sequenceInsightSpec.chart.type, willAddInsight.spec.chart.type)
                && _.isEqual(sequenceInsightSpec.fact.subspace.sort(), willAddInsight.spec.fact.subspace.sort())
                // && _.isEqual(sequenceInsightSpec.data.schema.sort(), willAddInsight.spec.data.schema.sort())
                ) {
                message.warning({ content: 'Now insight is equal to the one you want add!', duration: 1, style: { marginTop: '35vh' } })
            }
            else {
                //要看现在的是recommendedList的segment还是卡片的
                if(selectedRecommendCardIndex===-1){
                    //获取之前再这个位置上的卡片的recommend List
                    let recommededList = sequence[selectedCardIndex].recommendList
                    let oriBlock = sequence[selectedCardIndex].oriBlock
                    let captionId = sequence[selectedCardIndex].captionId
                    this.props.fixCard(selectedCardIndex, willAddInsight.spec, willAddInsight.type, recommededList, oriBlock, captionId)
                    message.success({ content: 'Add success!', duration: 1, style: { marginTop: '35vh' } })
                    setTimeout(() => {
                        this.props.setSelectedCardIndex(selectedCardIndex)
                    }, 200)
                }else{
                    //获取之前再这个位置上的卡片的recommend List
                    let recommededList = sequence[selectedCardIndex].recommendList
                    let oriBlock = recommededList[selectedRecommendCardIndex].block
                    let captionId = recommededList[selectedRecommendCardIndex].captionId
                    this.props.fixCard(selectedCardIndex, willAddInsight.spec, willAddInsight.type, recommededList, oriBlock, captionId)
                    message.success({ content: 'Add success!', duration: 1, style: { marginTop: '35vh' } })
                    setTimeout(() => {
                        this.props.setSelectedCardIndex(selectedCardIndex)
                    }, 200)
                }
                
            }
        } else {
            //空白卡片一定是recommendList的内容
            //获取之前再这个位置上的卡片的recommend List
            let recommededList = sequence[selectedCardIndex].recommendList
            let oriBlock = recommededList[selectedRecommendCardIndex].block
            let captionId = recommededList[selectedRecommendCardIndex].captionId
            this.props.fixCard(selectedCardIndex, willAddInsight.spec, willAddInsight.type, recommededList, oriBlock, captionId)
            message.success({ content: 'Add success!', duration: 1, style: { marginTop: '35vh' } })
            setTimeout(() => {
                this.props.setSelectedCardIndex(selectedCardIndex)
            }, 200)
        }
    };
    onStart = (event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = this.draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        this.setState({
            bounds: {
                left: -targetRect.left + uiData.x,
                right: clientWidth - (targetRect.right - uiData.x),
                top: -targetRect.top + uiData.y,
                bottom: clientHeight - (targetRect.bottom - uiData.y),
            },
        });
    };

    setActiveKey = (key) => {
        this.setState({
            tabKey: key,
            getCurrentPopinsight: true
        })
    }

    setCurrentPopContent = () => {
        const { sequence, selectedCardIndex, selectedRecommendCardIndex } = this.props
        const { configureInsightColumns, configureInsightTime, timeColumnName, file_url } = this.props
        // this.setState({
        //     getCurrentPopinsight:true
        // })
        //拼接
        let fields = []
        let location = []
        let time_field = timeColumnName
        let file_path = file_url
        if (selectedRecommendCardIndex !== -1 && sequence[selectedCardIndex]["recommendList"].length > 0) {
            let timeBlock = sequence[selectedCardIndex]["recommendList"][selectedRecommendCardIndex].block
            if (timeBlock.length > 0) {
                for (let i = 0; i < timeBlock.length; i++) {
                    fields.push(timeBlock[i].field)
                }
                location = [timeBlock[0].value[0].start, timeBlock[0].value[0].end]
            }
        } else if (selectedRecommendCardIndex === -1) {
            fields = configureInsightColumns;
            location = configureInsightTime
            // let timeBlock=sequence[selectedCardIndex].oriBlock
            // timeSeriesSpec.fact.focus=timeBlock
        }
        findInsight(file_path, fields, time_field, location).then(response => {
            // message.destroy()
            // message.success({content:'Generate success!',duration:1,style:{ marginTop: '35vh'}})
            this.props.setCurrentPopInsights(response.data.insights)
            // this.props.setSequence(response.data)
            // this.props.changeBtnState("Back")

        }).catch(error => {
            console.log('失败', error)
        })
        //请求，
    }

    render() {
        const { bounds, disabled, tabKey } = this.state;
        const { intl, currentPopInsightList, isPopInsightCard } = this.props

        return (
            <Modal
                wrapClassName="pop-insights-card"
                title={<div
                    style={{ width: '100%', cursor: 'move'}}
                    onMouseOver={() => { if (disabled) { this.setState({ disabled: false }); } }}
                    onMouseOut={() => { this.setState({ disabled: true }); }}
                    onFocus={() => { }}
                    onBlur={() => { }}>
                    Insight
                </div>}
                // visible={isPopInsightCard}
                //TODO:
                visible={isPopInsightCard}
            
                style={{textAlign:'center',justifyContent:'center',alignItems:'center',display:'flex'}}
                onCancel={this.onCancel}
                footer={
                    <div className='pop-card-footer'>
                        <div className='card-footer-btn' onClick={this.addInsightToSequence} >
                            <div className='footer-btn-icon'>
                                <PlusCircleOutlined />
                            </div>
                            <div className='footer-btn-text'>{intl.get("AddToAnalysisFlow")}</div>
                        </div>
                    </div>
                }
                modalRender={modal => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        onStart={(event, uiData) => this.onStart(event, uiData)}>
                        <div ref={this.draggleRef}>{modal}</div>
                    </Draggable>
                )}>
                    
                {!isPopInsightCard&&currentPopInsightList!==undefined ? null :currentPopInsightList.length===0?<Spin wrapperClassName="pop-spin"/>:
                    (<Tabs defaultActiveKey="0" onChange={this.setActiveKey} activeKey={tabKey}>
                        {currentPopInsightList===undefined?null:currentPopInsightList.map((insight, index) => {
                            return (
                                
                                <TabPane tab={InsightTypeTrans[insight.type]} key={index.toString()} style={{ position: 'relative' }}>
                                    <PopInsightCardContent
                                        insightSpec={insight.spec}
                                        factType={insight.type}
                                        index={index}
                                        currentPopInsightList={currentPopInsightList}
                                    />
                                </TabPane>
                            )
                        })}
                    </Tabs>)
                }
            </Modal>
        )
    }
}