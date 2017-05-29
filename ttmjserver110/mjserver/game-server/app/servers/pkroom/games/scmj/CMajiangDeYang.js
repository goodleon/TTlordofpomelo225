//**************************************
//算法类 处理麻将核心算法---德阳的算法
//create by likecheng
//
function CMajiangDeYang() {
    require("./CMajiangBase.js").call(this)
        //console.info("CMajiangDoubleCard");
}

function inherit(superType, subType) {
    var _prototype = Object.create(superType.prototype);
    _prototype.constructor = subType;
    subType.prototype = _prototype;
}

inherit(require("./CMajiangBase.js"), CMajiangDeYang)


/**
 * 检测是否是胡的某一张 如果传5 则检测5万 5条 5筒 是否夹5 如果是返回true
 *  @cards ---手里的牌 eg.[1,2,3,4,5,6]
 *  @inputCard   传数字 eg.2条的值为"2"
 *  @return 是，否/
 */
CMajiangDeYang.prototype.isWinStucMiddleCard = function(cards, inputCard) {
        var tempCards = [].concat(cards);
        if (inputCard < 10) {
            if (inputCard < 2 || inputCard > 8)
                return false;
        } else if (inputCard > 10 && inputCard < 20) {
            if (inputCard < 12 || inputCard > 18)
                return false;
        } else if (inputCard > 20 && inputCard < 30) {
            if (inputCard < 22 || inputCard > 28)
                return false;
        }
        //console.info( "inputCard: " + inputCard );
        //console.info( "tempCard1: " + tempCards.toString() );
        var index1 = tempCards.indexOf(inputCard - 1);
        if (index1 >= 0 && index1 < tempCards.length) {
            tempCards.splice(index1, 1);
        }
        //console.info( "tempCard111: " + tempCards.toString() );
        var index2 = tempCards.indexOf(inputCard + 1);
        if (index2 >= 0 && index2 < tempCards.length) {
            tempCards.splice(index2, 1);
        }
        //console.info( "tempCard2: " + tempCards.toString() );
        if (tempCards.length == 2) {
            if (tempCards[0] == tempCards[1])
                return true;
        } else {
            return this.canHu(false, tempCards, 0) == 1 ? true : false;
        }
        //if( Array.isArray(otherCards) )
        //{
        //	tempCards = tempCards.concat( otherCards );
        //}
        return false;
    }
    /**
     * 卡5星
     * 检测是否是胡的某一张 如果传5 则检测5万 5条 5筒 是否夹5 如果是返回true
     *  @cards ---一组牌!!!
     *  @return 是，否
     */
CMajiangDeYang.prototype.isKa5Xing = function(cards) {
    var tempCards = [].concat(cards);
    var lastCards = tempCards[tempCards.length - 1]; //取出最后一张牌

    //console.info( "isKa5Xing1 lastCards: " + lastCards.toString() );
    if (lastCards != 5 &&
        lastCards != 15 &&
        lastCards != 25) //最后一张必须是 5/15/25
        return false;

    tempCards.length = tempCards.length - 1; // 删除最后一张 最后一张肯定是 5/15/25 ,删除后 tempCards才符合isWinStucMiddleCard的条件


    if (this.isWinStucMiddleCard(tempCards, lastCards) == true) //砍5
        return true;

    return false;
}



/**
 * 检测是否是不包括1,9
 *  @return 是，否
 */
CMajiangDeYang.prototype.isNoInclude1or9 = function(cds, otherCards) {
    var tempArray = [].concat(cds);
    if (Array.isArray(otherCards)) {
        tempArray = tempArray.concat(otherCards);
    }
    for (var i = 0; i < tempArray.length; i++) {
        var cd = tempArray[i];
        if (cd == 1 || cd == 11 || cd == 21 || cd == 9 || cd == 19 || cd == 29)
            return false;
    }
    return true;
}




/**
 * 检测是否 姐妹对   2 2 3 3 4 4
 *  @return 是，否
 */
