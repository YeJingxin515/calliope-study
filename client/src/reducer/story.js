import ActionType from '../action/type';
// import { genTitle } from "../sentencer/index";

const initialState = {
    file_url:'',
    originFileUrl:"",
    originData:[],
    originSchema:[],

    fileName: '.csv',
    title: '',
    data: [],
    schema: [],
    method: 'sig',
    facts: [],
    relations: [],
    maxStoryLength: 6,
    timeLimit: 2000,// for each iteration
    information: 40, // default 50 bits for 6 facts
    resultCoverage: 1,
    chartDiversity: 0,
    aggregationLevel: 0,
    rewardWeight: {
        logicality: 0.33,
        diversity: 0.33,
        integrity: 0.33,
    },
    generateProgress: 0,
};

export default (state = initialState, action) => {
    const newState = Object.assign({}, state);
    switch (action.type) {
        case ActionType.GENERATE_STORY:
            newState.facts = action.facts;
            newState.relations = action.relations;
            newState.resultCoverage = action.coverage;
            return newState;
        case ActionType.UPDATE_PROGRESS:
            newState.generateProgress = Number(((action.totalLength - action.currentLength) / action.totalLength).toFixed(2) * 100);
            return newState;
        case ActionType.UPLOAD_DATA:
            newState.fileName = action.fileName;
            newState.facts = [];
            newState.relations = [];
            newState.originSchema = action.schema;
            newState.originData = action.data;
            newState.originFileUrl = action.file_url;
            // newState.schema = action.schema;
            // newState.data = action.data;
            // newState.file_url = action.file_url;
            return newState
        case ActionType.UPDATE_FILEURL_AND_DATA:
            newState.schema = action.schema;
            newState.data = action.data;
            newState.file_url = action.file_url;
            return newState
        default:
            break;
    }
    return newState;
}