import InsightType from '../../../constant/InsightType';
//univariate
import trend from './trend';
import forecasting from './forecasting';
import frequent_pattern from './frequent_pattern';
import seasonality from './seasonality';
import univariate_outlier from './univariate_outlier';
import univariate_distribution from './univariate_distribution';
//multivariate
import similarity from './similarity';
import multivariate_outlier from './multivariate_outlier';
import multivariate_distribution from './multivariate_distribution';
import clustering from './clustering';
import autocorrelation from './autocorrelation';
import outstanding from './outstanding';

const templateCount = 3;

const pickFactTemplate = function(type, id=-1) {
    // pick randomly when id == -1
    let templates = []
    switch (type) {
        case InsightType.TREND:
            templates = trend;
            break;

        case InsightType.FORECASTING:
            templates = forecasting;
            break;

        case InsightType.FREQUENT_PATTERN:
            templates = frequent_pattern;
            break;

        case InsightType.SEASONALITY:
            templates = seasonality;
            break;

        case InsightType.UNIVARIATE_OUTLIER:
            templates = univariate_outlier;
            break;

        case InsightType.UNIVARIATE_DISTRIBUTION:
            templates = univariate_distribution;
            break;

        case InsightType.SIMILARITY:
            templates = similarity;
            break;

        case InsightType.MULTIVARIATE_OUTLIER:
            templates = multivariate_outlier;
            break;

        case InsightType.MULTIVARIATE_DISTRIBUTION:
            templates = multivariate_distribution;
            break;

        case InsightType.CLUSTRING:
            templates = clustering;
            break;
        
        case InsightType.AUTOCORRELATION:
            templates=autocorrelation;
            break;
        case InsightType.OUTSTANDING:
            templates=outstanding;
            break;
        default:
            break;
    }
    if (id === -1) {
        id = Math.floor(Math.random() * 10)%templateCount
    }
    let sentence = '';
    try {
        sentence = templates[id].template;
    }
    catch(error) {
        console.error(error);
        console.log('wrong id:'+id)
    }
    return sentence;
}

export default pickFactTemplate;