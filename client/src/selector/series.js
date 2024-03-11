import { createSelector } from 'reselect';
export const rightBtnState = state => state.series.rightBtnState;
export const drawScale = state => state.series.drawScale;
//-------------------------data----------------------
export const columnsName = state => state.series.columnsName;
export const granularityName = state => state.series.granularityName;
export const dataRange = state => state.series.dataRange;
export const timeColumnName = state => state.series.timeColumnName;
export const timeValue = state => state.series.timeValue;
export const chartScale = state => state.series.chartScale;
export const chartMargin = state => state.series.chartMargin;

//-----------------------configure----------------------
export const task = state => state.series.task;
export const originColumnName = state => state.series.originColumnName;
export const originDataRange = state => state.series.originDataRange;
export const originTimeValue = state => state.series.originTimeValue;


//-------------------sequence---------------------------
export const sequence = state => state.series.sequence;
export const redundantRecommend = state => state.series.redundantRecommend;
export const segmentInsightsStorage = state => state.series.segmentInsightsStorage;
export const selectedCardIndex = state => state.series.selectedCardIndex;


// export const selectedCardColumns = createSelector(
//     sequence,
//     selectedCardIndex,
//     function (sequence, selectedCardIndex) {
//         let columnsList = []
//         if (sequence[selectedCardIndex]) {
//             console.log(sequence)
//             console.log(selectedCardIndex)
//             if (sequence[selectedCardIndex].type !== "empty") {
//                 let measures = sequence[selectedCardIndex].spec.fact.measure
//                 measures.map((measure, i) => {
//                     columnsList.push(measure.field)
//                 })
//             }
//         }
//         // }else if(sequence[selectedCardIndex-1]){
//         //     let measures = sequence[selectedCardIndex-1].spec.fact.measure
//         //     measures.map((measure, i) => {
//         //         columnsList.push(measure.field)
//         //     })
//         // }
//         return columnsList

//     }
// )
// export const selectedCardType = createSelector(
//     sequence,
//     selectedCardIndex,
//     function (sequence, selectedCardIndex) {
//         if (sequence[selectedCardIndex])
//         {
//             if(sequence[selectedCardIndex].type!=="empty"){
//                 return sequence[selectedCardIndex].type
//             }
//         }
//         // else if (sequence[selectedCardIndex - 1])
//         //     return sequence[selectedCardIndex - 1].type
//         return ""
//     }
// )
// export const selectedCardSubspace = createSelector(
//     sequence,
//     selectedCardIndex,
//     function (sequence, selectedCardIndex) {
//         if (sequence[selectedCardIndex]){
//             if(sequence[selectedCardIndex].type!=="empty"){
//                 return sequence[selectedCardIndex].spec.fact.subspace
//             }else{
//                 return [0,0]
//             }
//         }

//         return []
//     }
// )

//--------recommend list-------------
export const recommendList = state => state.series.recommendList;
export const selectedRecommendCardIndex = state => state.series.selectedRecommendCardIndex;

//---------pop card-------------

export const isPopInsightCard = state => state.series.isPopInsightCard;
export const currentPopInsightList = state => state.series.currentPopInsightList;
export const tooltipContainer = state => state.series.tooltipContainer;


//-------------------configure edit-----------------

export const configureInsightColumns = state => state.series.configureInsightColumns;
export const configureInsightTime = state => state.series.configureInsightTime;
export const configureInsightType = state => state.series.configureInsightType;
export const configureInsightBreakdown = state => state.series.configureInsightBreakdown;


//--------------------file preprocess--------------
export const processTime = state => state.series.processTime;
export const processGranularity = state => state.series.processGranularity;
export const processColumns = state => state.series.processColumns;
