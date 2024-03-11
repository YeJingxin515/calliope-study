import pickFactTemplate from './fact-templates-en';
import pickFactTemplateZh from './fact-templates-zh'
// import pickRelationTemplate from './relation-templates';
import FactType from '../../constant/FactType'
// import { isValid } from '@/view/FactView/helper'
import AggregationType from '../../constant/AggregationType'
import InsightType from '../../constant/InsightType';
import ActionType from '../../constant/ActionType';
import ActionTypeZh from '../../constant/ActionTypeZh';
import ActionCaption from '../../constant/ActionCaption';
import ActionCaptionZh from '../../constant/ActionCaptionZh';
import _ from 'lodash'

//-----------------------------------aggregate----------------------------
// const plur = require('plur');
const convertAggregation = function (aggType, langEn = true) {
    switch (aggType) {
        case AggregationType.SUM:
            return langEn ? 'total' : '总'

        case AggregationType.MAX:
            return langEn ? 'maximum' : '最大'

        case AggregationType.MIN:
            return langEn ? 'minimum' : '最小'

        case AggregationType.AVG:
            return langEn ? 'average' : '平均'

        case AggregationType.MEDIAN:
            return langEn ? 'median' : '中'

        case AggregationType.COUNT:
            return langEn ? 'count' : '数量'

        case AggregationType.NONE:
            return ''

        default:
            return ''
    }
}

const converAction = function (action, langEn = true) {
    switch (action) {
        case -1:
            return langEn ? ActionCaption["-1"] : ActionCaptionZh["-1"]

        case 0:
            return langEn ? ActionCaption["0"] : ActionCaptionZh["0"]

        case 1:
            return langEn ? ActionCaption["1"] : ActionCaptionZh["1"]

        case 2:
            return langEn ? ActionCaption["2"] : ActionCaptionZh["2"]

        case 3:
            return langEn ? ActionCaption["3"] : ActionCaptionZh["3"]

        case 4:
            return langEn ? ActionCaption["4"] : ActionCaptionZh["4"]

        case 5:
            return langEn ? ActionCaption["5"] : ActionCaptionZh["5"]

        case 6:
            return langEn ? ActionCaption["6"] : ActionCaptionZh["6"]

        case 7:
            return langEn ? ActionCaption["7"] : ActionCaptionZh["7"]

        default:
            return ''
    }
}
//---------------------------------measure-------------------------------------
const convertMeasure = function (measure) {
    if (measure.aggregate === "count") return ""
    else return measure.field.toLowerCase();
}

const convertMultiMeasure = function (measures, hasBalineline = true, langEn = true) {
    let measureStr = ''
    let baseline = ''
    let measureList = []
    if (hasBalineline) {
        for (let i = 0; i < measures.length; i++) {
            if (measures[i]["value"][0].text === "Base Line") {
                baseline = measures[i]["field"]
            } else {
                measureList.push(measures[i]["field"])
            }
        }
    } else {
        for (let i = 0; i < measures.length; i++) {
            if (!measureList.includes(measures[i].field)) {
                measureList.push(measures[i].field)
            }
        }
    }

    for (let i = 0; i < measureList.length; i++) {
        if (i === measureList.length - 1 && measureList.length > 1) {
            if (langEn) measureStr += "and " + measureList[i]
            else measureStr += "和 " + measureList[i]
        } else if (i === measureList.length - 2) {
            measureStr += measureList[i] + " "
        } else {
            measureStr += measureList[i] + ", "
        }

    }
    return { measureStr: measureStr, baseline: baseline }
}
const converFocusRange = function (focus, subspace, data, langEn = true) {
    if (langEn) return `${data[focus["scope"][0] + subspace[0]]} and ${data[focus["scope"][1] + subspace[0]]}`
    else return `${data[focus["scope"][0] + subspace[0]]} 到 ${data[focus["scope"][1] + subspace[0]]}`
}
//----------------------------------subspace---------------------------------
const genFactSubspace = function (subspace, template, langEn = true, data) {
    if (subspace.length) {
        template = template.replace("{{subspace0}}", data[subspace[0]]);
        template = template.replace("{{subspace1}}", data[subspace[1]]);
    } else {
        // if(data.length>0){
        template = template.replace("{{subspace0}}", data[0]);
        template = template.replace("{{subspace1}}", data[data.length - 1]);
        // }else{
        //     template = template.replace("在{{subspace0}}到{{subspace1}}之间，", '');
        //     template = template.replace("， 在{{subspace0}}到{{subspace1}}之间", '');
        //     template = template.replace("Between {{subspace0}} and {{subspace1}}， ", '');
        //     template = template.replace(" when the time is between {{subspace0}} and {{subspace1}}", '');
        //     template = template.replace(" 在{{subspace0}}到{{subspace1}}之间， ", '');
        //     template = template.replace("在{{subspace0}}到{{subspace1}}之间", '');
        //     template = template.replace(/^\S/, s => s.toUpperCase())
        // }
    }
    return template
}


export const genFactSentence = function (_fact, block, type, lang, id = -1, data = [], action = -1) {
    let langIsEn = lang === "en-US"
    let fact = _.cloneDeep(_fact)
    let template = langIsEn ? pickFactTemplate(type, id) : pickFactTemplateZh(type, id);
    let aggregate = AggregationType.NONE;
    if (fact.measure.length > 0) {
        aggregate = fact.measure[0].aggregate;
    }
    template = template.replace("{{action}}", converAction(action, langIsEn))
    switch (type) {
        case InsightType.TREND:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            let lineReg = fact.focus[0]["regression"]
            if (langIsEn) {
                if (lineReg[0] - lineReg[lineReg.length - 1] > 0) {
                    template = template.replace("{{parameter}}", 'decreased');
                    template = template.replace("a/an", 'a');
                } else {
                    template = template.replace("{{parameter}}", 'increasing');
                    template = template.replace("a/an", 'an');
                }
            }
            else {
                if (lineReg[0] - lineReg[lineReg.length - 1] > 0) {
                    template = template.replace("{{parameter}}", '下降');
                } else {
                    template = template.replace("{{parameter}}", '增长');
                }
            }
            break;

        case InsightType.FORECASTING:
            break;

        case InsightType.FREQUENT_PATTERN:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            // template = genFactSubspace(fact.subspace, template, langIsEn, data)
            template = genFactSubspace(fact.focus[0]["scope"], template, langIsEn, data)

            if (fact.focus.length > 0) {
                template = template.replace("{{patterns}}", fact.focus[0]["patterns"].length.toString());
            }
            break;

        case InsightType.SEASONALITY:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            // template = genFactSubspace(fact.subspace, template, langIsEn, data)
            template = genFactSubspace(fact.focus[0]["scope"], template, langIsEn, data)

            if (fact.focus.length > 0) {
                let insightFocus = fact.focus[0]
                template = template.replace("{{parameter}}", insightFocus.ifSeasonal ? (langIsEn ? "seasonal" : "具有周期性") : (langIsEn ? "unseasonal" : "存在不符合周期性的片段。如图中灰色的区间。"));
                template = template.replace("{{seasonality}}", insightFocus.interval.toString());
                // template = template.replace("{{unseasonality}}", insightFocus.seasonal.length.toString());
            }
            break;

        case InsightType.UNIVARIATE_OUTLIER:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            let start1 = fact.focus[0]["scope"][0], end1 = fact.focus[0]["scope"][1]
            if (start1 === end1) {
                template = template.replace("{{focus}}", `${data[start1]}`);
            } else {
                template = template.replace("{{focus}}", `${data[start1]} and ${data[end1]}`);
            }
            // if (fact.focus.length > 0) {
            //     template = template.replace("{{parameter}}", fact.focus.length.toString())
            //     template = template.replace("{{focus}}", converFocusRange(fact.focus[0], fact.subspace, data))
            //     template = template.replace("{{score}}", fact.focus[0]["value"].toFixed(2).toString())
            // }
            // }

            break;

        case InsightType.UNIVARIATE_DISTRIBUTION:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            for (let i = 0; i < fact.focus.length; i++) {
                let focuName = fact.focus[i]["name"]
                let value = fact.focus[i]["value"]
                if (focuName == "min") {
                    template = template.replace("{{min}}", value.toFixed(2).toString());
                } else if (focuName == "max") {
                    template = template.replace("{{max}}", value.toFixed(2).toString());
                } else if (focuName == "mean") {
                    template = template.replace("{{mean}}", value.toFixed(2).toString());
                }
            }
            break;

        case InsightType.SIMILARITY:
            let result = convertMultiMeasure(fact.focus, true, langIsEn)
            template = template.replace("{{measures}}", result.measureStr);
            template = template.replace("{{baseline}}", result.baseline);
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            // template = genFactSubspace(fact.subspace, template, langIsEn, data)
            template = genFactSubspace(fact.focus[0]["scope"], template, langIsEn, data)

            break;

        case InsightType.MULTIVARIATE_OUTLIER:
            // template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data);
            template = template.replace("{{score}}", fact.focus[0]["score"].toFixed(2).toString());
            let start = fact.focus[0]["start"] + fact.subspace[0], end = fact.focus[0]["end"] + fact.subspace[0]
            if (start === end) {
                template = template.replace("{{focus}}", `${data[start]}`);
            } else {
                template = template.replace("{{focus}}", `${data[start]} and ${data[end]}`);
            }
            break;

        case InsightType.MULTIVARIATE_DISTRIBUTION:
            let resultDistribution = convertMultiMeasure(fact.focus, false, langIsEn)
            template = template.replace("{{measures}}", resultDistribution.measureStr);
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            let tempMean = -10e9
            let maxMeanValue = 0
            let maxMeanMeasure = ''
            for (let i = 0; i < fact.focus[0].length; i++) {
                if (fact.focus[0][i]["name"] === "mean") {
                    if (fact.focus[0][i]["value"] > tempMean) {
                        maxMeanValue = fact.focus[0][i]["value"]
                        tempMean = fact.focus[0][i]["value"]
                        maxMeanMeasure = fact.focus[0][i]["field"]
                    }
                }
            }
            template = template.replace("{{measure}}", maxMeanMeasure);
            template = template.replace("{{mean}}", maxMeanValue.toFixed(2).toString());
            break;

        case InsightType.CLUSTRING:
            break;

        case InsightType.OUTSTANDING:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            template = template.replace("{{focus}}", fact.focus[0]["value"].toFixed(2).toString());
            break;
        case InsightType.AUTOCORRELATION:
            template = template.replace("{{measure}}", convertMeasure(fact.measure[0]));
            template = template.replace("{{agg}}", convertAggregation(aggregate, langIsEn));
            template = genFactSubspace(fact.subspace, template, langIsEn, data)
            template = template.replace("{{focus}}", fact.focus[0]["correlation"].indexOf(Math.max(...fact.focus[0]["correlation"])) + 1)
            break
        default:
            break;
    }
    template = template.slice(0, 1).toUpperCase() + template.slice(1)
    return template;
}


