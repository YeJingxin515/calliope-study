import { connect } from 'react-redux';
import { processTime,originTimeValue,processGranularity,processColumns,rightBtnState,timeColumnName,task} from '@/selector/series';
import StartBackButton from './StartBackButton';
import * as seriesAction from '../../../../action/seriesAction'
import * as storyAction from '../../../../action/storyAction'
import { file_url,originFileUrl} from '@/selector/story';


const mapStateToProps = (state) => ({
    originFileUrl:originFileUrl(state),
    originTimeValue:originTimeValue(state),
    rightBtnState: rightBtnState(state),
    file_url:file_url(state),
    timeColumnName:timeColumnName(state),
    task:task(state),
    processTime:processTime(state),
    processGranularity:processGranularity(state),
    processColumns:processColumns(state),
})

const mapDispatchToProps = dispatch => {
    return {
        changeBtnState: (state) => dispatch(seriesAction.changeBtnState(state)),
        setSequence:(sequence)=> dispatch(seriesAction.setSequence(sequence)),
        setRedundantRecommend :(recommededList) => dispatch(seriesAction.setRedundantRecommend(recommededList)),
        updateColumnsAndRange : (columns,dataRange,timeValues) =>dispatch(seriesAction.updateColumnsAndRange(columns,dataRange,timeValues)),
        updateFileAndData : (schema,data,file_url)=>dispatch(storyAction.updateFileAndData(schema,data,file_url)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(StartBackButton);