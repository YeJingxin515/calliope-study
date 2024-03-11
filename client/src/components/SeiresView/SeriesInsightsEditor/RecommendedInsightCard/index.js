import { connect } from 'react-redux';
import {dataRange, chartMargin,chartScale,columnsName,timeColumnName,segmentInsightsStorage,recommendList,selectedRecommendCardIndex} from '@/selector/series';
import * as seriesAction from '../../../../action/seriesAction'
import { file_url } from '@/selector/story';
import RecommendedInsightCard from './RecommendedInsightCard';

const mapStateToProps = (state) => ({
    chartScale:chartScale(state),
    chartMargin:chartMargin(state),
    dataRange:dataRange(state),
    columnsName:columnsName(state),
    recommendList: recommendList(state),
    selectedRecommendCardIndex: selectedRecommendCardIndex(state),
    segmentInsightsStorage:segmentInsightsStorage(state),
    timeColumnName:timeColumnName(state),
    file_url:file_url(state)
})

const mapDispatchToProps = dispatch => {
    return {
        setSelectedRecommendCard: (index) => dispatch(seriesAction.setSelectedRecommendCard(index)),
        removeRecommendCard: (index) => dispatch(seriesAction.removeRecommendCard(index)),
        setCurrentPopInsights:(insights) => dispatch(seriesAction.setCurrentPopInsights(insights)),
        addPopInsights:(segment_key,segment_insights)=>dispatch(seriesAction.addPopInsights(segment_key,segment_insights)),
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(RecommendedInsightCard);