import React, { Component } from 'react'
import { insightColors } from '../../../constant/RecommendedInsightColor'
import Draggable from 'react-draggable';
import './StorylineWebView.less'
import TimeLineSlot from './TimeLineSlot';
import ActionColor from '../../../constant/ActionColor';
import ActionType from '../../../constant/ActionType';
import InsightTypeTrans from '../../../constant/InsightTypeTrans';
import InsightTypeZh from '../../../constant/InsightTypeZh';
import ActionTypeZh from '../../../constant/ActionTypeZh';
// const factTypeIncluced = ["trend", "frequent_pattern", "seasonality", "univariate_distribution"]

const notVisable = 0,
    lessVisable = 0.2,
    fullVisable = 0.8
export default class StorylineWebView extends Component {
    constructor(props) {
        super(props);
        this.titleRef = React.createRef();
        this.lastItem = React.createRef()
        this.firstItem = React.createRef()
        this.olRef = React.createRef();
        this.onetimeRef = {};
        this.state = {
            timelineWidth: 0,
            leftOpacity: lessVisable,
            rightOpacity: fullVisable,
            activeDrags: 0,
            timelineTransform: 0,
            minFontSizeTitle: 18,
            containerHeight: this.props.visContainerSize.height - 320
        }
    }
    // drag
    onStart = () => {
        // let perv_activeDrags = this.state.activeDrags
        // this.setState({ activeDrags: ++perv_activeDrags });
    };

    onStop = () => {
        // let perv_activeDrags = this.state.activeDrags
        // this.setState({ activeDrags: --perv_activeDrags });
    };

