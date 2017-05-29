//**************************************
//算法类 处理麻将核心算法----针对 万州 的算法 CMajingWanzhou
//create by huyan
//
function CMajingWanzhou() {
    require("./CMajiangBase.js").call(this)

    this.mjcards = [
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9, //条
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,

            11, 12, 13, 14, 15, 16, 17, 18, 19,
            11, 12, 13, 14, 15, 16, 17, 18, 19,
            11, 12, 13, 14, 15, 16, 17, 18, 19, //万
            11, 12, 13, 14, 15, 16, 17, 18, 19,

            21, 22, 23, 24, 25, 26, 27, 28, 29,
            21, 22, 23, 24, 25, 26, 27, 28, 29,
            21, 22, 23, 24, 25, 26, 27, 28, 29, //筒
            21, 22, 23, 24, 25, 26, 27, 28, 29,


            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91
        ]
        //console.info("CMajiangDoubleCard");
}

function inherit(superType, subType) {
    var _prototype = Object.create(superType.prototype);
    _prototype.constructor = subType;
    subType.prototype = _prototype;
}

inherit(require("./CMajiangBase.js"), CMajingWanzhou)

module.exports = CMajingWanzhou;