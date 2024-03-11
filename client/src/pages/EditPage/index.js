import { connect } from 'react-redux';
import { file_url,fileName, schema, relations, storyParameter, maxStoryLength, data, resultCoverage, aggregationLevel, facts, rewardWeight, title, generateProgress } from '@/selector/story';
import {rightBtnState} from '@/selector/series'
import * as dataAction from '../../action/dataAction';
import * as storyAction from '../../action/storyAction';
import * as userAction from '../../action/userAction';
import EditPage from './EditPage';

const mapStateToProps = (state) => ({
    rightBtnState:rightBtnState(state),
    file_url:file_url(state),
    schema: schema(state),
    facts: facts(state),
    relations: relations(state),
    data: data(state),
    title: title(state),
    resultCoverage: resultCoverage(state),
    fileName: fileName(state),
    storyParameter: storyParameter(state),
    maxStoryLength: maxStoryLength(state),
    rewardWeight: rewardWeight(state),
    aggregationLevel: aggregationLevel(state),
    generateProgress: generateProgress(state),
})

const mapDispatchToProps = dispatch => {
    return {
        //data
        uploadData: (fileName, schema, data,file_url) => dispatch(dataAction.uploadData(fileName, schema, data,file_url)),
        //story
        generateStory: (facts, relations, coverage) => dispatch(storyAction.generateStory(facts, relations, coverage)),
        updateProgress: (totalLength, currentLength) => dispatch(storyAction.updateProgress(totalLength, currentLength)),
        //user
        updateCovertType: (covertType) => dispatch(userAction.updateCovertType(covertType)),
        updateOperation: (operateState) => dispatch(userAction.updateOperation(operateState)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(EditPage);
