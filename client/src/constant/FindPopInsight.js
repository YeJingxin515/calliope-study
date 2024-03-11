export default [
    {field:["FailureRate","GPUUsage","CPUUsage"],location:[5,60],insight:[{spec:getSpecByType("similarity"),type:"similarity"},{spec:getSpecByType("seasonality"),type:"seasonality"},{spec:getSpecByType("frequent_pattern"),type:"frequent_pattern"}]},
    {field:["GPUUsage"],location:[8,90],insight:[{spec:getSpecByType("univariate_distribution"),type:"univariate_distribution"}]},
    {field:["CPUUsage"],location:[20,199],insight:[{spec:getSpecByType("seasonality"),type:"seasonality"},{spec:getSpecByType("similarity"),type:"similarity"}]},
    {field:["GPUUsage"],location:[99,200],insight:[{spec:getSpecByType("trend"),type:"trend"}]},
    {field:["FailureRate"],location:[300,370],insight:[{spec:getSpecByType("seasonality"),type:"seasonality"},{spec:getSpecByType("similarity"),type:"similarity"}]},
    {field:["CPUUsage"],location:[200,280],insight:[{spec:getSpecByType("univariate_distribution"),type:"univariate_distribution"}]},
    {field:["CPUUsage"],location:[300,400],insight:[{spec:getSpecByType("univariate_distribution"),type:"univariate_distribution"},{spec:getSpecByType("similarity"),type:"similarity"}]},
    {field:["GPUUsage"],location:[400,480],insight:[{spec:getSpecByType("seasonality"),type:"seasonality"},{spec:getSpecByType("similarity"),type:"similarity"}]},
    {field:["FailureRate"],location:[450,556],insight:[{spec:getSpecByType("trend"),type:"seasonality"},{spec:getSpecByType("similarity"),type:"similarity"},{spec:getSpecByType("frequent_pattern"),type:"frequent_pattern"}]},
]
function getSpecByType(type) {
    let oriSpec = require('../insight_charts/spec/' + type + '.json');
    let spec = _.cloneDeep(oriSpec);
    return spec
}