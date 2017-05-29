//**************************************
//算法类 处理麻将核心算法----针对两排房的算法CMajiangDoubleCard
//create by huyan
//
function CMajiangDoubleCard() {
    require("./CMajiangBase.js").call(this)

    this.mjcards = [
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9, //条
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,

            // 11,12,13,14,15,16,17,18,19,
            // 11,12,13,14,15,16,17,18,19,
            // 11,12,13,14,15,16,17,18,19,//万
            // 11,12,13,14,15,16,17,18,19,

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

inherit(require("./CMajiangBase.js"), CMajiangDoubleCard)

//
//两牌房洗牌
// CMajiangDoubleCard.prototype.randomCards=function(withWind)
// {
// 	return require("./CMajiangBase.js").call( this, withWind );
// }

/**
 * 检测是否是胡的某一张 如果传5 则检测5万 5条 5筒 是否夹5 如果是返回true
 *  @cards ---手里的牌 eg.[1,2,3,4,5,6]
 *  @inputCard   传数字 eg.2条的值为"2"
 *  @return 是，否
 */
CMajiangDoubleCard.prototype.isWinStucMiddleCardNum2 = function(cards, inputCard) {
        var tempCards = [].concat(cards);
        if (inputCard < 10) { //2,3,4,5,6,7
            if (inputCard < 2 || inputCard > 8) {
                this.GLog("isWinStucMiddleCardNum2 if (inputCard < 2 || inputCard > 8) is true function_return false");
                return false;
            }
        } else if (inputCard > 10 && inputCard < 20) { //12,13,14,15,16,17
            if (inputCard < 12 || inputCard > 18) {
                this.GLog("isWinStucMiddleCardNum2 if (inputCard < 12 || inputCard > 18) is true function_return false");
                return false;
            }
        } else if (inputCard > 20 && inputCard < 30) { //22,23,24,25,26,27
            if (inputCard < 22 || inputCard > 28) {
                this.GLog("isWinStucMiddleCardNum2 if (inputCard < 22 || inputCard > 28) is true function_return false");
                return false;
            }
        }

        var index1 = tempCards.indexOf(inputCard - 1); //indexOf() 方法可返回某个指定的字符串值在字符串中首次出现的位置。
        if (index1 >= 0 && index1 < tempCards.length) //下标在 数组的 有效范围内
        {
            tempCards.splice(index1, 1); //splice() 方法用于插入、删除或替换数组的元素。
        }

        var index2 = tempCards.indexOf(inputCard + 1);
        if (index2 >= 0 && index2 < tempCards.length) {
            tempCards.splice(index2, 1);
        }

        if (tempCards.length == 2) {
            if (tempCards[0] == tempCards[1])
                return true;
        } else {
            this.GLog("isWinStucMiddleCardNum2 tempCards=" + JSON.stringify(tempCards));
            var iRest = this.canHu(false, tempCards, 0) == 1 ? true : false;
            this.GLog("isWinStucMiddleCardNum2 canHu return iRest=" + iRest);
            return iRest;
        }

        this.GLog("isWinStucMiddleCardNum2 return false");
        return false;
    }
    /**
     * 算番数两牌房
     * @pi 调去该函数玩家
     * @withDesc 带不带描述
     * @tData 牌桌数据　
     * @isCha 是否大叫
     * @genArr 跟的数组
     */
CMajiangDoubleCard.prototype.computeBaseWin = function(pi, withDesc, tData, isCha, genArr) {
    //是否7小队胡法
    var num2 = pi.huType == 7 ? 1 : 0;
    //是否龙7对
    if (num2 == 1 && this.canGang1([], pi.mjhand).length > 0) {
        num2 = 2;
    }
    //是否大对碰
    var num3 = num2 > 0 ? 0 : this.All3(pi);
    var sameColor = this.SameColor(pi, tData);
    var all19 = this.all19(pi);

    var baseWin = 1;
    //对对胡
    if (num3 == 1) {
        if (tData.fight3p) {
            baseWin *= 2;
        } else {
            baseWin *= 4;
        }
        if (withDesc) {
            pi.mjdesc.push("对对胡");
        }
    } else if (num3 == 2 && tData.yaojiu) {
        baseWin *= 8;

        if (withDesc) {
            pi.mjdesc.push("将对");
        }
    } else if (num3 == 2 && (!tData.yaojiu)) {
        if (tData.fight3p) {
            baseWin *= 2;
        } else {
            baseWin *= 4;
        }
        if (withDesc) {
            pi.mjdesc.push("对对胡");
        }
    }
    //7对
    if (num2 > 0) {
        //龙7对
        if (num2 > 1) {
            if (sameColor) {
                baseWin *= 16
                if (withDesc) {
                    pi.mjdesc.push("清龙七对");
                }

            } else {
                baseWin *= 8
                if (withDesc) {
                    pi.mjdesc.push("龙七对");
                }
            }
        } //7对
        else {
            if (sameColor) {
                if (withDesc) {
                    pi.mjdesc.push("清七对");
                }
                if (tData.fight3p) {
                    baseWin *= 16
                } else {
                    baseWin *= 8
                }

            } else {
                if (withDesc) {
                    pi.mjdesc.push("七巧对");
                }
                baseWin *= 4
            }
        }

        // if(withDesc)
        // {
        // 	pi.mjdesc.push(num2>1?"龙七对":"七巧对");
        // }
    } else if (sameColor) {
        baseWin *= 4;
        if (withDesc) pi.mjdesc.push("清一色");
    }

    if (all19 && tData.yaojiu) {
        baseWin *= 4;
        if (withDesc) {
            pi.mjdesc.push("带幺九");
        }
    }

    if (pi.mjhand.length == 2 && (!isCha)) {
        baseWin *= 2;
        if (withDesc) {
            pi.mjdesc.push("金钩胡");
        }
    } else if (pi.mjhand.length == 1 && (!isCha)) { //血流成河，最后一张牌没有放到mjhand。
        baseWin *= 2;
        if (withDesc) {
            pi.mjdesc.push("金钩胡");
        }
    }

    //门清中张
    if (tData.menqing) {
        //没有碰牌，没有明杠
        if (pi.mjpeng.length <= 0 && pi.mjgang0.length <= 0) {
            baseWin *= 2;
            if (withDesc) {
                pi.mjdesc.push("门清");
            }
        }
        //牌型中不包含1和9
        if (0 == this.hasCardNum(pi.mjhand, 1) && 0 == this.hasCardNum(pi.mjhand, 9) && 0 == this.hasCardNum(pi.mjhand, 11) && 0 == this.hasCardNum(pi.mjhand, 19) &&
            0 == this.hasCardNum(pi.mjhand, 21) && 0 == this.hasCardNum(pi.mjhand, 29) && !this.pengGameHas19(pi)) {

            baseWin *= 2;
            if (withDesc) {
                pi.mjdesc.push("中张");
            }
        }

    }

    var have4 = this.have4(pi, tData);
    if (num2 > 1) {
        have4--;
    }
    if (have4 > 0) {
        if (withDesc) {
            pi.mjdesc.push("根X" + have4);
        }
        for (var i = 0; i < have4; i++) {
            baseWin *= 2;
        }
        genArr.push(have4);
    }

    //听牌加番
    if (pi.mjting) {
        baseWin *= 2;
        if (withDesc) {
            pi.mjdesc.push("报听");
        }
    }
    if (tData.maxPlayers <= 3) {

    } else {
        //卡 二 条
        //判断手牌是否只胡2条
        if (this.canOnlyOneCardHu(pi, tData, 2, false)) {
            //判断手牌是否有1个1条和一个3条
            //if(1 <= this.hasCardNum(pi.mjhand, 1) && 1 <= this.hasCardNum(pi.mjhand,3) && ( pi.mjhand[pi.mjhand.length-1] == 2) )
            var iTempCard = [].concat(pi.mjhand);
            iTempCard.length = iTempCard.length - 1;

            if (pi.mjhand[pi.mjhand.length - 1] == 2 && this.isWinStucMiddleCardNum2(iTempCard, 2)) {
                if (withDesc) {
                    pi.mjdesc.push("卡二条");
                }
                baseWin *= 2;
            }
        }
    }

    return baseWin;
}




module.exports = CMajiangDoubleCard;