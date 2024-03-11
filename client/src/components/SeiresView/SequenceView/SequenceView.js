import React, { Component } from 'react'
import './SequenceView.less'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { DropTarget } from 'react-dnd'
import InsightCardView from './InsightCardView'
import { findInsight, generateRecommendList } from '../../../axios'
import * as d3 from 'd3';
import StaticPopInsights from '../../../constant/StaticPopInsights'

const Types = {
    CARD: 'card'
}

const cardDropTarget = {
    hover(props, monitor, component) {
        let pos = monitor.getClientOffset();
    },

    drop(props, monitor, component) {
        if (monitor.didDrop()) {
            return
        }
        component.props.setHoverIndex(-1);
        let pos = monitor.getClientOffset();
        return pos;
    }
}
const getListStyle = isDraggingOver => ({
    // background: isDraggingOver ? 'lightblue' : 'lightgrey',
    display: 'flex',
    overflowX: 'scroll',
    overflowY: 'hidden'
});
function collect(connect, monitor) {
    return {
        // Call this function inside render()
        // to let React DnD handle the drag events:
        connectDropTarget: connect.dropTarget(),
        // You can ask the monitor about the current drag state:
        isOver: monitor.isOver(),
        // isOverCurrent: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
        // itemType: monitor.getItemType()
    }
}

