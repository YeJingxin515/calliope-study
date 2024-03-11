import { connect } from 'react-redux';
import {originFileUrl,originData, originSchema,file_url,fileName, schema, relations, storyParameter, maxStoryLength, data, resultCoverage, aggregationLevel, facts, rewardWeight, title, generateProgress } from '@/selector/story';
// import { isLogin } from "@/selector/user";
import * as dataAction from '../../action/dataAction';
import * as storyAction from '../../action/storyAction';
import * as userAction from '../../action/userAction';
import * as seriesAction from '../../action/seriesAction';
import Homepage from './Homepage';

const mapStateToProps = (state) => ({
    originFileUrl:originFileUrl(state),
    originSchema:originSchema(state),
    originData:originData(state),
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
        //init edit
        setParsedFileData : (columnList,granularity,dataRange,timeCol,timeValue)=> dispatch(seriesAction.setParsedFileData(columnList,granularity,dataRange,timeCol,timeValue)),
        //data
        uploadData: (fileName, schema, data,file_url) => dispatch(dataAction.uploadData(fileName, schema, data,file_url)),
        //story
        generateStory: (facts, relations, coverage) => dispatch(storyAction.generateStory(facts, relations, coverage)),
        updateProgress: (totalLength, currentLength) => dispatch(storyAction.updateProgress(totalLength, currentLength)),
        //user
        updateCovertType: (covertType) => dispatch(userAction.updateCovertType(covertType)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Homepage);
