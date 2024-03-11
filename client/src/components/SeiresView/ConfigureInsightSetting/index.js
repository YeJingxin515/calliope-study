import { connect } from 'react-redux';
import { dataRange, segmentInsightsStorage, currentPopInsightList, task, chartScale, chartMargin, redundantRecommend, sequence, timeValue, selectedCardIndex, timeColumnName, columnsName, configureInsightColumns, configureInsightTime, configureInsightType, configureInsightBreakdown } from '@/selector/series';
import * as seriesAction from '../../../action/seriesAction'
import ConfigureInsightSetting from './ConfigureInsightSetting';
import { file_url } from '@/selector/story';

const mapStateToProps = (state) => ({
    sequence: sequence(state),
    file_url: file_url(state),
    timeColumnName: timeColumnName(state),
    selectedCardIndex: selectedCardIndex(state),
    timeValue: timeValue(state),
    redundantRecommend: redundantRecommend(state),
    task: task(state),
    segmentInsightsStorage: segmentInsightsStorage(state),
    currentPopInsightList: currentPopInsightList(state),

    chartScale: chartScale(state),
    chartMargin: chartMargin(state),

    dataRange: dataRange(state),
    columnsName: columnsName(state),
    configureInsightColumns: configureInsightColumns(state),
    configureInsightTime: configureInsightTime(state),
    configureInsightType: configureInsightType(state),
    configureInsightBreakdown: configureInsightBreakdown(state),
    // selectedCardColumns:selectedCardColumns(state),

})

const mapDispatchToProps = dispatch => {
    return {
        setCurrentPopInsights: (insights) => dispatch(seriesAction.setCurrentPopInsights(insights)),
        addRecommendList: (index, recommendList) => dispatch(seriesAction.addRecommendList(index, recommendList)),
        setSequence: (sequence) => dispatch(seriesAction.setSequence(sequence)),
        fixCard: (index, spec, factType, recommendList, oriBlock, captionId) => dispatch(seriesAction.fixCard(index, spec, factType, recommendList, oriBlock, captionId)),
        setConfigureInsightColumns: (columns) => dispatch(seriesAction.setConfigureInsightColumns(columns)),
        setConfigureInsightTime: (start, end) => dispatch(seriesAction.setConfigureInsightTime(start, end)),
        setConfigureInsightType: (type) => dispatch(seriesAction.setConfigureInsightType(type)),
        setConfigureInsightBreakdown: (breakdown) => dispatch(seriesAction.setConfigureInsightBreakdown(breakdown)),
        setRedundantRecommend: (recommededList) => dispatch(seriesAction.setRedundantRecommend(recommededList)),
        addPopInsights: (segment_key, segment_insights) => dispatch(seriesAction.addPopInsights(segment_key, segment_insights)),

    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigureInsightSetting);