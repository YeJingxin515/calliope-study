/*
包含应用中所有接口请求函数的模块
每个函数的返回值都是promise
 */
import ajax from './ajax'
import config from './config';
// let uploadUrl = 'http://localhost:6038/upload'
// let parseFileUrl = 'http://localhost:6038/metadata'
// let generateSequenceUrl = 'http://localhost:6040/generate/story'
// let findInsightUrl = 'http://localhost:6040/generate/insight'
// let fileProcess = 'http://localhost:6038/preprocess'
// let genertateRecommendList = 'http://localhost:6040/generate/recommend'
//zerotier:172.30.249.157
// let uploadUrl = 'http://172.30.249.157:6038/upload'
// let parseFileUrl = 'http://172.30.249.157:6038/metadata'
// let generateSequenceUrl = 'http://172.30.249.157:6040/generate/story'
// let findInsightUrl = 'http://172.30.249.157:6040/generate/insight'
// let fileProcess = 'http://172.30.249.157:6038/preprocess'
// let genertateRecommendList = 'http://172.30.249.157:6040/generate/recommend'
// vasta-api.idvxlab.com
let uploadUrl = 'https://vasta-api.idvxlab.com:8008/upload'
let parseFileUrl = 'https://vasta-api.idvxlab.com:8008/metadata'
let generateSequenceUrl = 'https://vasta-api.idvxlab.com:8008/generate/story'
let findInsightUrl = 'https://vasta-api.idvxlab.com:8008/generate/insight'
let fileProcess = 'https://vasta-api.idvxlab.com:8008/preprocess'
let genertateRecommendList = 'https://vasta-api.idvxlab.com:8008/generate/recommend'
//upload file
export const uploadFile = (formData) => ajax(uploadUrl, formData, 'POST',
    {
        "headers": {
            'Content-Type': 'multipart/form-data' //application/json; charset=utf-8
        },
    });

export const processFile = (path, start, end, variable, aggregate) => ajax(fileProcess,
    {
        'path': path,
        'start': start,
        'end': end,
        'variable': variable,
        'aggregate': aggregate
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);

//analysis file's columns、time column、granularity and so on
export const parsingFile = (fileurl) => ajax(
    parseFileUrl,
    {
        'path': fileurl
    },
    'GET'
);


//------------generate sequence-----------
export const generateSequence = (file_path, time_col, task) => ajax(generateSequenceUrl,
    {
        'path': file_path,
        'time_field': time_col,
        'task': task
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);
//---find insights-------
export const findInsight = (file_url, fields, time_field, location) => ajax(findInsightUrl,
    {
        'file_url': file_url,
        'fields': fields,
        'time_field': time_field,
        'location': location
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);
//-------generate single insight-------
export const generateSingleInsight = (file_url, fields, time_field, location, insights) => ajax(findInsightUrl,
    {
        'file_url': file_url,
        'fields': fields,
        'time_field': time_field,
        'location': location,
        'insights': insights
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);
//------request recommendList-------
export const generateRecommendList = (file_url, time_field, task, previous, current) => ajax(genertateRecommendList,
    {
        'file_url': file_url,
        'time_field': time_field,
        'task': task,
        'previous': previous,
        'current': current
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);
//------generate update story-------
export const generateSubsequent = (path, time_field, existing_insights, task) => ajax(generateSequenceUrl,
    {
        'path': path,
        'time_field': time_field,
        'existing_insights': existing_insights,
        'task': task
    },
    'POST',
    {
        "headers": {
            'Content-Type': 'application/json'
        }
    }
);