    onDrag = () => {
        // this._checkVisibility();
    }
    moving = (direction) => {
        let sign = direction === 'left' ? '+' : '-';
        let _whichOpacity = direction + 'Opacity'
        if (this.state[_whichOpacity] === lessVisable) return
        let scrolling = 280;
        let tl = this.olRef;
        const tlStyle = getComputedStyle(tl);
        //   add more browser prefixes if needed here
        const tlTransform = tlStyle.getPropertyValue("-webkit-transform") || tlStyle.getPropertyValue("transform");
        let values;
        if (tlTransform === 'none') {
            values = parseInt(`${sign}${scrolling}`);
        }
        else {
            values = parseInt(tlTransform.split(",")[4]) + parseInt(`${sign}${scrolling}`);
        }
        this.setState({ timelineTransform: values });
        this.olRef.transform = `translateX(${values}px)`
        setTimeout(() => {
            this._checkVisibility();
        }, 1000)

    }
    isElementInViewport = (el, firstOrLast) => {
        if (!el) return false
        const rect = el.getBoundingClientRect();
        const parent = el.parentNode.parentNode.parentNode;
        const rect_p = parent.getBoundingClientRect();
        if (firstOrLast === 'last') {
            return (
                rect.right <= rect_p.right
            );
        } else {
            return (
                rect.left >= rect_p.left
            );
        }

    }
    _checkVisibility = () => {
        let last_item = this.lastItem;
        if (this.isElementInViewport(last_item, 'last')) {
            this.setState({
                rightOpacity: lessVisable
            })
        } else {
            this.setState({
                rightOpacity: fullVisable
            })
        }
        let first_item = this.firstItem;
        if (this.isElementInViewport(first_item, 'first')) {
            this.setState({
                leftOpacity: lessVisable
            })
        } else {
            this.setState({
                leftOpacity: fullVisable
            })
        }
    }
    render() {
        const { currentLocale, timeValue } = this.props.location.state
        let sequence = this.props.location.state.sequence
        // 去除掉sequence中的空card
        sequence = sequence.filter((insight, i) => insight.type !== "empty")
        //解析factTypeList:
        let factTypeIncluced = []
        let actionIncluded = []
        for (let item in sequence) {
            if (!factTypeIncluced.includes(sequence[item].type)) {
                factTypeIncluced.push(sequence[item].type)
            }
            if (item !== "0") {
                if (sequence[item].hasOwnProperty("action") && sequence[item].action != undefined) {
                    if (!actionIncluded.includes(sequence[item].action)) {
                        console.log(item, sequence[item])
                        actionIncluded.push(sequence[item].action)
                        // if(sequence[item].action===-1)actionIncluded.push("no action")
                        // else actionIncluded.push(ActionType[sequence[item].action.toSting()])
                    }
                } else {
                    if (!actionIncluded.includes(-1)) {
                        actionIncluded.push(-1)
                    }
                }
            }
        }
        console.log(actionIncluded)
        let actions = []
        for (let item in sequence) {
            if (item !== 0) {
                if (sequence[item].hasOwnProperty("action") && sequence[item].action != undefined) {
                    actions.push(sequence[item].action)
                } else {
                    actions.push(-1)
                }
            }
        }

        const dragHandlers = { onStart: this.onStart, onStop: this.onStop, onDrag: this.onDrag };
        console.log(sequence)
        return (
            <div
                style={{
                    height: `${this.state.containerHeight}px`,
                    position: 'relative',
                    paddingTop: (this.state.containerHeight - 380) / 2 + 'px',
                    paddingBottom: (this.state.containerHeight - 380) / 2 + 'px'
                }}>
                <div style={{ display: 'flex' }} className='export-sequence-line'>
                    {sequence.length !== 0 && sequence[0] !== undefined && <div className={`btn-arrow ${this.state.leftOpacity === fullVisable ? 'enabledBtn' : ''}`} style={{ opacity: this.state.leftOpacity }} onClick={() => this.moving('left')}><svg style={{ margin: 'auto', transform: 'scale(0.8)' }} viewBox="64 64 896 896" focusable="false" data-icon="left" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M724 218.3V141c0-6.7-7.7-10.4-12.9-6.3L260.3 486.8a31.86 31.86 0 0 0 0 50.3l450.8 352.1c5.3 4.1 12.9.4 12.9-6.3v-77.3c0-4.9-2.3-9.6-6.1-12.6l-360-281 360-281.1c3.8-3 6.1-7.7 6.1-12.6z"></path></svg> </div>}
                    <div style={{ width: '90%' }} className="content timeline">
                        {/* <ReactResizeDetector handleWidth onResize={this.onResize} /> */}
                        <Draggable axis="x" cancel=".tl-edit" {...dragHandlers} enableUserSelectHack={true}>
                            <div>
                                {sequence.length !== 0 && sequence[0] !== undefined && <ol ref={el => this.olRef = el} style={{ transform: `translateX(${this.state.timelineTransform}px)` }}>
                                    {sequence.map((insight, i) => {
                                        if (i === 0)
                                            return <li
                                                key={i}
                                                ref={el => this.firstItem = el}
                                                className={InsightTypeTrans[insight.type].toLowerCase()}
                                                style={{ backgroundImage: `linear-gradient(to right, ${ActionColor[actions[i].toString()]} , ${ActionColor[actions[i].toString()]})` }}
                                            // style={{ backgroundImage: `linear-gradient(to right, ${insightColors[sequence[i].type]} , ${insightColors[sequence[i + 1].type]})` }}
                                            >
                                                <TimeLineSlot sequence={sequence} timeValue={timeValue} currentLocale={currentLocale} index={i} insightSpec={insight.spec} captionId={insight.captionId} factType={insight.type} font_min_size={20} {...this.props} passOnClick={this.handleClickDiv}></TimeLineSlot>
                                            </li>
                                        return <li
                                            key={i}
                                            className={InsightTypeTrans[insight.type].toLowerCase()}
                                            style={{ backgroundImage: `linear-gradient(to right, ${ActionColor[actions[i].toString()]} , ${ActionColor[actions[i].toString()]})` }}
                                        // style={{ backgroundImage: `linear-gradient(to right, ${insightColors[sequence[i - 1].type]} , ${insightColors[sequence[i].type]})` }} 
                                        >
                                            <TimeLineSlot sequence={sequence} timeValue={timeValue} currentLocale={currentLocale} index={i} insightSpec={insight.spec} captionId={insight.captionId} factType={insight.type} font_min_size={20} {...this.props} passOnClick={this.handleClickDiv}></TimeLineSlot>
                                        </li>
                                    })}
                                    {/* <li
                                        style={{ backgroundImage: `linear-gradient(to right, ${ActionColor["-1"]} , ${ActionColor["-1"]}` }}
                                        style={{ backgroundImage: `linear-gradient(to right, ${insightColors[sequence[sequence.length - 1].type]} , ${insightColors[sequence[sequence.length - 1].type]})` }}
                                    ></li> */}
                                    <li ref={el => this.lastItem = el}></li>
                                </ol>}
                            </div>
                        </Draggable>
                    </div>
                    {sequence.length !== 0 && sequence[0] !== undefined && <div className={`btn-arrow ${this.state.rightOpacity === fullVisable ? 'enabledBtn' : ''}`} style={{ opacity: this.state.rightOpacity }} onClick={() => this.moving('right')}><svg style={{ margin: 'auto', transform: 'scale(0.8)' }} viewBox="64 64 896 896" focusable="false" data-icon="left" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M765.7 486.8L314.9 134.7A7.97 7.97 0 0 0 302 141v77.3c0 4.9 2.3 9.6 6.1 12.6l360 281.1-360 281.1c-3.9 3-6.1 7.7-6.1 12.6V883c0 6.7 7.7 10.4 12.9 6.3l450.8-352.1a31.96 31.96 0 0 0 0-50.4z"></path></svg></div>}
                </div>
                <div className="legends" style={{ width: '100%' }}>
                    {
                        factTypeIncluced.map((type, index) => {
                            return <div className="legend" key={index}>
                                <span className='dot' style={{ backgroundColor: `${insightColors[InsightTypeTrans[type].toLowerCase()]}` }}></span>
                                <div className='dot_text'>{currentLocale === "en-US" ? InsightTypeTrans[type] : InsightTypeZh[type]}</div>
                            </div>
                        })
                    }
                    {
                        actionIncluded.length > 0 ? <div className='legend-space'></div> : null
                    }
                    {
                        actionIncluded.map((action, index) => {
                            return <div className="legend" key={index}>
                                <span className='line' style={{ backgroundColor: `${ActionColor[action.toString()]}` }}></span>
                                <div className='dot_text'>{currentLocale === "en-US" ? ActionType[action.toString()] : ActionTypeZh[action.toString()]}</div>
                            </div>
                        })
                    }
                </div>
            </div>
        )
    }
}

