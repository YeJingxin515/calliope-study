import ActionType from './type';
export const changeBtnState = (state) => ({
    type: ActionType.CHANGE_BTN_STATE,
    state
})
//----------------init edit------------------------
export const setParsedFileData = (columnList, granularity, dataRange, timeCol, timeValue) => ({
    type: ActionType.SET_PARSED_FILE_DATA,
    columnList,
    granularity,
    dataRange,
    timeCol,
    timeValue
})
export const setScale = (scale) => ({
    type: ActionType.SET_SCALE,
    scale
})

//------before generate--------
export const setTask = (task) => ({
    type: ActionType.SET_TASK,
    task
})

// ---------------time seires anaysis flow----------------------------
export const setSequence = (sequence) => ({
    type: ActionType.SET_SEQUENCE,
    sequence
})
export const setRedundantRecommend = (recommededList) => ({
    type: ActionType.SET_REDUNDANT,
    recommededList
})

export const addEmptyCard = (index) => ({
    type: ActionType.ADD_EMPTY_CARD,
    index
})

export const changeCardLocation = (origin, target) => ({
    type: ActionType.CHANGE_CRAD_LOCATION,
    origin,
    target
})

export const removeCard = (index) => ({
    type: ActionType.REMOVE_CARD,
    index
})

export const fixCard = (index, spec, factType, recommendList, oriBlock, captionId) => ({
    type: ActionType.FIX_CARD,
    index,
    spec,
    factType,
    recommendList,
    oriBlock,
    captionId
})

export const setSelectedCardIndex = (index) => ({
    type: ActionType.SET_SELECTED_CARD_INDEX,
    index
})

//-----------------recommend insight card----------------
export const setSelectedRecommendCard = (index) => ({
    type: ActionType.SET_SELECTED_RECOMMEND_CARD,
    index
})
export const removeRecommendCard = (index) => ({
    type: ActionType.REMOVE_RECOMMEND_CARD,
    index
})
export const addRecommendList = (index, recommendList) => ({
    type: ActionType.ADD_RECOMMEND_LIST,
    index,
    recommendList
})

//--------------------pop insight card------------
export const addPopInsights = (segment_key, segment_insights) => ({
    type: ActionType.ADD_SEGMENTS_INSIGHTS,
    segment_key,
    segment_insights
})

export const setPopInsightCardState = (state) => ({
    type: ActionType.SET_POP_CARD_START,
    state
})
export const setCurrentPopInsights = (insights) => ({
    type: ActionType.SET_POP_INSIGHTS,
    insights
})
export const setTooltipContainer = (container) => ({
    type: ActionType.SET_TOOLTIP_CONTAINER,
    container
})


//----------------------configure edit----------------

export const setConfigureInsightColumns = (columns) => ({
    type: ActionType.SET_CONFIGURE_COLUMNS,
    columns
})

export const setConfigureInsightTime = (start, end) => ({
    type: ActionType.SET_CONFIGURE_TIME,
    start,
    end
})

export const setConfigureInsightType = (insightType) => ({
    type: ActionType.SET_CONFIGURE_TYPE,
    insightType
})

export const setConfigureInsightBreakdown = (breakdown) => ({
    type: ActionType.SET_CONFIGURE_BREAKDOWN,
    breakdown
})

export const setProcessTime = (time) => ({
    type: ActionType.SET_PROCESS_TIME,
    time
})
export const setProcessGranularity = (granularity) => ({
    type: ActionType.SET_PROCESS_GRANULARITY,
    granularity
})
export const setProcessColumns = (columns) => ({
    type: ActionType.SET_PROCESS_COLUMNS,
    columns
})

export const updateColumnsAndRange = (columns, dataRange, timeValues) => ({
    type: ActionType.UPDATE_COLUMNS_AND_RANGE,
    columns,
    dataRange,
    timeValues
})
