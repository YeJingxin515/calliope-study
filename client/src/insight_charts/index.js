import { connect } from 'react-redux';
import * as seriesAction from '../action/seriesAction'
import {isPopInsightCard,tooltipContainer} from '@/selector/series'
import Chart from './Chart';

const mapStateToProps = (state) => ({
    isPopInsightCard: isPopInsightCard(state),
    tooltipContainer:tooltipContainer(state)
})
const mapDispatchToProps = dispatch => {
    return {
        setPopInsightCardState: (state) => dispatch(seriesAction.setPopInsightCardState(state))
    }
    
}
export default connect(mapStateToProps, mapDispatchToProps)(Chart);