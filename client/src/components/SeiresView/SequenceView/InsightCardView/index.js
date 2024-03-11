import { connect } from 'react-redux';
import * as seriesAction from '../../../../action/seriesAction'
import { sequence, task, currentPopInsightList, chartMargin, chartScale, columnsName, timeValue, dataRange, segmentInsightsStorage, timeColumnName } from '@/selector/series'
import { currentLocale } from '@/selector/user'
import { file_url } from '@/selector/story';
import InsightCardView from './InsightCardView';
const mapStateToProps = (state) => ({

    chartScale: chartScale(state),
    chartMargin: chartMargin(state),
    timeValue: timeValue(state),
    columnsName: columnsName(state),
    sequence: sequence(state),
    currentLocale: currentLocale(state),
    task: task(state),
    currentPopInsightList: currentPopInsightList(state),
    // selectedCardColumns:selectedCardColumns(state),
    // selectedCardType:selectedCardType(state),
    // selectedCardSubspace:selectedCardSubspace(state),
    dataRange: dataRange(state),
    segmentInsightsStorage: segmentInsightsStorage(state),
    timeColumnName: timeColumnName(state),
    file_url: file_url(state)
})
const mapDispatchToProps = dispatch => {
    return {
        addRecommendList: (index, recommendList) => dispatch(seriesAction.addRecommendList(index, recommendList)),
        setCurrentPopInsights: (insights) => dispatch(seriesAction.setCurrentPopInsights(insights)),
        addPopInsights: (segment_key, segment_insights) => dispatch(seriesAction.addPopInsights(segment_key, segment_insights)),
        removeCard: (index) => dispatch(seriesAction.removeCard(index)),
        setSelectedCardIndex: (index) => dispatch(seriesAction.setSelectedCardIndex(index)),
        setConfigureInsightColumns: (columns) => dispatch(seriesAction.setConfigureInsightColumns(columns)),
        setConfigureInsightTime: (start, end) => dispatch(seriesAction.setConfigureInsightTime(start, end)),
        setConfigureInsightType: (type) => dispatch(seriesAction.setConfigureInsightType(type)),
        setConfigureInsightBreakdown: (breakdown) => dispatch(seriesAction.setConfigureInsightBreakdown(breakdown)),
    }

}
export default connect(mapStateToProps, mapDispatchToProps)(InsightCardView);