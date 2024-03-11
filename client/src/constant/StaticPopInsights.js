export default [
    { spec: getSpecByType("outstanding"), type: "outstanding" },
    { spec: getSpecByType("frequent_pattern"), type: "frequent_pattern" },
    { spec: getSpecByType("autocorrelation"), type: "autocorrelation" },
    { spec: getSpecByType("multivariate_outlier"), type: "multivariate_outlier" },
    { spec: getSpecByType("multivariate_distribution"), type: "multivariate_distribution" },
    { spec: getSpecByType("univariate_outlier"), type: "univariate_outlier" }
]
function getSpecByType(type) {
    let oriSpec = require('../insight_charts/spec/' + type + '.json');
    let spec = _.cloneDeep(oriSpec);
    return spec
}