import { connect } from 'react-redux';
import {segmentInsightsStorage,originTimeValue,originColumnName,originDataRange, chartScale,chartMargin,columnsName,drawScale,timeValue,timeColumnName,sequence,selectedCardIndex,rightBtnState,selectedRecommendCardIndex,
    configureInsightColumns,configureInsightTime,isPopInsightCard,currentPopInsightList,dataRange} from '@/selector/series';
import {fileName,file_url,schema,originFileUrl,originSchema} from '@/selector/story';
import * as seriesAction from '../../../action/seriesAction'
import EditTimeView from './EditTimeView';

const mapStateToProps = (state) => ({
    //file 
    fileName: fileName(state),
    timeValue:timeValue(state),
    chartScale:chartScale(state),
    chartMargin:chartMargin(state),
    segmentInsightsStorage:segmentInsightsStorage(state),

    //init chart spec
    drawScale:drawScale(state),
    file_url:file_url(state),
    schema:schema(state),
    timeColumnName:timeColumnName(state),
    columnsName:columnsName(state),

    originFileUrl:originFileUrl(state),
    originSchema:originSchema(state),
    originDataRange:originDataRange(state),
    originColumnName:originColumnName(state),
    originTimeValue:originTimeValue(state),


    sequence:sequence(state),
    selectedCardIndex:selectedCardIndex(state),
    rightBtnState: rightBtnState(state),
    selectedRecommendCardIndex: selectedRecommendCardIndex(state),

    configureInsightColumns:configureInsightColumns(state),
    configureInsightTime:configureInsightTime(state),

    dataRange:dataRange(state),
    isPopInsightCard: isPopInsightCard(state),
    currentPopInsightList:currentPopInsightList(state)
})

const mapDispatchToProps = dispatch => {
    return {
        setTooltipContainer:(container)=> dispatch(seriesAction.setTooltipContainer(container)),
        setScale : (scale)=> dispatch(seriesAction.setScale(scale)),
        setPopInsightCardState:(state)=>dispatch(seriesAction.setPopInsightCardState(state)),
        setCurrentPopInsights:(insights) => dispatch(seriesAction.setCurrentPopInsights(insights)),

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditTimeView);