import { connect } from 'react-redux';
import * as seriesAction from '../../../../action/seriesAction'
import {sequence,selectedCardIndex,selectedRecommendCardIndex,isPopInsightCard,configureInsightColumns,configureInsightTime,currentPopInsightList,timeColumnName} from '@/selector/series'
import { file_url } from '@/selector/story';

import PopInsightCard from './PopInsightCard';

const mapStateToProps = (state) => ({
    sequence:sequence(state),
    selectedCardIndex:selectedCardIndex(state),
    isPopInsightCard: isPopInsightCard(state),
    currentPopInsightList:currentPopInsightList(state),
    selectedRecommendCardIndex:selectedRecommendCardIndex(state),
    configureInsightColumns:configureInsightColumns(state),
    configureInsightTime:configureInsightTime(state),
    timeColumnName:timeColumnName(state),
    file_url:file_url(state)
})
const mapDispatchToProps = dispatch => {
    return {
        setSelectedCardIndex:(index)=> dispatch(seriesAction.setSelectedCardIndex(index)),
        setCurrentPopInsights:(insights)=> dispatch(seriesAction.setCurrentPopInsights(insights)),
        setPopInsightCardState: (state) => dispatch(seriesAction.setPopInsightCardState(state)),
        fixCard:(index,spec,factType,recommendList,oriBlock,captionId)=> dispatch(seriesAction.fixCard(index,spec,factType,recommendList,oriBlock,captionId))
    }
    
}
export default connect(mapStateToProps, mapDispatchToProps)(PopInsightCard);