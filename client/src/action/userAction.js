import ActionType from './type';


export const updateUserInfo = (userInfo) => ({
    type: ActionType.UPDATE_USER_INFO,
    userInfo
})

export const updateOperation = (operateState) => ({
    type: ActionType.UPDATE_USER_OPERATION,
    operateState
})

export const updateCovertType = (convertType) => ({
    type: ActionType.UPDATE_CONVERT_TYPE,
    convertType
})

export const updateLocale = (currentLocale) => ({
    type: ActionType.UPDATE_LOCALE,
    currentLocale
})