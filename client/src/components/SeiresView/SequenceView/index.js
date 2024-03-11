import { connect } from 'react-redux';
import SequenceView from './SequenceView';
import * as seriesAction from '../../../action/seriesAction'
import { chartScale, task, chartMargin, sequence, columnsName, dataRange, selectedCardIndex, timeColumnName, segmentInsightsStorage } from '@/selector/series'
import { file_url } from '@/selector/story';
const mapStateToProps = (state) => ({
    chartScale: chartScale(state),
    chartMargin: chartMargin(state),
    columnsName: columnsName(state),
    sequence: sequence(state),
    selectedCardIndex: selectedCardIndex(state),
    // selectedCardColumns:selectedCardColumns(state),
    // selectedCardType:selectedCardType(state),
    // selectedCardSubspace:selectedCardSubspace(state),
    segmentInsightsStorage: segmentInsightsStorage(state),
    dataRange: dataRange(state),
    timeColumnName: timeColumnName(state),
    file_url: file_url(state),
    task: task(state),

})
const mapDispatchToProps = dispatch => {
    return {
        addRecommendList: (index, recommendList) => dispatch(seriesAction.addRecommendList(index, recommendList)),
        setPopInsightCardState: (state) => dispatch(seriesAction.setPopInsightCardState(state)),
        setCurrentPopInsights: (insights) => dispatch(seriesAction.setCurrentPopInsights(insights)),
        addPopInsights: (segment_key, segment_insights) => dispatch(seriesAction.addPopInsights(segment_key, segment_insights)),
        addEmptyCard: (index) => dispatch(seriesAction.addEmptyCard(index)),
        changeCardLocation: (origin, target) => dispatch(seriesAction.changeCardLocation(origin, target)),
        setSelectedCardIndex: (index) => dispatch(seriesAction.setSelectedCardIndex(index)),
        setConfigureInsightColumns: (columns) => dispatch(seriesAction.setConfigureInsightColumns(columns)),
        setConfigureInsightTime: (start, end) => dispatch(seriesAction.setConfigureInsightTime(start, end)),
        setConfigureInsightType: (type) => dispatch(seriesAction.setConfigureInsightType(type)),
        setConfigureInsightBreakdown: (breakdown) => dispatch(seriesAction.setConfigureInsightBreakdown(breakdown)),
    }

}
export default connect(mapStateToProps, mapDispatchToProps)(SequenceView);