CMajiangDeYang.prototype.isDouble3Line = function(cds) {
        var tempCards = [].concat(cds);
        var t = {};
        for (var i = 0; i < tempCards.length - 1; i++) {
            var cd1 = tempCards[i];
            for (var j = i + 1; j < tempCards.length; j++) {
                var cd2 = tempCards[j];
                if (cd1 == cd2) {
                    t[cd1] = 1;
                    break;
                }
            }
        }
        tempCards.sort(function(a, b) { return a - b; });

        var is7 = true;
        for (var i = 0; i < tempCards.length; i += 2) {
            if (tempCards[i] != tempCards[i + 1]) {
                is7 = false;
                break;
            }
        }

        //console.info( "t_value: " + JSON.stringify( t ) );
        var t2 = Object.keys(t);
        t2.sort(function(a, b) { return a - b; });

        //console.info( "vvvvvv: " + t2.toString() );
        var tempArray = [];
        for (var i = 0; i <= t2.length - 2; i++) {
            var cd1 = parseInt(t2[i]);
            if ((cd1 == parseInt(t2[i + 1]) - 1) && (cd1 == parseInt(t2[i + 2]) - 2)) {
                tempArray.push(cd1);
            }
        }
        //console.info( "vvvvvv2222: " + tempArray.toString() );
        //console.info( "tempCards: " + tempCards.toString() );
        for (var i = 0; i < tempArray.length; i++) {
            var rmn = tempArray[i];
            var tempCards2 = [].concat(tempCards);

            var index = tempCards2.indexOf(rmn);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            index = tempCards2.indexOf(rmn);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            index = tempCards2.indexOf(rmn + 1);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            index = tempCards2.indexOf(rmn + 1);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            index = tempCards2.indexOf(rmn + 2);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            index = tempCards2.indexOf(rmn + 2);
            if (index >= 0 && index < tempCards2.length) {
                tempCards2.splice(index, 1);
            }
            //console.info( "tempCards2 complate: " + tempCards2.toString() );
            if (tempCards2.length == 2) {
                if (tempCards2[0] == tempCards2[1])
                    return true;
            } else {
                var res = this.canHu(false, tempCards2, 0);
                if (res == 1)
                    return true;
                else {
                    if (is7 && tempCards2.length == 8) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    /**
     * 检测是否 一条龙 1 2 3 4 5 6 7 8 9
     *  @return 那个牌类型
     */
CMajiangDeYang.prototype.getTypeLine1_9 = function(cds) {
        for (var t = 0; t <= 2; t++) {
            var count = 0;
            for (var j = 1; j <= 9; j++) {
                var isHave = false;
                for (var i = 0; i < cds.length; i++) {
                    var cd = cds[i];
                    //console.info( "Cd: " + cd + " current N: " + (j+t*10) );
                    if ((j + t * 10) == cd) {
                        count++;
                        //console.info( "===========" + count );
                        isHave = true;
                        break;
                    }
                }
                if (isHave == false)
                    break;
            }
            if (count == 9) return t;
        }
        return -1;
    }
    /**
     * 检测是否 一条龙 1 2 3 4 5 6 7 8 9 xxx|x1x2x3 yy
     *  @return 是，否
     */
CMajiangDeYang.prototype.is9Line = function(cds) {
    var tempCards = [].concat(cds);
    var lineType9 = this.getTypeLine1_9(tempCards);
    //console.info("is9Line "+ lineType9 );
    if (lineType9 == -1) return false;

    //console.info( "tempCards1: " + tempCards.toString() );
    for (var i = 1; i <= 9; i++) {
        //console.info( "pos: " + tempCards.indexOf( i + 10* lineType9 ) );
        var index = tempCards.indexOf(i + lineType9 * 10);
        if (index >= 0 && index < tempCards.length) {
            tempCards.splice(index, 1);
        }
    }
    //console.info( "tempCards2: " + tempCards.toString() );
    if (tempCards.length == 2) {
        if (tempCards[0] == tempCards[1])
            return true;
    } else {
        var res = this.canHu(false, tempCards, 0);
        return res == 1 ? true : false;
    }
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
CMajiangDeYang.prototype.computeBaseWin = function(pi, withDesc, tData, isCha, genArr) {
    var baseWin = require("./CMajiangBase.js").prototype.computeBaseWin.call(this, pi, withDesc, tData, isCha, genArr);

    this.GLog("wcx5:MJHu computeBaseWin =pi.uid=" + pi.uid + " withDesc=" + withDesc);
    var cds = pi.mjhand;
    var otherCards = [].concat(pi.mjchi, pi.mjpeng, pi.mjgang0, pi.mjgang1);
    if (this.isKa5Xing(cds) == true) //砍5
    {
        baseWin *= 2;
        if (withDesc) {
            //this.GLog("wcx5:MJHu computeBaseWin =夹心五 "  );
            pi.mjdesc.push("夹心五");

        } else {
            //this.GLog("wcx5:MJHu computeBaseWin =夹心五 else"  );
            //pi.mjdesc.push("夹心五pp");
        }

    }
    if (this.isDouble3Line(cds) == true) //姊妹对
    {
        baseWin *= 2;
        if (withDesc) {
            //this.GLog("wcx5:MJHu computeBaseWin =姊妹对"  );
            pi.mjdesc.push("姊妹对");
        } else {
            //this.GLog("wcx5:MJHu computeBaseWin =姊妹对 else"  );
            //pi.mjdesc.push("姊妹对pp");
        }

    }
    if (this.isNoInclude1or9(cds, otherCards) == true) //断幺九
    {
        baseWin *= 2;
        if (withDesc) {
            //this.GLog("wcx5:MJHu computeBaseWin =断幺九"  );
            pi.mjdesc.push("断幺九");
        } else {
            //this.GLog("wcx5:MJHu computeBaseWin =断幺九 else"  );
            //pi.mjdesc.push("断幺九pp");
        }

    }
    if (this.is9Line(cds) == true) {
        baseWin *= 2;
        if (withDesc) {
            //this.GLog("wcx5:MJHu computeBaseWin =一条龙"  );
            pi.mjdesc.push("一条龙");
        } else {
            //this.GLog("wcx5:MJHu computeBaseWin =一条龙  else"  );
            //pi.mjdesc.push("一条龙pp");
        }

    }

    //this.GLog("wcx5:MJHu computeBaseWin =pi.uid=" + pi.uid  + " baseWin=" + baseWin + " pi.mjdesc=" + JSON.stringify(pi.mjdesc));
    return baseWin;
}

module.exports = CMajiangDeYang;