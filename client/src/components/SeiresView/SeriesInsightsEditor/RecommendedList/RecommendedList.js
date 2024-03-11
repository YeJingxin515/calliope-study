import React, { Component } from 'react'
import './RecommendedList.less'
import { Collapse } from 'antd';
import RecommendedInsightCard from '../RecommendedInsightCard';
const { Panel } = Collapse;
import { Spin } from 'antd';
export default class RecommendedList extends Component {
    constructor(props) {
        super(props);

    }

    render() {
        const { intl, sequence, selectedCardIndex } = this.props
        return (
            <Collapse defaultActiveKey={["insights-list"]}>
                <Panel header={intl.get("InsightList")} key="insights-list" >
                    <div className='insights-list'>
                        <div className='insights-card-list'>
                            {sequence[selectedCardIndex] === undefined ? null : selectedCardIndex !== 0 && sequence[selectedCardIndex]["recommendList"].length == 0 ? <Spin style={{ marginTop: '20px', marginBottom: '20px' }} /> :
                                <ul>
                                    {sequence[selectedCardIndex] === undefined ? null :
                                        sequence[selectedCardIndex]["recommendList"].map((value, index) => {
                                            return (
                                                <RecommendedInsightCard
                                                    insightSpec={value.spec}
                                                    factType={value.type}
                                                    key={index}
                                                    intl={intl}
                                                    index={index}
                                                    insightIndex={selectedCardIndex}
                                                    block={value.block}
                                                    sequence={sequence}
                                                    selected={this.props.selectedRecommendCardIndex === index}
                                                    onRef={c => this.RecommendCard = c}
                                                />
                                            )
                                        })
                                    }
                                </ul>
                            }
                        </div>
                    </div>
                </Panel>
            </Collapse>
        )
    }
}
