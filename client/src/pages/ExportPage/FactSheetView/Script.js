import React, { Component } from 'react'
import { Textfit } from '@kyo_ago/react-textfit';
import { genFactSentence } from '../../../insight_charts/caption';

export default class Script extends Component {
  constructor(props) {
    super(props);
    this.textRef = React.createRef()
  }

  textFitReady(textFitRef, styles) {
    if (!textFitRef) return
    textFitRef._parent.style.height = 'fit-content';
    if (textFitRef._parent.clientHeight > parseFloat(styles['height'], 10)) {
        textFitRef._parent.style['line-height'] = 1;
    }
    if (textFitRef._parent.clientHeight > parseFloat(styles['height'], 10)) {
        textFitRef._parent.style.transform = 'scale(0.833)';
    }
    //TODO:文字高亮处
    // textFitRef._child.innerHTML = events[i].fact.aggregated && events[i].fact.aggregatedFact ? hightlight(events[i].fact) + hightlight(events[i].fact.aggregatedFact) : hightlight(events[i].fact)
    textFitRef._child.contentEditable =false
    textFitRef._child.spellCheck = false
    textFitRef._child.suppressContentEditableWarning = false

}
  computeDes(factStyle, slotHeight) {
    let styles = {};
    switch (factStyle) {
        case '6p':
            styles['height'] = `${slotHeight * 0.8}px`
            break
        case '4p':
            styles['height'] = `${slotHeight * 0.8}px`
            break
        case '3p':
            if (slotHeight >= 235) {
                styles['width'] = '90%';
                styles['height'] = `${slotHeight * 0.3}px`
            } else {
                styles['height'] = `${slotHeight * 0.75}px`
            }
            break
        case '2p3':
        case '2p':
            if (slotHeight >= 235) {
                styles['width'] = '90%';
                styles['height'] = `${slotHeight * 0.3}px`
            } else {
                styles['height'] = `${slotHeight * 0.75}px`
            }
            break
        default:
            break
    }
    return styles
}

  render() {
    const {factStyle,slotHeight,generatedScript,currentLocale,captionId,insightSpec,factType} =this.props
    return (
      <div 
      className='fs_edit factsheetSlotIn factsheetDes' 
      spellCheck="false" 
      style={{ 
        width: slotHeight > 235 || factStyle=== '6p'  ? "90%" : '', 
        lineHeight: generatedScript.length > 100 ? generatedScript.length > 140 ? 1.1 : 1.2 : 1.5 }}>
            <Textfit
                ref={el => this.textRef = el}
                className="fs_text"
                style={this.computeDes(factStyle, slotHeight)}
                mode="multi"
                max={factStyle=== '6p' || factStyle=== '4p' ? 18 : 16}
                min={10}
                onReady={() => { this.textFitReady(this.textRef, this.computeDes(factStyle, slotHeight)) }}>
                {genFactSentence(insightSpec.fact,factType,currentLocale,captionId)}
            </Textfit>
        </div>
    )
  }
}
