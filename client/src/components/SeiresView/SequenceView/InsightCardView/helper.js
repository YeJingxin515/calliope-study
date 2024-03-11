
export const hightlightItem = function (script, parameter) {
    if (script.indexOf(parameter) === -1) return script
    let srtStartIndex = script.indexOf(parameter);
    let newScript = script.substring(0, srtStartIndex + parameter.length) + "</b></span>" + script.substring(srtStartIndex + parameter.length);
    newScript = newScript.substring(0, srtStartIndex) + '<span class="timeline-hightlight"><b>' + newScript.substring(srtStartIndex);
    return newScript
}
//只需要时间列的信息
// export const getOriData = function () {
//     let timeValue = []
    
    
//     return timeValue
// }
