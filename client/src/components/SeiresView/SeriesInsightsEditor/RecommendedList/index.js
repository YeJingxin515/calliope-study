import { connect } from 'react-redux';
import { sequence,selectedCardIndex,recommendList,selectedRecommendCardIndex} from '@/selector/series';
import * as seriesAction from '../../../../action/seriesAction'
import RecommendedList from './RecommendedList';

const mapStateToProps = (state) => ({
    sequence:sequence(state),
    selectedCardIndex:selectedCardIndex(state),
    recommendList: recommendList(state),
    selectedRecommendCardIndex: selectedRecommendCardIndex(state),
})

const mapDispatchToProps = dispatch => {
    return {
        setSelectedRecommendCard: (index) => dispatch(seriesAction.setSelectedRecommendCard(index)),
        removeRecommendCard: (index) => dispatch(seriesAction.removeRecommendCard(index)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(RecommendedList);