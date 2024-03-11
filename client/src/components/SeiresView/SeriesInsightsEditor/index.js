import { connect } from 'react-redux';
import {originDataRange, originTimeValue,originColumnName,rightBtnState,task,columnsName,granularityName,dataRange,timeColumnName,timeValue} from '@/selector/series';
import SeriesInsightsEditor from './SeriesInsightsEditor';
import * as seriesAction from '../../../action/seriesAction'

const mapStateToProps = (state) => ({
    rightBtnState: rightBtnState(state),
    columnsName:columnsName(state),
    originColumnName:originColumnName(state),

    granularityName:granularityName(state),
    dataRange:dataRange(state),
    originDataRange:originDataRange(state),
    timeColumnName:timeColumnName(state),

    timeValue:timeValue(state),
    originTimeValue:originTimeValue(state),
    task:task(state)

})

const mapDispatchToProps = dispatch => {
    return {
        setTask : (task)=> dispatch(seriesAction.setTask(task)),
        setProcessTime:(time)=> dispatch(seriesAction.setProcessTime(time)),
        setProcessGranularity: (granularity)=> dispatch(seriesAction.setProcessGranularity(granularity)),
        setProcessColumns:(columns)=> dispatch(seriesAction.setProcessColumns(columns)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(SeriesInsightsEditor);