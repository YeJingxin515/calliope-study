import React, { Component } from 'react'
import { insightColors } from '../../../constant/RecommendedInsightColor'
import FactCard from './FactCard'
import Script from './Script'
import './FactSheetView.less'
import _ from 'lodash'
import { genFactSentence } from '../../../insight_charts/caption'
let events = [{ type: "trend", layout: "4p" }, { type: "similarity", layout: "2p" }, { type: "seasonality", layout: "6p" }]
let isHorizontal = false

export default class FactSheetView extends Component {
    computePdfSize() {
        let styles = {}
        if (isHorizontal) {
            styles['fontFamily'] = 'sans-serif';
            styles['width'] = '1300px'
            styles['height'] = '880px'
            styles['backgroundColor'] = '#F9F8F6'
            styles['position'] = 'relative'
        } else {
            styles['fontFamily'] = 'sans-serif';
            styles['width'] = '825px'
            styles['height'] = '1166px'
            styles['backgroundColor'] = '#F9F8F6'
            styles['position'] = 'relative'
        }
        return styles
    }
    calcuFactStyle = (sequence) => {
        if (sequence.length === 0) return
        function addOne(arr, res, final) {
            if (arr.length === 0) {
                final.push(res);
                return
            }
            _.range(1, 4).forEach((i) => {
                let c = arr.slice(0, i);
                if (c.length < i) return
                let temp_arr = arr.slice(i)
                let res_temp = [...res]
                res_temp.push(c)
                addOne(temp_arr, res_temp, final)
            })
        }
        let _res = [], result = [];
        addOne(_.range(0, sequence.length), _res, result)
        result = result.filter((r) => {
            return r.length <= _.max([r.length > 2 ? 2 : 1, Math.round(sequence.length / 2)])
        })
        let _result = result.filter((r) => {return r.length <= 5})
        if (_result.length !== 0) { // 可以塞下5行
            result = _result
        }
        


        let slen = sequence.length
        //每行3个的行数
        let lineThree = Math.floor(slen / 3)
        //每行2个的行数
        let lineTwo = Math.floor(slen % 3 / 2)
        //每行1个的行数
        let lineOne = slen % 3 % 2
        for(let i=0;i<slen;i++){
            if(i<lineThree*3){
                sequence[i]["layout"]="2p3"
            }else if(i<(lineThree*3+lineTwo*2)){
                sequence[i]["layout"]="3p"
            }else{
                sequence[i]["layout"]="6p"
            }
        }
        //计算每行的高度
        let slotHeight = 0
        switch (lineThree + lineTwo + lineOne) {
            case 1:
                slotHeight = 980
                break;
            case 2:
                slotHeight = 480
                break;
            case 3:
                slotHeight = 313.333
                break;
            case 4:
                slotHeight = 230
                break;
            case 5:
                slotHeight = 200
                break;
            default:
                break;
        }
        return {slotHeight:slotHeight,sequence:sequence};
    }
    render() {
        //TODO:这个height是会随之变化的
        
        const { currentLocale } = this.props.location.state
        let sequence = this.props.location.state.sequence
        // 去除掉sequence中的空card
        sequence = sequence.filter((insight, i) => insight.type !== "empty")
        let result=this.calcuFactStyle(sequence)
        let slotHeight = result.slotHeight
        sequence=result.sequence
        return (
            <div className="fsPDF" id="PDF" style={this.computePdfSize()}>
                <div style={{ height: "55px", alignItems: 'center', display: 'flex' }}>
                    <div className="factsheetContent" style={{ paddingTop: '20px', maxWidth: "100%" }}>
                        <h1 className="factsheetTitle fs_edit">
                            {"Indicators"}
                        </h1>
                    </div>
                </div>
                <div style={{ height: "25px", alignItems: 'center', display: 'flex' }}>
                    <div className="factsheetContent" style={{ paddingTop: "20px", maxWidth: "100%" }}>
                        <p className="factsheetSubTitle fs_edit">
                            {"Data scope:[2003/03/17-2003/07/11]]"}
                        </p>
                    </div>
                </div>

                <div className={"factsheetContent"} style={{ marginLeft: '', height: 'calc(100% - 125px)' }}>
                    {
                        sequence.map((item, i) =>
                            <div key={i} className={`factsheetSlot factsheetSlot_${item.layout}`} style={{ height: `${slotHeight}px`, marginTop: "20px", boxShadow: `inset 0 0 0 2px ${insightColors[item.type]}, 0 0 0 1px ${insightColors[item.type]}` }}>
                                <div className='factsheetSlotIn'>
                                    <div className='factsheetSlotType text-uppercase' >
                                        {item.type}
                                    </div>
                                    <div className="factsheetSlotContent" style={{ height: `${slotHeight - 50}px`, flexDirection: slotHeight > 235 || item.layout === '4p' || item.layout === '6p' ? 'column' : 'row' }}>
                                        <Script 
                                            generatedScript={item.type} 
                                            slotHeight={slotHeight} 
                                            factStyle={item.layout}
                                            currentLocale={currentLocale}
                                            captionId={item.captionId}
                                            insightSpec={item.spec}
                                            factType={item.type}
                                            {...this.props}>

                                        </Script>
                                        <div className='factsheetSlotIn factsheetVis' style={{ transform: 'translate(0px,-15px)scale(0.9)' }}>
                                            <FactCard
                                                index={i}
                                                factStyle={item.layout}
                                                factType={item.type}
                                                insightSpec={item.spec}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='factsheetSlotId text-uppercase' >
                                    {i + 1}
                                </div>
                            </div>
                        )}
                </div>
                <div className="fs-powerby" style={{ height: "25px" }}>
                    <div className="fs-logo"></div>
                    <div style={{ display: 'inline-block' }}>Powered By Calliope</div>
                </div>
            </div>
        )
    }
}
