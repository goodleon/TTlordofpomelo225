var ZJHCode = {

    //common for all games
    Success: 0,
    Fail: 1,


    verifyPlayerFail: 2,
    emailUsed: 3,
    emailValid: 4,
    invalidMail: 5,
    playerNotFound: 6,
    guestCanNotRecommend: 7,
    canNotLogin: 8,
    alreadyInGame: 9,
    keepInGame: 10,
    ban: 11, // 封禁
    paraError: 12, //参数错误
    //


    sqlError: 30,
    lessMoney: 31,
    lessCoin: 32,

    clientRestart: 33,
    clientUpdate: 34,
    bindError: 35,



    joinRoomOK: 36,
    cfgVersionChange: 37,
    alreadyInRoom: 38,
    roomFull: 39,
    slotNotFound: 40,
    roomNotFound: 41,
    minVersion: 42,

    zjhCfgChange: 50,
    zjhDateEnd: 51,
    zjhCfgStop: 52,
    roomInPlay: 53,
    playerNotWaitStart: 54,



    joinActOK: 60,
    canNotJoinActInPlay: 61,
    joinWrongAct: 62,
    alreadyInAct: 63,
    actClosed: 64, //no use
    invalidActPos: 65,
    invalidActRoom: 66,
    actEnd: 67,
    invaliReward: 68,



    //add member to myroom
    canNotAddSelf: 80,
    isMemberAlready: 81,
    memberNotFound: 82,
    addMemberOK: 83,
    removeMemberOK: 84,
    membersNumLimit: 85,
    memberofNumLimit: 86,
    authAddPlayerExist: 87,


    rpcErr: 100,
    loginToMuch: 101,
    errorState: 102,
    serverFull: 103,

    coinTableFalse: 120, //创建金币场失败
    coinTableRange: 121, //不能进入该类型金币场
    coinGetMax: 122, //领金币次数上限
    coinGetLimit: 123, //未低于领取金币的限制
    coinRoomMin: 124, //低于该金币场最小要求
    coinRoomMax: 125, //高于该金币场最大要求

    signinAlready: 130, //今天已经签到

    itemErrPara: 150, //错误的道具ID
    itemNotFind: 151, //找不到该道具
    itemExpire: 152, //道具过期

    OrderNotExist: 200,
    OrderAlreadyUsed: 201, //订单已经使用
    OrderSendError: 202, //发送订单失败

};

if (module) module.exports = ZJHCode;
else console.error('module not exist');