class SequenceView extends Component {
    constructor(props) {
        super(props)
        this.state = {
            dragId: 0
        }
        this.deleteSequenceCard = this.deleteSequenceCard.bind(this)
    }
    componentDidMount() {
        if (this.props.sequence.length > 0) {
            this.props.setSelectedCardIndex(0)
            this.findInsightsOfUnderCard(0)
        }
        //------------计算滚动条的位置所需要的------------
        //设置比例尺
        //1900是画布的宽度
        const { dataRange, columnsName, chartScale, chartMargin } = this.props
        let chartWidth = Math.max(dataRange[1] * 2, 1000)

        this.scale = d3.scaleLinear().domain(dataRange).range([60, chartWidth - chartMargin])
        //计算每列的高度(参照origin.js中oneYLength的计算法则)
        this.oneYLength = (120 * columnsName.length - 20) / columnsName.length

        //设置最初的滑动条的位置
        this.calcuRecommendScrollLocation(0)
        // //Todo:需要删除
        // this.props.setCurrentPopInsights(StaticPopInsights)
        // this.props.setPopInsightCardState(true)
    }
    findRecommendList = (index) => {
        //当前index不为0，当前的推荐列表为空时才需要找
        const { sequence, timeColumnName, file_url, task } = this.props
        if (index >= sequence.length) {
            index = sequence.length
        }
        if (!sequence[index].hasOwnProperty("recommendList")) return
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

            // todo
            generateRecommendList(file_url, timeColumnName, task, previous, current).then(response => {
                this.props.addRecommendList(index, response.data.recommendList)
                this.setState({ isRequest: false })
                console.log(response.data.recommendList)
            }).catch(error => {
                console.log('失败', error)
                this.setState({ isRequest: false })
            })

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
    // //渲染时，保证不会总是重复渲染
    // shouldComponentUpdate(nextProps){
    //     // if(!_.isEqual(nextProps.hoverFactIndex,this.props.hoverFactIndex)) return true
    //     // if(_.isEqual(nextProps.facts,this.props.facts)&&(_.isEqual(nextProps.selectedFactIndex,this.props.selectedFactIndex))) return false
    //     // return true
    // }
    deleteSequenceCard = (index) => {
        const { sequence } = this.props
        //如果删除的是最后一张卡片，那么当前选择的就是倒数第二张卡片
        if (index === sequence.length) {
            this.props.setSelectedCardIndex(index - 1)
            this.calcuRecommendScrollLocation(index - 1)
        } else {
            //如果删除的不是最后一张，那么选择的还是当前这个位置的卡片
            this.props.setSelectedCardIndex(index)
            setTimeout(() => {
                this.calcuRecommendScrollLocation(index)
            }, 1000);
        }
        this.findRecommendList(index)
        // this.updateConfigurePannel()
    }
    onDragStart = (result) => {
        this.setState({ dragId: result.draggableId })
        //this.props.selectFact(result.source.index)
    }
    onDragEnd = (result) => {
        const { sequence } = this.props
        // dropped outside the list
        if (!result.destination) {
            return;
        }
        if (parseInt(this.state.dragId) !== result.destination.index) {
            this.props.changeCardLocation(parseInt(this.state.dragId), result.destination.index);
            this.props.setSelectedCardIndex(result.destination.index)
            if (sequence[result.destination.index].spec !== "empty") {
                this.props.addRecommendList(result.destination.index, [])
                this.props.addRecommendList(parseInt(this.state.dragId), [])
                this.findInsightsOfUnderCard(result.destination.index)
                setTimeout(() => { this.findRecommendList(result.destination.index) }, 500)
            }
            setTimeout(() => {
                this.calcuRecommendScrollLocation(result.destination.index)
            }, 300)

        }

        // this.updateConfigurePannel()
        //TODO
    }
    findInsightsOfUnderCard = (index) => {
        const { sequence, file_url, timeColumnName, segmentInsightsStorage } = this.props
        if (sequence[index] === undefined) return
        console.log(sequence[index])
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
        if (!segmentInsightsStorage.hasOwnProperty(segmentKey)) {
            //请求api,response成功后再set current pop insights
            findInsight(file_url, field, timeColumnName, location).then(response => {
                // message.destroy()
                // message.success({content:'Generate success!',duration:1,style:{ marginTop: '35vh'}})
                // this.props.addPopInsights(segmentKey,response.data.insights)
                // this.props.setCurrentPopInsights(response.data.insights)

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

            }).catch(error => {
                console.log('失败', error)
                let pop_insights = [{
                    "spec": sequence[index].spec,
                    "type": sequence[index].type,
                    "action": sequence[index].hasOwnProperty("action") ? sequence[index].action : -1
                }]
                this.props.addPopInsights(segmentKey, pop_insights)
                this.props.setCurrentPopInsights(pop_insights)
            })

        } else {
            // this.props.setCurrentPopInsights(segmentInsightsStorage[segmentKey])
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
            //throught key value set current pop insights
        }
    }


    addEmptyInsight = (insert) => {
        // if(insert===sequence.length){
        //     //发起请求获取redundantlist
        // }
        // else if(sequence[insert]["recommendList"]!==undefined&&sequence[insert]["recommendList"].length==0){
        //     //发起请求，
        // }
        // //先判断当前的卡片位置的recommendList是否为空
        // //然后请求当前位置的卡片的recommendList,如果是最后一张，请求保存为redundant_list
        this.props.addEmptyCard(insert)
        this.props.setSelectedCardIndex(insert)
        setTimeout(() => { this.findRecommendList(insert) }, 2000)
        // setTimeout(()=>{this.findInsightsOfUnderCard(insert)},2000)
    }

    render() {
        const { connectDropTarget, sequence, selectedCardIndex } = this.props
        let isDragDisabled = false;
        return connectDropTarget(
            <div style={{ position: 'relative', display: 'flex', flexDirection: "row", height: "100%", width: "100%" }}>
                <DragDropContext onDragStart={this.onDragStart} onDragEnd={this.onDragEnd}>
                    <Droppable droppableId="sequenceline" direction="horizontal" >
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                style={getListStyle(snapshot.isDraggingOver)}>
                                {sequence.map(function (insight, index) {
                                    if (insight.spec) {
                                        return <Draggable key={index} index={index} draggableId={index.toString()} isDragDisabled={isDragDisabled}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}>
                                                    <InsightCardView
                                                        deleteSequenceCard={this.deleteSequenceCard}
                                                        key={index}
                                                        index={index}
                                                        insightSpec={insight.spec}
                                                        captionId={insight.captionId}
                                                        factType={insight.type}
                                                        isSelected={selectedCardIndex === index}
                                                        {...this.props}
                                                    />
                                                    <div className="add-btn" style={{ display: index + 1 === sequence.length ? 'none' : 'flex' }}>
                                                        <div className="add-next-insight" onClick={sequence.length < 15 ? () => this.addEmptyInsight(index + 1) : null}></div>
                                                    </div>
                                                </div>
                                            )}

                                        </Draggable>
                                    }
                                }.bind(this))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <div className="final-add-btn" style={{ display: sequence.length ? "flex" : "none" }}>
                    <div className="add-next-insight" onClick={sequence.length < 15 ? () => this.addEmptyInsight(sequence.length) : null}></div>
                </div>
            </div>
        )
    }
}

export default DropTarget(
    Types.CARD,
    cardDropTarget,
    collect
)(SequenceView)