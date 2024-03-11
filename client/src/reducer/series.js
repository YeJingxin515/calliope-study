import ActionType from '../action/type';
import initSequence from '../constant/initSequence';


const initialState = {
    //init edit
    columnsName: [],
    originColumnName: [],
    originDataRange: [],
    originTimeValue: [],

    processTime: [],
    processGranularity: "",
    processColumns: [],

    granularityName: [],
    dataRange: [],
    timeColumnName: "",
    timeValue: [],
    drawScale: '',

    //before generate
    task: -1,
    //chartScale
    chartScale: 1500 / 500,
    chartMargin: 80,

    rightBtnState: "Start",
    isPopInsightCard: false,
    sequence: [],
    redundantRecommend: [],

    selectedCardIndex: -1,
    //card columns,type,timeRange

    selectedRecommendCardIndex: -1,

    currentPopInsightList: [],
    tooltipContainer: '',
    configureInsightColumns: [],
    configureInsightTime: [],
    configureInsightType: '',
    configureInsightBreakdown: '',

    segmentInsightsStorage: {}
};

export default (state = initialState, action) => {
    const newState = Object.assign({}, state);
    switch (action.type) {
        //--------------- init edit pannel-----------
        case ActionType.SET_PARSED_FILE_DATA:
            newState.originColumnName = action.columnList;
            newState.granularityName = action.granularity;
            newState.originDataRange = action.dataRange;
            newState.timeColumnName = action.timeCol;
            newState.originTimeValue = action.timeValue;
            return newState;

        case ActionType.UPDATE_COLUMNS_AND_RANGE:
            newState.columnsName = action.columns;
            // newState.granularityName = action.granularity;
            newState.dataRange = action.dataRange;
            // newState.timeColumnName = action.timeCol;
            newState.timeValue = action.timeValues;
            return newState;

        case ActionType.SET_SCALE:
            newState.drawScale = action.scale
            return newState

        //--------------before generate---------------
        case ActionType.SET_TASK:
            newState.task = action.task
            return newState
        //--------------time series--------------
        case ActionType.SET_SEQUENCE:
            newState.sequence = action.sequence;
            return newState;
        case ActionType.SET_REDUNDANT:
            newState.redundantRecommend = action.recommededList;
            return newState;

        case ActionType.CHANGE_BTN_STATE:
            newState.rightBtnState = action.state;
            return newState;
        case ActionType.ADD_EMPTY_CARD:
            let cardData = newState.sequence.slice();
            // if (action.index === newState.sequence.length) {
            //     recommededList = newState.redundantRecommend
            // } else {
            //     recommededList = newState.sequence[action.index]["recommendList"]
            // }
            let emptyFact = {
                "action": -1,
                "spec": "empty",
                "type": "empty",
                "recommendList": []
            }
            cardData.splice(action.index, 0, emptyFact);
            newState.sequence = cardData;
            console.log(newState.sequence)
            return newState
        case ActionType.REMOVE_CARD:
            if (newState.sequence.length > 0) {
                newState.sequence = newState.sequence.filter((_, i) => i !== action.index)
            }
            return newState;
        case ActionType.FIX_CARD:
            let fixedSenquence = newState.sequence.slice()
            if (fixedSenquence.length > 0) {
                fixedSenquence.splice(action.index, 1, { spec: action.spec, type: action.factType, recommendList: action.recommendList, oriBlock: action.oriBlock, captionId: action.captionId })
            }
            newState.sequence = fixedSenquence
            return newState;
        case ActionType.CHANGE_CRAD_LOCATION:
            let cardDatas = _.cloneDeep(newState.sequence);
            let origin = action.origin;
            let target = action.target;
            let tmp = cardDatas[origin]
            cardDatas[origin] = cardDatas[target]
            cardDatas[target] = tmp
            newState.sequence = cardDatas;
            return newState;
        case ActionType.SET_SELECTED_CARD_INDEX:
            newState.selectedCardIndex = action.index
            //更新card details：columns、type、timeRange
            let tempDetails = {}
            tempDetails["columns"] = []
            tempDetails["type"] = ""
            tempDetails["range"] = [0, 0]
            tempDetails["breakdown"] = ""
            console.log(newState.sequence)
            if (newState.sequence[action.index]["spec"] !== "empty" || action.index === -1) {
                //set columns
                let measures = newState.sequence[action.index].spec.fact.measure
                measures.map((measure, i) => {
                    tempDetails["columns"].push(measure.field)
                })
                //set type
                tempDetails["type"] = newState.sequence[action.index].type
                //set time range
                // tempDetails["range"] = newState.sequence[action.index].spec.fact.subspace
                tempDetails["range"] = [newState.sequence[action.index].oriBlock[0]["value"][0].start, newState.sequence[action.index].oriBlock[0]["value"][0].end]
                tempDetails["breakdown"] = newState.sequence[action.index].spec.fact.breakdown[0].granularity
            }
            newState.configureInsightColumns = tempDetails["columns"]
            newState.configureInsightTime = tempDetails["range"]
            newState.configureInsightType = tempDetails["type"]
            newState.configureInsightBreakdown = tempDetails["breakdown"]
            //重置右侧推荐列表，selectedRecommendCardIndex=-1
            newState.selectedRecommendCardIndex = -1
            return newState
        //--------recommend list-----------
        case ActionType.SET_SELECTED_RECOMMEND_CARD:
            newState.selectedRecommendCardIndex = action.index
            return newState
        case ActionType.REMOVE_RECOMMEND_CARD:
            let insightCard = newState.selectedCardIndex
            let newSenquence = newState.sequence.slice()
            if (newSenquence[insightCard].recommendList.length > 0) {
                newSenquence[insightCard].recommendList.splice(action.index, 1)
            }
            newState.sequence = newSenquence
            return newState
        case ActionType.ADD_RECOMMEND_LIST:
            let oriSequence = newState.sequence.slice()
            if (oriSequence[action.index]["spec"] === "empty") {
                if (oriSequence.length > 0) {
                    let oriDetials = oriSequence[action.index]
                    oriSequence.splice(action.index, 1, { action: oriDetials.action, spec: "empty", type: "empty", recommendList: action.recommendList })
                }
            } else {
                if (oriSequence.length > 0) {
                    let oriDetials = oriSequence[action.index]
                    oriSequence.splice(action.index, 1, { action: oriDetials.action, spec: oriDetials.spec, type: oriDetials.type, recommendList: action.recommendList, oriBlock: oriDetials.oriBlock, captionId: oriDetials.captionId })
                }
            }
            newState.sequence = oriSequence
            return newState;

        case ActionType.SET_POP_INSIGHTS:
            newState.currentPopInsightList = action.insights
            return newState
        //------pop card--------
        case ActionType.ADD_SEGMENTS_INSIGHTS:
            let tempSegmentStorage = _.cloneDeep(newState.segmentInsightsStorage);
            tempSegmentStorage[action.segment_key] = action.segment_insights
            newState.segmentInsightsStorage = tempSegmentStorage
            return newState

        case ActionType.SET_POP_CARD_START:
            newState.isPopInsightCard = action.state
            return newState

        case ActionType.SET_TOOLTIP_CONTAINER:
            newState.tooltipContainer = action.container
            return newState

        //----configure card----------
        case ActionType.SET_CONFIGURE_COLUMNS:
            newState.configureInsightColumns = action.columns
            return newState

        case ActionType.SET_CONFIGURE_TIME:
            newState.configureInsightTime = [action.start, action.end]
            return newState

        case ActionType.SET_CONFIGURE_TYPE:
            newState.configureInsightType = action.insightType
            return newState

        case ActionType.SET_CONFIGURE_BREAKDOWN:
            newState.configureInsightBreakdown = action.breakdown
            return newState

        //----------file process--------------
        case ActionType.SET_PROCESS_TIME:
            newState.processTime = action.time
            return newState
        case ActionType.SET_PROCESS_GRANULARITY:
            newState.processGranularity = action.granularity
            return newState
        case ActionType.SET_PROCESS_COLUMNS:
            newState.processColumns = action.columns
            return newState
        default:
            break;
    }
    return newState;
}