export const genStoryText = function (facts, relations) {
    let template;
    let storyText = '';
    let pairLength = parseInt(facts.length / 2)
    //console.log("relations", facts, relations)
    for (let i = 0; i < pairLength; i++) {
        if (facts[i]) {
            template = pickRelationTemplate(relations[i * 2 + 1])
            // template = template.replace("{{Sentence A}}", facts[i * 2].script());
            // template = template.replace("{{Sentence B}}", facts[i * 2 + 1].script());
            template = template.replace("{{Sentence A}}", facts[i * 2].generatedScript);
            template = template.replace("{{Sentence B}}", facts[i * 2 + 1].generatedScript);
            storyText += template + ' '
        }
    }
    if (facts.length % 2) {
        //storyText += facts[facts.length - 1].script()
        storyText += facts[facts.length - 1].generatedScript
    }
    //console.log("storyText", storyText)
    return storyText
}

export const genSubtitle = function (fact, lang) {
    if (lang === "en-US") {
        let title;
        if (!isValid(fact))
            return ''

        title = 'The ' + fact.type
        switch (fact.type) {
            case FactType.ASSOCIATION:
                title += ' of ' + fact.measure[0].field + ' and ' + fact.measure[1].field
                break;
            case FactType.CATEGORIZATION:
                // title += ' of ' + fact.groupby[0]
                title = fact.groupby[0]
                break;

            case FactType.DIFFERENCE:
                title += ' between ' + fact.focus[0].value + ' and ' + fact.focus[1].value
                break;
            case FactType.DISTRIBUTION:
                title += ' of ' + fact.measure[0].field
                break;
            case FactType.EXTREME:
                title += ' of ' + fact.measure[0].field
                break;
            case FactType.OUTLIER:
                title += ' of ' + fact.measure[0].field
                break;
            case FactType.PROPORTION:
                title += ' of ' + fact.focus[0].value
                break;
            case FactType.RANK:
                title += ' of ' + fact.measure[0].field
                break;
            case FactType.TREND:
                title += ' of ' + fact.measure[0].field
                break;
            case FactType.VALUE:
                title = 'The ' + convertAggregation(fact.measure[0].aggregate) + ' ' + fact.measure[0].field
                break;
            default:
                break;
        }
        if (fact.subspace.length) {
            let subspace = '';
            fact.subspace.map((key, i) => { return subspace += ` in ${key.value}` })
            title += subspace;
        }
        return title;
    } else {
        let title = '';
        if (!isValid(fact))
            return ''
        if (fact.subspace.length) {
            let subspace = '';
            fact.subspace.map((key, i) => { return subspace += ` ${key.value}` })
            title += '在 ' + subspace + '中，';
        }
        // title = 'The ' + fact.type
        switch (fact.type) {
            case FactType.ASSOCIATION:
                title += fact.measure[0].field + ' 和 ' + fact.measure[1].field + '的相关性'
                break;
            case FactType.CATEGORIZATION:
                // title += ' of ' + fact.groupby[0]
                title += fact.groupby[0] + '的分类情况'
                break;

            case FactType.DIFFERENCE:
                title += fact.focus[0].value + ' 和 ' + fact.focus[1].value + '的差异'
                break;
            case FactType.DISTRIBUTION:
                title += fact.measure[0].field + '的分布'
                break;
            case FactType.EXTREME:
                title += fact.measure[0].field + '的极值'
                break;
            case FactType.OUTLIER:
                title += fact.measure[0].field + '的异常值'
                break;
            case FactType.PROPORTION:
                title += fact.focus[0].value + '的占比'
                break;
            case FactType.RANK:
                title += fact.measure[0].field + '的排名'
                break;
            case FactType.TREND:
                title += fact.measure[0].field + '的趋势'
                break;
            case FactType.VALUE:
                switch (convertAggregation(fact.measure[0].aggregate)) {
                    case AggregationType.SUM:
                        title += fact.measure[0].field + '的总值'
                        break;

                    case AggregationType.MAX:
                        title += fact.measure[0].field + '的最大值'
                        break;

                    case AggregationType.MIN:
                        title += fact.measure[0].field + '的最小值'
                        break;

                    case AggregationType.AVG:
                        title += fact.measure[0].field + '的平均值'
                        break;

                    case AggregationType.COUNT:
                        title += fact.measure[0].field + '的数量'
                        break;

                    case AggregationType.NONE:
                        title += fact.measure[0].field + '的值'
                        break;

                    default:
                        title += fact.measure[0].field + '的值'
                        break;

                }
                break;
            default:
                break;
        }

        return title;
    }


}


export const genTitle = function (fileName) {
    let title;
    switch (fileName) {
        case 'CarSales.csv':
            title = 'Car Sales'
            break;

        case 'nCoV2020.csv':
            title = 'COVID-19'
            break;

        case 'deadstartup.csv':
            title = 'Startup Failures'
            break;

        default:
            if (fileName.indexOf('.') > 0) {
                let number = fileName.indexOf('.');
                // let csv = fileName.substr(number);
                title = fileName.substring(0, number);
            } else {
                title = fileName
            }
            break;
    }
    return title
}
