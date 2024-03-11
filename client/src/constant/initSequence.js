import _ from 'lodash';
export default [
    {
        "spec":getSpecByType("trend"),
        "type": "trend",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("univariate_distribution"),
        "type": "univariate_distribution",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("seasonality"),
        "type": "seasonality",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("frequent_pattern"),
        "type": "frequent_pattern",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("similarity"),
        "type": "similarity",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("multivariate_distribution"),
        "type": "multivariate_distribution",
        "captionId":1,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 40, "end": 80 }] },{ "field": "CPUUsage", "value": [{ "start": 40, "end": 80 }] }, { "field": "GPUUsage", "value": [{ "start": 40, "end": 80 }] }] ,
        "recommendList": [
            { "spec":getSpecByType("trend"),"type": "trend", "block": [{ "field": "GPUUsage", "value": [{ "start": 99, "end": 200 }] }] },
            { "spec":getSpecByType("seasonality"),"type": "seasonality", "block": [{ "field": "FailureRate", "value": [{ "start": 300, "end": 370 }] }] },
            { "spec":getSpecByType("univariate_distribution"),"type": "univariate_distribution", "block": [{ "field": "CPUUsage", "value": [{ "start": 200, "end": 280 }] }] }
        ]
    },
    {
        "spec":getSpecByType("univariate_outlier"),
        "type": "univariate_outlier",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("multivariate_outlier"),
        "type": "multivariate_outlier",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("multivariate_distribution"),
        "type": "multivariate_distribution",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("autocorrelation"),
        "type": "autocorrelation",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    },
    {
        "spec":getSpecByType("outstanding"),
        "type": "outstanding",
        "captionId":0,
        "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
        "recommendList": [
                   ]
    }
    // {
    //     "spec":getSpecByType("outstanding"),
    //     "type": "outstanding",
    //     "captionId":2,
    //     "oriBlock":[{ "field": "CPUUsage", "value": [{ "start": 20, "end": 100 }] }],
    //     "recommendList": [
    //         { "spec":getSpecByType("univariate_distribution"),"type": "univariate_distribution", "block": [{ "field": "CPUUsage", "value": [{ "start": 300, "end": 400 }] }] },
    //         { "spec":getSpecByType("seasonality"),"type": "seasonality", "block": [{ "field": "GPUUsage", "value": [{ "start": 400, "end": 480 }] }] }
    //     ]
    // },
    // {
    //     "spec":getSpecByType("autocorrelation"),
    //     "type": "autocorrelation",
    //     "captionId":0,
    //     "oriBlock":[{ "field": "GPUUsage", "value": [{ "start": 300, "end": 360 }] }],
    //     "recommendList": [
    //     ]
    // },
    // {
    //     "spec":getSpecByType("multivariate_distribution"),
    //     "type": "multivariate_distribution",
    //     "captionId":0,
    //     "oriBlock":[{ "field": "FailureRate", "value": [{ "start": 200, "end": 280 }] }],
    //     "recommendList": [
    //                ]
    // }
    // {
    //     "spec":getSpecByType("similarity"),
    //     "type": "similarity",
    //     "captionId":1,
    //     "oriBlock":[{ "field": "GPUUsage", "value": [{ "start": 400, "end": 450 }] }],
    //     "recommendList": [
    //         { "spec":getSpecByType("seasonality"),"type": "seasonality", "block": [{ "field": "FailureRate", "value": [{ "start": 450, "end": 556 }] }] },
    //         { "spec":getSpecByType("univariate_outlier"),"type": "univariate_outlier", "block": [{ "field": "FailureRate", "value": [{ "start": 5, "end": 60 }] }, { "field": "GPUUsage", "value": [{ "start": 5, "end": 60 }] }, { "field": "CPUUsage", "value": [{ "start": 5, "end": 60 }] }] },
    //         { "spec":getSpecByType("multivariate_outlier"),"type": "multivariate_outlier", "block": [{ "field": "GPUUsage", "value": [{ "start": 8, "end": 90 }] }] },
    //         { "spec":getSpecByType("outstanding"),"type": "outstanding", "block": [{ "field": "CPUUsage", "value": [{ "start": 20, "end": 199 }] }] },
    //         { "spec":getSpecByType("autocorrelation"),"type": "autocorrelation", "block": [{ "field": "CPUUsage", "value": [{ "start": 20, "end": 199 }] }] }

    //     ]
    // }
]

function getSpecByType(type) {
    let oriSpec = require('../insight_charts/spec/' + type + '.json');
    let spec = _.cloneDeep(oriSpec);
    return spec
}