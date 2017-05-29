//**************************************
//算法类 处理麻将核心算法---麻将基础算法类 majiang
//create by huyan
//
function CMajingBase() {
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
    //13幺牌型
    this.s13 = [1, 9, 11, 19, 21, 29, 31, 41, 51, 61, 71, 81, 91]; //1筒（饼）、9筒（饼）、1条（索）、9条（索）、1万、9万、东、南、西、北、中、发、白
    this.all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29];
    //console.info("CMajingBase");
}

/**
 * 继承方法
 */
function g_Inherit(superType, subType) {
    var _prototype = Object.create(superType.prototype);
    _prototype.constructor = subType;
    subType.prototype = _prototype;
}

var MJPAI_HUNMAX = 4;
var needMinHunNum = MJPAI_HUNMAX;
//var iMyGLog = this.GLog;
//iMyGLog = console.info;
// 	var mjcardsWithTwoCardHouse=[
// 1,2,3,4,5,6,7,8,9,
// 1,2,3,4,5,6,7,8,9,
// 1,2,3,4,5,6,7,8,9,//条
// 1,2,3,4,5,6,7,8,9,

// // 11,12,13,14,15,16,17,18,19,
// // 11,12,13,14,15,16,17,18,19,
// // 11,12,13,14,15,16,17,18,19,//万
// // 11,12,13,14,15,16,17,18,19,

// 21,22,23,24,25,26,27,28,29,
// 21,22,23,24,25,26,27,28,29,
// 21,22,23,24,25,26,27,28,29,//筒
// 21,22,23,24,25,26,27,28,29,


// 31,41,51,61,71,81,91,
// 31,41,51,61,71,81,91,
// 31,41,51,61,71,81,91,
// 31,41,51,61,71,81,91
// ]

//13要牌型
// var s13=[1,9,11,19,21,29,31,41,51,61,71,81,91];
//
//var all=[1,2,3,4,5,6,7,8,9,11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29];
//计算连牌
function canLink(a, b) {
    return (a + 1 == b || a == b);
}


// var testCds=
// [
// [1,2,3,4,5,6,7,8,9,11,12,13,14,
// 29,29,29,23,23,23,16,15,14,11,11,12,13,
// 22,27,25,19,21,19,17,15,13,11,9,7,5,
// 22,27,25,19,21,19,17,15,13,11,9,7,5,
// 29,23,28,28,28,26,26,26,26,24,24,24]//双杠 杠后炮
// ];


/*
 *洗牌
 *@withWind true有风 ,flase 无风
 */
CMajingBase.prototype.randomCards = function(withWind) {
        var rtn = [];
        rtn.length = withWind ? this.mjcards.length : (this.mjcards.length - 28); //length

        for (var i = 0; i < rtn.length; i++) //先拷贝进去
            rtn[i] = this.mjcards[i];

        for (var i = 0; i < rtn.length; i++) //随机 交换 牌
        {
            var ci = rtn[i];
            var j = Math.floor(Math.random() * rtn.length);
            rtn[i] = rtn[j];
            rtn[j] = ci;
        }
        return rtn;
    }
    //
    // //两牌房洗牌
    // CMajingBase.prototype.randomCardsWithTwoCardHouse=function(withWind)
    // {

// 	var rtn=[]; rtn.length=withWind?this.mjcardsWithTwoCardHouse.length:(this.mjcardsWithTwoCardHouse.length-28);
// 	for(var i=0;i<rtn.length;i++) rtn[i]=this.mjcardsWithTwoCardHouse[i];
// 	for(var i=0;i<rtn.length;i++)
// 	{
// 		var ci=rtn[i];
// 		var j=Math.floor( Math.random() *  rtn.length );
// 		rtn[i]=rtn[j];
// 		rtn[j]=ci;
// 	}
// 	return rtn;
// }
//

/**
 * 检测6连牌()
 * @cds 手牌
 * @i 牌索引---是下标吗?
 */
function canMath6(cds, i) {
    if (i + 5 >= cds.length) return 0;
    var pat = [
        [0, 0, 1, 1, 2, 2],
        [0, 1, 1, 2, 2, 3],
        [0, 1, 1, 1, 1, 2]
    ];
    for (var j = 0; j < pat.length; j++) {
        var pj = pat[j];
        for (var k = 0; k < pj.length; k++) {
            if (pj[k] + cds[i] != cds[k + i]) break;
            if (k == pj.length - 1) {
                if (j == 0) {
                    if (cds[i] % 10 == 1) return 2;
                    if (cds[k + i] % 10 == 9) return 2;
                }
                return 1;
            }
        }
    }
    return 0;
}
/**
 * 检测9连牌
 * @cds 手牌
 * @i 牌索引---返回 2是个什么 鬼 1.那就是true喽
 */
function canMath9(cds, i) {
    if (i + 8 >= cds.length) return 0;
    var pat = [
        [0, 0, 0, 1, 1, 1, 2, 2, 2],
        [0, 1, 1, 2, 2, 2, 3, 3, 4],
        [0, 1, 1, 1, 2, 2, 2, 3, 3],
        [0, 0, 1, 1, 1, 2, 2, 2, 3]
    ];
    for (var j = 0; j < pat.length; j++) {
        var pj = pat[j];
        for (var k = 0; k < pj.length; k++) {
            if (pj[k] + cds[i] != cds[k + i]) break;
            if (k == pj.length - 1) {
                if (j == 0) {
                    if (cds[i] % 10 == 1) return 2;
                    if (cds[i + 8] % 10 == 9) return 2;
                }
                return 1;
            }
        }
    }
    return 0;
}
/**
 * 检测3连牌
 * @cds 手牌
 * @i 牌索引
 * @返回值---返回 2是个什么 鬼 1.那就是true喽
 */
function canMath3(cds, i) {
    if (i + 2 >= cds.length)
        return 0;


    var match3 = 0;
    var pat = [
        [0, 0, 0],
        [0, 1, 2]
    ];

    for (var j = 0; j < pat.length; j++) //pat.length=2
    {
        var pj = pat[j];
        for (var k = 0; k < pj.length; k++) //pj.length=3
        {
            if (pj[k] + cds[i] != cds[k + i])
                break;


            if (k == pj.length - 1) {
                if (match3 == 0)
                    match3++;

                if (j == 0 &&
                    (cds[k + i] % 10 == 1 || cds[k + i] % 10 == 9)) //[0,0,0]-----返回 2是个什么 鬼
                {
                    return 2;
                } else if (j == 1 &&
                    (cds[k + i - 2] % 10 == 1 || cds[k + i] % 10 == 9)) //[0,1,2]
                {
                    return 2;
                }
            }
        }
    }
    return match3;
}
/**
 * 检测12连牌
 * @cds 手牌
 * @i 牌索引
 */
function canMath12(cds, i) {
    if (i + 11 >= cds.length) return false;
    //var pat=[[0,1,1,2,2,2,3,3,3,4,4,5]];
    //振雷曰:"兴泰算法"
    var pat = [
        [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5],
        [0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4],
        [0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 4],
        [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4] //add by mrhu
    ];
    for (var j = 0; j < pat.length; j++) {
        var pj = pat[j];
        for (var k = 0; k < pj.length; k++) {
            if (pj[k] + cds[i] != cds[k + i]) break;
            if (k == pj.length - 1) return true;
        }
    }
    return false;
}
/**
 * @pi 调去该函数玩家
 * @withDesc 带不带描述
 * @tData 牌桌数据　
 * @isCha 是否大叫
 * @genArr 跟的数组
 * @return
 */
CMajingBase.prototype.computeBaseWin = function(pi, withDesc, tData, isCha, genArr) {

        //this.GLog("MajingBase.prototype.computeBaseWin-------------------------------begin");
        //this.GLog("MajingBase.prototype.computeBaseWin pi.uid=" + pi.uid + "isCha=" + isCha );
        //this.GLog("MajingBase.prototype.computeBaseWin withDesc=" + JSON.stringify(withDesc) );

        //是否7小队胡法
        var num2 = pi.huType == 7 ? 1 : 0;

        //是否龙7对
        if (num2 == 1 &&
            this.canGang1([], pi.mjhand).length > 0) {
            num2 = 2;
        }


        //是否大对碰
        var num3 = num2 > 0 ? 0 : this.All3(pi);
        var sameColor = this.SameColor(pi, tData);
        var all19 = this.all19(pi);

        var baseWin = 1;
        if (num3 == 1) {
            baseWin *= 2;
            if (withDesc) pi.mjdesc.push("对对胡");
        } else if (num3 == 2 && tData.yaojiu) {
            baseWin *= 8;
            if (withDesc) pi.mjdesc.push("将对");
        } else if (num3 == 2 && (!tData.yaojiu)) {
            baseWin *= 2;
            if (withDesc) pi.mjdesc.push("对对胡");
        }
        if (sameColor) //清一色
        {
            baseWin *= 4;
            if (withDesc) pi.mjdesc.push("清一色");
        }
        if (num2 > 0) {
            baseWin *= num2 > 1 ? 8 : 4;
            if (withDesc) pi.mjdesc.push(num2 > 1 ? "龙七对" : "七巧对");
        }
        if (all19 && tData.yaojiu) {
            baseWin *= 4;
            if (withDesc) pi.mjdesc.push("带幺九");
        }

        if (pi.mjhand.length == 2 && (!isCha)) {
            baseWin *= 2;
            if (withDesc) pi.mjdesc.push("金钩胡");
        } else if (pi.mjhand.length == 1 && (!isCha)) { //血流成河，最后一张牌没有放到mjhand。
            baseWin *= 2;
            if (withDesc) pi.mjdesc.push("金钩胡");
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
        if (num2 > 1) have4--;

        //this.GLog("MajingBase.prototype.computeBaseWin pi.uid=" + pi.uid + " pi.zhuanyuFrom="+ JSON.stringify(pi.zhuanyuFrom));
        if (tData.zhuanyu && tData.zhuanGen) {
            function count(o) {
                var t = typeof o;
                if (t == 'string') {
                    return o.length;
                } else if (t == 'object') {
                    var n = 0;
                    for (var i in o) {
                        n++;
                    }
                    return n;
                }
                return false;
            }

            var iaddZhuanyuFrom = count(pi.zhuanyuFrom);
            //this.GLog("MajingBase.prototype.computeBaseWin iaddZhuanyuFrom=" + iaddZhuanyuFrom);

            if (iaddZhuanyuFrom > 0) {
                have4 += iaddZhuanyuFrom;
            }
        }

        if (have4 > 0) {
            if (withDesc) pi.mjdesc.push("根X" + have4);
            for (var i = 0; i < have4; i++) baseWin *= 2;
            genArr.push(have4);
        }

        //this.GLog("MajingBase.prototype.computeBaseWin baseWin=" +baseWin);
        //this.GLog("MajingBase.prototype.computeBaseWin-------------------------------end");

        return baseWin;
    }
    /**
     * 是否只胡一张牌
     * @return 是否
     */
CMajingBase.prototype.canOnlyOneCardHu = function(pl, tData, card) {
        var mjhand = pl.mjhand.slice(0);
        var tryCard = {};
        for (var i = 0; i < mjhand.length; i++) {
            var cd = mjhand[i];
            for (var j = -1; j <= 1; j++) {
                var cj = cd + j;
                if (cj >= 1 && cj <= 9 || cj >= 11 && cj <= 19 || cj >= 21 && cj <= 29) {

                    tryCard[cj] = cj;
                }
            }
        }
        var maxWin = 0;
        mjhand.push(0);
        var oldBloodDes = pl.mjdesc.slice(0);
        for (var cd in tryCard) {
            var lastCD = mjhand[mjhand.length - 1];
            var cdi = tryCard[cd];
            mjhand[mjhand.length - 1] = cdi;
            var huType = this.canHu(false, mjhand);
            if (huType > 0) {
                var oldDesc = pl.mjdesc;
                pl.mjdesc = [];
                pl.huType = huType;
                //var isCha = tData.blood;
                //看看是否胡这一张牌
                if (cdi != card) {
                    return false;
                }
            } else {
                // if(tData.blood)
                // {
                // 	pl.mjdesc=[];
                // }
                mjhand[mjhand.length - 1] = lastCD;
            }
        }
        return true;
    }
    /**
     * 查大叫
     * @return 查大叫返的分数
     */
CMajingBase.prototype.missHandMax = function(pl, tData, _notdesc) {
    //pl.mjchi; pl.mjpeng; pl.mjgang0; pl.mjgang1; 	pl.mjhand;
    /*
    var cardNum={};
    var cards=[pl.mjhand,pl.mjchi,pl.mjpeng,pl.mjgang0,pl.mjgang1];
    for(var c=0;c<cards.length;c++)
    {
    	var cds=cards[c];
    	for(var i=0;i<cds.length;i++) 
    	{
    		var cd=cds[i];
    		var cNum=cardNum[cd];
    		if(!cNum) cNum=0;
    		if(c<2)	cNum+=1;
    		else if(c==2) cNum+=3;
    		else cNum+=4;
    		cardNum[cd]=cNum;
    	}
    }
    */

    var desc = false;
    if (null == _notdesc || typeof(_notdesc) == "undefined") {
        desc = true;
    }

    //
    if (this.CardCount(pl) >= 14) //如果手里牌的张数 >=14 就不能再执行该函数
    {
        return pl.baseWin;
    }
    var iMissNum = 0;
    if (!tData.noBigWin) {
        iMissNum = this.cardTypeNum(pl.mjhand, pl.mjMiss); //计算用户手中缺的数量
    }

    var mjhand = pl.mjhand;
    var tryCard = {};
    for (var i = 0; i < mjhand.length; i++) {
        var cd = mjhand[i];
        for (var j = -1; j <= 1; j++) {
            var cj = cd + j;
            if (cj >= 1 && cj <= 9 || cj >= 11 && cj <= 19 || cj >= 21 && cj <= 29) {
                /*
                var cNum=cardNum[cj];
                if(!cNum) cNum=0;
                if(cNum<4) */

                tryCard[cj] = cj;
            }
        }
    }
    var maxWin = 0;
    mjhand.push(0);
    var oldBloodDes = pl.mjdesc.slice(0);
    for (var cd in tryCard) {
        var lastCD = mjhand[mjhand.length - 1];
        var cdi = tryCard[cd];
        mjhand[mjhand.length - 1] = cdi;
        var huType = 0;
        if (!tData.noBigWin) {
            if (iMissNum <= 0) {
                huType = this.canHu(false, mjhand);
            }
        } else {
            huType = this.canHu(false, mjhand);
        }

        //this.GLog("tryCard "+cdi+" "+huType);
        if (huType > 0) {
            var oldDesc = pl.mjdesc;
            pl.mjdesc = [];
            pl.huType = huType;
            var isCha = tData.blood;
            var winNum = this.computeBaseWin(pl, desc, tData, isCha, []);
            if (winNum > maxWin) {
                maxWin = winNum;
            } else {
                pl.mjdesc = oldDesc;
                mjhand[mjhand.length - 1] = lastCD;
            }
        } else {
            if (tData.blood) {
                pl.mjdesc = [];
            }
            mjhand[mjhand.length - 1] = lastCD;
        }
    }
    if (tData.blood) {
        if (pl.mjdesc.length > 0) {
            for (var i = 0; i < pl.mjdesc.length; i++) {
                oldBloodDes.push(pl.mjdesc[i]);
            }
            pl.mjdesc = oldBloodDes;
        } else {
            pl.mjdesc = oldBloodDes;
        }
    }

    if (maxWin == 0) mjhand.length = mjhand.length - 1;

    //this.GLog("MajingBase_missHandMax maxWin=" + maxWin + " pl.uid=" + pl.uid);
    return maxWin;
}



function isTiao(card) {
    if (card >= 1 && card <= 9) {
        return true;
    }
    return false;
}

function isTong(card) {
    if (card >= 21 && card <= 29) {
        return true;
    }
    return false;
}

function isWan(card) {
    if (card >= 11 && card <= 19) {
        return true;
    }
    return false;
}

function isFeng(card) {
    if (card >= 31 && card <= 91) {
        return true;
    }
    return false;
}

function isWind(card) {
    if (card >= 31 && card <= 91) {
        return true;
    }
    return false;
}

/*返回 cd在 cds中的个数
 * */
CMajingBase.prototype.isHaveCardNum = function(cds, cd) {
    var count = 0;
    for (var i = 0; i < cds.length; i++) {
        if (cds[i] == cd) {
            count++;
        }
    }
    return count;
}

function is4YaoJi(cds, cd) {
    var tmp = [];
    for (var i = 0; i < cds.length; i++) tmp.push(cds[i]);
    if (cd) tmp.push(cd);
    cds = tmp;
    cds.sort(function(a, b) {
        return a - b
    });
    var count = 0;
    for (var i = 0; i < cds.length; i++) {
        if (cds[i] == 1) {
            count++;
        }
    }
    if (count == 4) return true;
    return false;
}



/*
 *是否是 幺鸡
 */
CMajingBase.prototype.getYaoJi = function() {
    return 1;
}

/*
 *是否是 幺鸡
 */
CMajingBase.prototype.isHun = function(card) {
    if (card == 1) {
        return true;
    }
    return false;
}

CMajingBase.prototype.isEqualHunCard = function(card) {
    if (card == 1) return true;
    return false;
}

//13幺 canhu法
CMajingBase.prototype.canHuForShiSanYaoNew = function(cardss) {
    if (cardss.length != 14) return false;
    var other = [2, 3, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 17, 18, 22, 23, 24, 25, 26, 27, 28];
    var rtn = []; //除去鬼牌 保存构成 13 幺的部分牌
    for (var i = 0; i < cardss.length; i++) {
        if (this.isEqualHunCard(cardss[i])) //去掉鬼牌
        {
            continue;
        }
        for (var j = 0; j < other.length; j++) //除了13幺还有其他牌
        {
            if (cardss.indexOf(other[j]) != -1) return false;
        }
        rtn.push(cardss[i]);
    }
    var yiTiaoCounts = 0;
    var jiuTiaoCounts = 0;
    var yiWanCounts = 0;
    var jiuWanCounts = 0;
    var yiTongCounts = 0;
    var jiuTongCounts = 0;
    var dongCounts = 0;
    var nanCounts = 0;
    var xiCounts = 0;
    var beiCounts = 0;
    var zhongCounts = 0;
    var faCounts = 0;
    var baiCounts = 0;
    for (var i = 0; i < rtn.length; i++) {
        if (rtn[i] == 1) yiTiaoCounts++;
        if (rtn[i] == 9) jiuTiaoCounts++;
        if (rtn[i] == 11) yiWanCounts++;
        if (rtn[i] == 19) jiuWanCounts++;
        if (rtn[i] == 21) yiTongCounts++;
        if (rtn[i] == 29) jiuTongCounts++;
        if (rtn[i] == 31) dongCounts++;
        if (rtn[i] == 41) nanCounts++;
        if (rtn[i] == 51) xiCounts++;
        if (rtn[i] == 61) beiCounts++;
        if (rtn[i] == 71) zhongCounts++;
        if (rtn[i] == 81) faCounts++;
        if (rtn[i] == 91) baiCounts++;
    }
    if (yiTiaoCounts > 2 || jiuTiaoCounts > 2 || yiWanCounts > 2 || jiuWanCounts > 2 || yiTongCounts > 2 || jiuTongCounts > 2 || dongCounts > 2 || nanCounts > 2 || xiCounts > 2 || beiCounts > 2 || zhongCounts > 2 || faCounts > 2 || baiCounts > 2) return false;
    //1条
    if (yiTiaoCounts >= 2 && (jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //9条
    if (jiuTiaoCounts >= 2 && (yiTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //1万
    if (yiWanCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //9万
    if (jiuWanCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //1桶
    if (yiTongCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //9桶
    if (jiuTongCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //东
    if (dongCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //南
    if (nanCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //西
    if (xiCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //北
    if (beiCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //中
    if (zhongCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || faCounts >= 2 || baiCounts >= 2)) return false;
    //发
    if (faCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || baiCounts >= 2)) return false;
    //白
    if (baiCounts >= 2 && (yiTiaoCounts >= 2 || jiuTiaoCounts >= 2 || yiWanCounts >= 2 || jiuWanCounts >= 2 || yiTongCounts >= 2 || jiuTongCounts >= 2 || dongCounts >= 2 || nanCounts >= 2 || xiCounts >= 2 || beiCounts >= 2 || zhongCounts >= 2 || faCounts >= 2)) return false;

    return true;
}


function canMatchSeq(seg) {
    var matchOK = true;
    for (var m = 0; m < seg.length;) {
        if (canMath12(seg, m)) m += 12;
        else if (canMath9(seg, m)) m += 9;
        else if (canMath6(seg, m)) m += 6;
        else if (canMath3(seg, m)) m += 3;
        else {
            matchOK = false;
            break;
        }
    }
    return matchOK;
}


function isCard258(card) {
    switch (card) {
        case 2:
        case 12:
        case 22:
        case 5:
        case 15:
        case 25:
        case 8:
        case 18:
        case 28:
            return true;
    }
    return false;
}


CMajingBase.prototype.calNeedHunNumToBePu = function(typeVec, needNum) {
    ////this.GLog("__ MJBase:calNeedHunNumToBePu______________ begin");
    ////this.GLog("__ MJBase:calNeedHunNumToBePu typeVec=" + typeVec + " needNum=" + needNum);
    var p1, p2, p3;
    if (needMinHunNum == 0) {
        ////this.GLog("__ MJBase:calNeedHunNumToBePu (needMinHunNum == 0) is true ->return ");
        return;
    }

    if (needNum >= needMinHunNum) {
        ////this.GLog("__ MJBase:calNeedHunNumToBePu (needMinHunNum == 0) is true ->return ");
        return;
    }


    var vSize = typeVec.length;
    ////this.GLog("__ MJBase:calNeedHunNumToBePu typeVec.length=" + typeVec.length);
    if (vSize == 0) {
        needMinHunNum = needNum > needMinHunNum ? needMinHunNum : needNum;
        ////this.GLog("__ MJBase:calNeedHunNumToBePu 1111 ->return " + " typeVec=" + typeVec);
        return;
    } else if (vSize == 1) {
        needMinHunNum = (needNum + 2) > needMinHunNum ? needMinHunNum : (needNum + 2);
        ////this.GLog("__ MJBase:calNeedHunNumToBePu 2222 ->return " + " typeVec=" + typeVec);
        return;
    } else if (vSize == 2) {
        p1 = typeVec[0];
        p2 = typeVec[1];

        if (p2 - p1 < 3) {
            needMinHunNum = (needNum + 1) > needMinHunNum ? needMinHunNum : (needNum + 1);
        }
        ////this.GLog("__ MJBase:calNeedHunNumToBePu 3333 ->return " + " typeVec=" + typeVec);
        return;
    }
    //大于等于3张牌
    p1 = typeVec[0];
    p2 = typeVec[1];
    p3 = typeVec[2];
    var k2 = 1;
    var k3 = 2;

    //第一个自己一扑
    if (needNum + 2 < needMinHunNum) {
        typeVec.splice(0, 1);
        this.calNeedHunNumToBePu(typeVec, needNum + 2);
        typeVec.splice(0, 0, p1);
    }
    //第一个跟其它的一个一扑
    if (needNum + 1 < needMinHunNum) {
        for (var i = 1; i < typeVec.length; i++) {
            if (needNum + 1 >= needMinHunNum) break;
            p2 = typeVec[i];
            k2 = i;
            //455567这里可结合的可能为 45 46 否则是45 45 45 46
            //如果当前的value不等于下一个value则和下一个结合避免重复
            if (i + 1 != typeVec.length) {
                p3 = typeVec[i + 1];
                k3 = i + 1;
                if (p3 == p2) continue;
            }
            if (p2 - p1 < 3) {
                typeVec.splice(0, 1);
                typeVec.splice(k2 - 1, 1);

                this.calNeedHunNumToBePu(typeVec, needNum + 1);

                typeVec.splice(k2 - 1, 0, p2);
                typeVec.splice(0, 0, p1);
            } else break;
        }

    }
    //第一个和其它两个一扑
    //后面间隔两张张不跟前面一张相同222234
    //可能性为222 234
    for (var ii = 1; ii < typeVec.length; ii++) {
        if (needNum >= needMinHunNum) break;
        p2 = typeVec[ii];
        k2 = ii;
        if (ii + 2 < typeVec.length) {
            if (typeVec[ii + 2] == p2) continue;
        }
        for (var j = ii + 1; j < typeVec.length; j++) {
            if (needNum >= needMinHunNum) break;
            p3 = typeVec[j];
            k3 = j;

            if (p1 == p3) {}
            if (j + 1 < typeVec.length) {
                if (p3 == typeVec[j + 1]) continue;
            }

            var tempSeg = [p1, p2, p3];
            if (canMatchSeq(tempSeg)) {
                typeVec.splice(0, 1);
                typeVec.splice(k2 - 1, 1);
                typeVec.splice(k3 - 2, 1);

                this.calNeedHunNumToBePu(typeVec, needNum);
                typeVec.splice(k3 - 2, 0, p3);
                typeVec.splice(k2 - 1, 0, p2);
                typeVec.splice(0, 0, p1);
            }
            //4556
        }
    }

    ////this.GLog("__ MJBase:calNeedHunNumToBePu______________ end " + "typeVec=" + typeVec);
}

CMajingBase.prototype.isCanHunHu = function(hunNum, m_HuPaiVec, with258) {

    //this.GLog("__ MJBase:isCanHunHu_________________ begin");
    //this.GLog("__ MJBase:isCanHunHu hunNum="+hunNum + " m_HuPaiVec=" + m_HuPaiVec + " with258=" + with258);

    var huSize = m_HuPaiVec.length;
    if (huSize <= 0) {
        if (hunNum >= 2) {
            //this.GLog("__ MJBase:isCanHunHu 'if (hunNum >= 2)' true end");
            return true;
        } else {
            return false;
        }
    }
    var firstPai = m_HuPaiVec[0];
    var huPaiCopy = [];
    for (var i = 0; i < m_HuPaiVec.length; i++) {
        huPaiCopy.push(m_HuPaiVec[i]);
    }
    for (var it = 0; it < huPaiCopy.length; it++) {
        if (it == huPaiCopy.length - 1) {
            if (hunNum > 0) {
                hunNum = hunNum - 1;
                var pairCard = huPaiCopy[it];
                m_HuPaiVec.splice(it, 1);
                needMinHunNum = MJPAI_HUNMAX;
                this.calNeedHunNumToBePu(m_HuPaiVec, 0);
                if (needMinHunNum <= hunNum) {
                    //this.GLog("__ MJBase:isCanHunHu '1111' true end");
                    return true;
                }
                hunNum = hunNum + 1;
                m_HuPaiVec.splice(it, 0, pairCard);
            }
        } else {
            if ((it + 2 == huPaiCopy.length) || (huPaiCopy[it] != huPaiCopy[it + 2])) {
                if (huPaiCopy[it] == huPaiCopy[it + 1]) {
                    var pair1 = m_HuPaiVec[it];
                    var pair2 = m_HuPaiVec[it + 1];
                    m_HuPaiVec.splice(it, 1);
                    m_HuPaiVec.splice(it, 1);

                    needMinHunNum = MJPAI_HUNMAX;
                    this.calNeedHunNumToBePu(m_HuPaiVec, 0);
                    if (needMinHunNum <= hunNum) {
                        //this.GLog("__ MJBase:isCanHunHu '2222' true end");
                        return true;
                    }
                    m_HuPaiVec.splice(it, 0, pair2);
                    m_HuPaiVec.splice(it, 0, pair1);
                }
            }
            if (hunNum > 0 && (huPaiCopy[it] != huPaiCopy[it + 1])) {
                hunNum = hunNum - 1;
                var pair3 = m_HuPaiVec[it];
                m_HuPaiVec.splice(it, 1);
                needMinHunNum = MJPAI_HUNMAX;
                this.calNeedHunNumToBePu(m_HuPaiVec, 0);
                if (needMinHunNum <= hunNum) {
                    //this.GLog("__ MJBase:isCanHunHu '3333' true end");
                    return true;
                }
                hunNum = hunNum + 1;
                m_HuPaiVec.splice(it, 0, pair3);
            }
        }
    }

    //this.GLog("__ MJBase:isCanHunHu_________________ false end");
    return false;
}

CMajingBase.prototype.can_7_Hu = function(cds, cd, with258, withHun) {
        //this.GLog("__ MJBase:can_7_Hu___________________________________ begin");
        var tmp = [];
        for (var i = 0; i < cds.length; i++) tmp.push(cds[i]);
        if (cd) tmp.push(cd);
        cds = tmp;
        cds.sort(function(a, b) {
            return a - b
        });

        if (cds.length != 14) {

            //this.GLog("__ MJBase:can_7_Hu 'if (cds.length != 14) {'  return false");

            return false;
        }
        var oddCards = [];
        var pairs = [];
        var hunCards = [];
        var isodd258 = false;
        var ispair258 = false;
        for (i = 0; i < cds.length; i++) {
            if (withHun) {
                if (this.isHun(cds[i])) {
                    hunCards.push(cds[i]);
                    continue;
                }
            }
            if (i == cds.length - 1) {
                oddCards.push(cds[i]);
            } else if (cds[i] != cds[i + 1]) {
                oddCards.push(cds[i]);
                if (with258 && isCard258(cds[i])) {
                    isodd258 = true;
                }
            } else {
                if (with258 && isCard258(cds[i])) {
                    ispair258 = true;
                }
                pairs.push(cds[i]);
                i++;
            }
        }
        if (oddCards.length > 0) { //有单牌
            if (withHun) {
                if (hunCards.length == oddCards.length) { //单牌数==红中数
                    if (with258 && (ispair258 || isodd258)) {
                        //this.GLog("__ MJBase:can_7_Hu   return true 1111");
                        return true;
                    } else {
                        //this.GLog("__ MJBase:can_7_Hu   return true 2222");
                        return true;
                    }
                }
                if (oddCards.length < hunCards.length && hunCards.length == 3) {
                    if (with258 && (ispair258 || isodd258)) {
                        //this.GLog("__ MJBase:can_7_Hu   return true 3333");
                        return true;
                    } else {

                        //this.GLog("__ MJBase:can_7_Hu   return true 4444");
                        return true;
                    }

                }
                if (hunCards.length > oddCards.length && hunCards.length > 0 && oddCards.length > 0) {
                    if ((hunCards.length - oddCards.length) % 2 == 0) {
                        //this.GLog("__ MJBase:can_7_Hu   return true 5555");
                        return true;
                    }

                }
            }
        } else {
            if (hunCards.length == 2 || hunCards.length == 4 || hunCards.length == 6 || hunCards.length == 8) {
                //this.GLog("__ MJBase:can_7_Hu   return true 6666");
                return true;
            } else {
                //this.GLog("__ MJBase:can_7_Hu   return true 8888");
                return true;
            }
        }

        //this.GLog("__ MJBase:can_7_Hu___________________________________ end");
        return false;
    }
    /* 幺鸡 胡法
     * @no7 有没有7小对(应该是没有7小对) true:没有7小对, false有7小对
     * @cds 手里的牌
     * @cd 点炮牌
     * @with258 一直为false,一种玩法,现在用不到
     * @withHun 哪个当(癞子) --true 就是 幺鸡(1)
     * @gui4Hu 4张(癞子)直接胡,
     * */
CMajingBase.prototype.canHunHuNew = function(no7, cds, cd, with258, withHun, gui4Hu) {
        ////this.GLog("__ MJBase:canHunHuNew___________________________________ begin");
        ////this.GLog("__ MJBase:canHunHuNew no7=" + no7 + " cds=" + cds + " cd=" + cd + " withHun=" + withHun + " gui4Hu="+gui4Hu);
        var cardType = { //分牌类型
            tiao: 0,
            wan: 1,
            tong: 2,
            feng: 3,
            hun: 4
        };


        var cdsss = cds;

        //分牌，按类型：条，筒，万，红中，1,2,3,5
        //1.初始化
        var allCards = [];
        allCards[cardType.tiao] = [];
        allCards[cardType.tong] = [];
        allCards[cardType.wan] = [];
        allCards[cardType.feng] = []; // 暂时没用到
        allCards[cardType.hun] = [];
        var tmp = [];
        for (var i = 0; i < cds.length; i++) {
            tmp.push(cds[i]);
        }
        if (cd) {
            tmp.push(cd);
        }
        cds = tmp;
        //if(this.canHuForShiSanYaoNew(tmp)) return 13; //有鬼 胡13幺的 算法 //del by wcx 20161206 四川没有 13幺玩法
        cds.sort(function(a, b) {
            return a - b
        });
        for (i = 0; i < cds.length; i++) {
            if (this.isHun(cds[i])) { //判断是否是 1
                allCards[cardType.hun].push(cds[i]);
            } else if (isTiao(cds[i])) {
                allCards[cardType.tiao].push(cds[i]);
            } else if (isTong(cds[i])) {
                allCards[cardType.tong].push(cds[i]);
            } else if (isWan(cds[i])) {
                allCards[cardType.wan].push(cds[i]);
            } else if (isWind(cds[i])) {
                allCards[cardType.feng].push(cds[i]);
            }
        }
        var needHunNum = 0;
        var jiangNeedNum = 0;
        needMinHunNum = MJPAI_HUNMAX;
        this.calNeedHunNumToBePu(allCards[cardType.wan], 0);
        var wanToPuNeedNum = needMinHunNum;

        needMinHunNum = MJPAI_HUNMAX;
        this.calNeedHunNumToBePu(allCards[cardType.tong], 0);
        var tongToPuNeedNum = needMinHunNum;

        needMinHunNum = MJPAI_HUNMAX;
        this.calNeedHunNumToBePu(allCards[cardType.tiao], 0);
        var tiaoToPuNeedNum = needMinHunNum;

        //暂不支持风
        needMinHunNum = MJPAI_HUNMAX;
        this.calNeedHunNumToBePu(allCards[cardType.feng], 0);
        var fengToPuNeedNum = 0; //needMinHunNum;

        var hasNum = 0;
        var vecSize = 0;
        var isHu = false;
        var isHu1 = false;
        var isHu2 = false;
        var isHu3 = false;
        curHunNum = allCards[cardType.hun].length;
        ////this.GLog("__ curHunNum:"+curHunNum + "__ tongToPuNeedNum:"+tongToPuNeedNum + "__ tiaoToPuNeedNum:"+tiaoToPuNeedNum + "__ wanToPuNeedNum:"+wanToPuNeedNum);

        //将在万中
        //如果需要的混小于等于当前的则计算将在将在万中需要的混的个数
        needHunNum = tongToPuNeedNum + tiaoToPuNeedNum + fengToPuNeedNum;
        ////this.GLog("__ needHunNum:" + needHunNum);
        if (needHunNum <= curHunNum) {
            vecSize = allCards[cardType.wan].length;
            hasNum = curHunNum - needHunNum;
            isHu = this.isCanHunHu(hasNum, allCards[cardType.wan], with258);
            ////this.GLog("__ MJBase:canHunHuNew wan 胡了没="+isHu);
        }
        //将在饼中
        needHunNum = wanToPuNeedNum + tiaoToPuNeedNum + fengToPuNeedNum;
        if (needHunNum <= curHunNum) {
            vecSize = allCards[cardType.tong].length;
            hasNum = curHunNum - needHunNum;
            isHu1 = this.isCanHunHu(hasNum, allCards[cardType.tong], with258);
            ////this.GLog("__ MJBase:canHunHuNew tong 胡了没="+isHu);
        }
        //将在条中
        needHunNum = wanToPuNeedNum + tongToPuNeedNum + fengToPuNeedNum;
        if (needHunNum <= curHunNum) {
            vecSize = allCards[cardType.tiao].length;
            hasNum = curHunNum - needHunNum;
            isHu2 = this.isCanHunHu(hasNum, allCards[cardType.tiao], with258);
            ////this.GLog("__ MJBase:canHunHuNew tiao 胡了没="+isHu);
        }
        //将在风中,暂时不支持，待续
        /*needHunNum = wanToPuNeedNum + tongToPuNeedNum + tiaoToPuNeedNum;
        if (needHunNum <= curHunNum) {
        	vecSize = allCards[cardType.feng].length;
        	hasNum = curHunNum - needHunNum;
        	isHu3 = this.isCanHunHu(hasNum, allCards[cardType.feng], with258);
        }*/
        isHu3 = false;

        ////最后判断能否胡7对
        var isHu7 = false;
        if (!no7) {
            isHu7 = this.can_7_Hu(cdsss, cd, with258, withHun);
        }

        //胡七小对 及其他类型
        if (isHu7 && (isHu || isHu1 || isHu2 || isHu3)) {
            ////this.GLog("__ MJBase:canHunHuNew return 8");
            return 7; // 8,7,100, 可胡7小对,也可以胡其他类型
        }

        if (isHu7 && (!isHu && !isHu1 && !isHu2 && !isHu3)) {
            ////this.GLog("__ MJBase:canHunHuNew return 7");
            return 7; //7小对
        }
        if (!isHu7 && (isHu || isHu1 || isHu2 || isHu3)) {
            ////this.GLog("__ MJBase:canHunHuNew return 100-1");
            //return 100;//其他牌型 //fl
            return 1; //其他牌型
        }

        //摸到4个红中 胡
        if (is4YaoJi(cdsss, cd) && gui4Hu) {
            ////this.GLog("__ MJBase:canHunHuNew return 100");
            //return 100; //fl
            return 1;
        }

        ////this.GLog("__ MJBase:canHunHuNew___________________________________ end");
        return 0;
    }
    /**
     * 能否胡牌
     * @no7 有没有7小对(应该是没有7小对) true:没有7小对, false有7小对
     * @cds 当前手牌(去除碰吃杠掉的牌)
     * @cd  点炮牌
     * @return -1:居然没有 对牌,那就是毛病了呗!!! 0:没有胡 1:胡 7:7小对 13:是13幺吗?
     */
CMajingBase.prototype.canHu = function(no7, cds, cd, tData) {
    if (!this.isHun(cd)) { //打出去的 如果是 幺鸡代 ---那就失去万能牌的做用,
        if (tData && tData.wanZhou) {
            //if(tData.yaojidai && this.isHaveCardNum(cds, 1) > 0 ) {
            if (tData.yaojidai) {
                return this.canHunHuNew(no7, cds, cd, false, true, false);
            }
        }
    }

    var tmp = [];
    for (var i = 0; i < cds.length; i++) {
        tmp.push(cds[i]);
    }
    if (cd) //点炮的牌 也应该归入手牌
    {
        tmp.push(cd);
    }
    //
    cds = tmp; //假如 cds =   1,2,3,4,5,6,6,0,9,9,8
    //排序
    cds.sort(function(a, b) { return a - b }); //排序后 cds = 0,1,2,3,4,5,6,6,8,9,9


    var pair = {}; //对子个数
    for (var i = 0; i < cds.length; i++) {
        if (i < cds.length - 1 && cds[i] == cds[i + 1]) {
            pair[cds[i]] = cds[i];
        }
    }
    //例如上面的 cds  pair包含两个值 6与9


    //判断对牌
    if (Object.keys(pair).length == 0) //if( Object.keys(pair).length==0 ) 长度为 2
    {
        return -1;
    }



    //判断将牌
    for (var pairKey in pair) {
        var pcd = pair[pairKey];
        var left = [];
        var pnum = 0;
        //除了将牌都缓存
        for (var i = 0; i < cds.length; i++) {
            if (cds[i] == pcd && pnum < 2) {
                pnum++;
            } else {
                left.push(cds[i]);
            }
        }
        //单调牌
        if (left.length == 0) {
            return 1;
        }
        //没有对牌的情况
        if (left.length == 12) {
            var is13 = true,
                off13 = 0;
            for (var i = 0; i + off13 < this.s13.length; i++) {
                //找13腰的将牌
                if (pcd == this.s13[i]) {
                    off13++;
                }
                if (left[i] != this.s13[i + off13]) {
                    is13 = false;
                    break;
                }
            }
            if (off13 == 1 && is13) {
                return 13;
            }
            var is7 = true;
            //判断7小对(对对胡)
            if (no7) {
                is7 = false;
            } else {
                for (var i = 0; i < left.length; i += 2) {
                    if (left[i] != left[i + 1]) {
                        is7 = false;
                        break;
                    }
                }
            }
            if (is7) {
                return 7;
            }
        }
        //判断普通胡牌
        var segs = [];
        var seg = [left[0]];
        for (var i = 1; i < left.length; i++) {
            //缓存连牌
            if (canLink(left[i - 1], left[i])) {
                //连牌
                seg.push(left[i]);
            } else {
                //不是连牌
                segs.push(seg);
                seg = [left[i]];
            }
        }
        if (seg.length > 0) {
            segs.push(seg);
        }
        var matchOK = true;
        for (var i = 0; i < segs.length; i++) {
            seg = segs[i];
            if (seg.length % 3 != 0) {
                matchOK = false;
                break;
            }
            /**
             * 连牌算法，用判断牌组的方式便利
             */
            for (var m = 0; m < seg.length;) {
                if (canMath12(seg, m)) {
                    m += 12;
                } else if (canMath9(seg, m)) {
                    m += 9;
                } else if (canMath6(seg, m)) {
                    m += 6;
                } else if (canMath3(seg, m)) {
                    m += 3;
                } else {
                    matchOK = false;
                    break;
                }
            }
        }
        if (matchOK) {
            return 1;
        }
    }
    return 0;
}

CMajingBase.prototype.canPengForQiDui = function(hand) {
    /*var rtn = [];
    var cnum = {};
    for (var i = 0; i < hand.length; i++) {
    	var cd = hand[i];
    	if(this.isEqualHunCard(cd))
    	{
    		continue;
    	}
    	var num = cnum[cd];
    	if (!num) num = 0;
    	num++;
    	cnum[cd] = num;
    	if (num == 3 || num == 4) rtn.push(cd);
    }
    return rtn;*/

    var rtn = [];
    var cnum = {};
    var iHunNum = 0;
    for (var i = 0; i < hand.length; i++) {
        var cd = hand[i];
        if (cd == 1) {
            iHunNum += 1;
            continue;
        }

        var num = cnum[cd];

        if (!num) {
            num = 0;
        }

        num++;
        cnum[cd] = num;

        if (num == 4) {
            rtn.push(cd);
        }
    }


    if (rtn.length <= 0 && iHunNum > 0) {
        var iNum1 = 0;
        var iNum2 = 0;
        var iNum3 = 0;

        for (var key in cnum) {
            var iVal = cnum[key];

            if (iVal == 3) {
                iNum3 += 1;
            } else if (iVal == 2) {
                iNum2 += 1;
            } else if (iVal == 1) {
                iNum1 += 1;
            }
        }


        var ineedHunNum = iNum1;
        var iDlt1 = iHunNum - ineedHunNum;

        if (iDlt1 > 0) { //需要满足 个数为1的
            var iDlt3 = 0;
            if (iNum3 > 0) {
                iDlt3 = iDlt1 - iNum3;
                if (iDlt3 >= 0 && iDlt3 % 2 == 0) {
                    rtn.push(1);
                }
            } else if (iDlt1 == 2 || iDlt1 == 4) {
                rtn.push(1);
            }
        }
    }
    return rtn;
}

/**
 * @return 是否摸牌杠
 */
CMajingBase.prototype.canGang1 = function(peng, hand, peng4) {
        var rtn = [];
        //先便利碰
        for (var i = 0; i < peng.length; i++) {
            if (hand.indexOf(peng[i]) >= 0 && peng4.indexOf(peng[i]) < 0) {
                //缓存碰
                rtn.push(peng[i]);
            }
        }
        var cnum = {};
        for (var i = 0; i < hand.length; i++) {
            var cd = hand[i];
            var num = cnum[cd];
            if (!num) num = 0;
            num++;
            cnum[cd] = num;
            if (num == 4) rtn.push(cd);
        }
        return rtn;
    }
    /**
     * @return 是否点杠
     */
CMajingBase.prototype.canGang0 = function(hand, cd) {
        var num = 0;
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == cd) num++;
        }
        return num == 3;
    }
    /**
     * 是否碰
     */
CMajingBase.prototype.canPeng = function(hand, cd) {
        var num = 0;
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == cd) num++;
        }
        return num >= 2;
    }
    /**
     * 牌的类型的数量
     */
CMajingBase.prototype.cardTypeNum = function(hand, tp) {
        var typeNum = 0;
        //this.GLog("MajingBase_cardTypeNum hand=" + JSON.stringify(hand) + " 缺tp=" + tp);
        for (var i = 0; i < hand.length; i++) {
            if (Math.floor(hand[i] / 10) == tp) {
                //this.GLog("MajingBase_cardTypeNum hand[i]=" +hand[i]);
                typeNum++;
            }
        }
        return typeNum;
    }
    /**
     * @return 牌数量
     */
CMajingBase.prototype.hasCardNum = function(hand, tp) {
        var num = 0;
        for (var i = 0; i < hand.length; i++) {
            if (hand[i] == tp) {
                num++;
            }
        }
        return num;
    }
    /**
     * 牌的类型
     */
CMajingBase.prototype.cardType = function(tp) {
        return Math.floor(tp / 10)
    }
    /**
     * @return 是否有跟
     */
CMajingBase.prototype.have4 = function(pl, tData) {
        //this.GLog("MajingBase.prototype.have4--------------begin");

        var cardNum = {};
        var cards = [pl.mjhand, pl.mjchi, pl.mjpeng, pl.mjgang0, pl.mjgang1];


        //this.GLog("MajingBase.prototype.have4 pl.uid=" + pl.uid);
        //this.GLog("MajingBase.prototype.have4 pl.mjhand=" + JSON.stringify(pl.mjhand));

        //this.GLog("MajingBase.prototype.have4 pl.mjchi=" + JSON.stringify(pl.mjchi));
        //this.GLog("MajingBase.prototype.have4 pl.mjpeng=" + JSON.stringify(pl.mjpeng));
        //this.GLog("MajingBase.prototype.have4 pl.mjgang0=" + JSON.stringify(pl.mjgang0));
        //this.GLog("MajingBase.prototype.have4 pl.mjgang1=" + JSON.stringify(pl.mjgang1));
        //this.GLog("MajingBase.prototype.have4 pl.gangWin=" + JSON.stringify(pl.gangWin));

        //this.GLog("MajingBase.prototype.have4 cards=" + JSON.stringify(cards));

        for (var c = 0; c < cards.length; c++) {
            var cds = cards[c];
            for (var i = 0; i < cds.length; i++) {
                var cd = cds[i];
                var cNum = cardNum[cd];
                if (!cNum) cNum = 0;
                if (c < 2) cNum += 1;
                else if (c == 2) cNum += 3;
                else cNum += 4;
                cardNum[cd] = cNum;
            }
        }

        //this.GLog("MajingBase.prototype.have4 cardNum=" + JSON.stringify(cardNum));

        var rtn = 0;
        for (var cd in cardNum) {
            //this.GLog("MajingBase.prototype.have4 cd=" + cd);
            if (cardNum[cd] == 4 || cardNum[cd] == 5) {
                //this.GLog("MajingBase.prototype.have4 -------->>>>cd=" + cd);

                var i0Index = -1;
                var i1Index = -1;
                for (var iiicd in pl.mjgang0) {
                    if (cd == pl.mjgang0[iiicd]) {
                        i0Index = iiicd;
                        break;
                    }
                }

                for (var iiicd in pl.mjgang1) {
                    if (cd == pl.mjgang1[iiicd]) {
                        i1Index = iiicd;
                        break;
                    }
                }

                //var i0Index = pl.mjgang0.indexOf(cd); //总是返回 -1
                //var i1Index = pl.mjgang1.indexOf(cd); //总是返回 -1

                //this.GLog("MajingBase.prototype.have4 -----num1---i0Index= " + i0Index + " i1Index= " + i1Index);

                if (i0Index >= 0 || i1Index >= 0) {
                    var foundWin = false;
                    for (var cduid in pl.gangWin) //pl.gangWin={\"29|100342\":2}
                    {
                        //this.GLog("MajingBase.prototype.have4 -------->>>>cduid222=" + cduid);
                        //是否杠上炮
                        if (cd == parseInt(cduid.split("|")[0])) {
                            foundWin = true;
                        }
                    }

                    if (!foundWin) {
                        continue;
                    } else {
                        //this.GLog("MajingBase.prototype.have4 foundWin=" + foundWin);
                    }
                }

                if (tData.zhuanyu && tData.zhuanGen) {
                    var isZhuanYu = false;
                    for (var iiicd in pl.zhuanyuTo) {
                        if (cd == iiicd) {
                            isZhuanYu = true; //已经转与了
                            break;
                        }
                    }

                    if (!isZhuanYu) {
                        rtn++;
                    }
                } else {
                    rtn++;
                }
            }
        }


        //this.GLog("MajingBase.prototype.have4--------------end rtn=" + rtn);
        return rtn;
    }
    /**
     * @return 所有牌是否带19
     */
CMajingBase.prototype.all19 =function(pl) {

    var cds = [pl.mjpeng, pl.mjgang0, pl.mjgang1];
    //碰杠是否19
    for (var i = 0; i < cds.length; i++) {
        var cdi = cds[i];
        for (var j = 0; j < cdi.length; j++) {
            var num = cdi[j] % 10;
            if (num > 1 && num < 9) return false;
        }
    }
    //不带吃
    for (var i = 0; i < pl.mjchi.length; i += 3) {
        var found19 = true;
        for (var j = 0; found19 && j < 3; j++) {
            var num = pl.mjchi[i + j] % 10;
            if (num > 1 && num < 9) {
                found19 = false;
            }
        }
        if (!found19) return false;
    }
    var mjhand = pl.mjhand;

    var tmp = [];
    for (var i = 0; i < mjhand.length; i++) tmp.push(mjhand[i]);
    cds = tmp;
    cds.sort(function(a, b) { return a - b });
    var pair = {};
    for (var i = 0; i < cds.length; i++) {
        if (i < cds.length - 1 && cds[i] == cds[i + 1])
            pair[cds[i]] = cds[i];
    }
    if (Object.keys(pair).length == 0)
        return false;

    //add mrhu
    var getResult = function (cds, pcd ) {
        var skipPair = 0;
        var v19 = pcd % 10;
        if (v19 > 1 && v19 < 9) {
            skipPair++;
            return false
        }
        var left = [];
        var pnum = 0;

        for (var i = 0; i < cds.length; i++) {
            if (cds[i] == pcd && pnum < 2)
                pnum++;
            else
                left.push(cds[i]);
        }

        if (left.length == 0)
            return true;
        //是否7小对
        if (left.length == 12) {
            var is7 = true;
            for (var i = 0; i < left.length; i += 2)
                if (left[i] != left[i + 1]) {
                    is7 = false;
                    break;
                }
            if (is7) {
                for (var i = 0; i < left.length; i += 2) {
                    v19 = left[i] % 10;
                    if (v19 != 1 && v19 != 9)
                        return false;
                }
            }
        }
        var segs = [];
        var seg = [left[0]];
        for (var i = 1; i < left.length; i++) {
            if (canLink(left[i - 1], left[i]))
                seg.push(left[i]);
            else {
                segs.push(seg);
                seg = [left[i]];
            }
        }
        if (seg.length > 0)
            segs.push(seg);

        var matchOK = true;
        for (var i = 0; matchOK && i < segs.length; i++) {
            seg = segs[i];
            for (var m = 0; matchOK && m < seg.length;) {
                var match12=  canMath12(seg, m);
                if (match12)
                    return false;
                else
                    switch (canMath9(seg, m)) {
                        case 2:
                            m += 9;
                            break;
                        case 1: //console.info("canMath9 1");
                            return false;
                        case 0:
                        {
                            //console.info("canMath9 0 ");
                            switch (canMath6(seg, m)) {
                                case 2:
                                    m += 6;
                                    break;
                                case 1:
                                    //console.info("canMath6 1");
                                    return false;
                                case 0:
                                {
                                    var macth3= canMath3(seg, m);
                                    switch (macth3 ) {
                                        case 2:
                                            m += 3;
                                            break;
                                        case 1:
                                            //console.info("canMath2 1");
                                            return false;
                                        case 0:
                                            matchOK = false;
                                            break;
                                    }
                                }
                                    break;
                            }
                        }
                    }

            }
        }
        if (matchOK)
            return true;
    }

    for (var pairKey in pair){
        var pcd = pair[pairKey];
        var result = getResult(cds,pcd);
        if( result ){
            return true;
        }
    }
    /*
     var skipPair = 0;
     for (var pairKey in pair) {
     var pcd = pair[pairKey];
     var v19 = pcd % 10;
     if (v19 > 1 && v19 < 9) {
     skipPair++;
     continue;
     }
     pcd  = 21;

     var left = [];
     var pnum = 0;

     console.log("pcd =" +  pcd );
     for (var i = 0; i < cds.length; i++) {
     if (cds[i] == pcd && pnum < 2)
     pnum++;
     else left.push(cds[i]);
     }

     console.log("HHH --left--" + JSON.stringify(left) );

     if (left.length == 0) return true;
     //是否7小对
     if (left.length == 12) {
     var is7 = true;
     for (var i = 0; i < left.length; i += 2)
     if (left[i] != left[i + 1]) { is7 = false; break; }
     if (is7) {
     for (var i = 0; i < left.length; i += 2) {
     v19 = left[i] % 10;
     if (v19 != 1 && v19 != 9) return false;
     }
     }
     }
     var segs = [];
     var seg = [left[0]];
     for (var i = 1; i < left.length; i++) {
     if (canLink(left[i - 1], left[i])) seg.push(left[i]);
     else {
     segs.push(seg);
     seg = [left[i]];
     }
     }
     if (seg.length > 0) segs.push(seg);

     console.info("left "+ JSON.stringify(left));
     console.info("segs "+ JSON.stringify(segs));

     var matchOK = true;
     for (var i = 0; matchOK && i < segs.length; i++) {
     seg = segs[i];
     for (var m = 0; matchOK && m < seg.length;) {
     var match12=  canMath12(seg, m);
     console.info("match12------ "+match12);
     if (match12) return false;
     else switch (canMath9(seg, m)) {
     case 2:
     m += 9;
     break;
     case 1: //console.info("canMath9 1");
     return false;
     case 0:
     {
     //console.info("canMath9 0 ");
     switch (canMath6(seg, m)) {
     case 2:
     m += 6;
     break;
     case 1:
     //console.info("canMath6 1");
     return false;
     case 0:
     {
     var macth3= canMath3(seg, m);
     console.info("canMath3------ seg = "+ seg + "; m=" + m);
     console.info("canMath3------ " + macth3);
     switch (macth3 ) {
     case 2:
     m += 3;
     break;
     case 1:
     //console.info("canMath2 1");
     return false;
     case 0:
     matchOK = false;
     break;
     }
     }
     break;
     }
     }
     }

     }
     }
     if (matchOK) return true;
     }

     */
    return false;
}
    /**
     * @return 是否能吃
     */
CMajingBase.prototype.canChi = function(hand, cd) {
        var num = [0, 0, 0, 0, 0];
        var rtn = [];
        for (var i = 0; i < hand.length; i++) {
            var dif = hand[i] - cd;
            switch (dif) {
                case -2:
                case -1:
                case 1:
                case 2:
                    num[dif + 2]++;
                    break;
            }
        }
        if (num[3] > 0 && num[4] > 0) rtn.push(0);
        if (num[1] > 0 && num[3] > 0) rtn.push(1);
        if (num[0] > 0 && num[1] > 0) rtn.push(2);
        return rtn;
    }
    /**
     * 只有手牌
     */
CMajingBase.prototype.OnlyHand = function(pl) {
        return pl.mjpeng.length == 0 && pl.mjgang0.length == 0 && pl.mjchi.length == 0;
    }
    /**
     * 是否清一色
     */
CMajingBase.prototype.SameColor = function(pl, tData) {
    var iArr2 = pl.mjhand.slice(0);
    var iArrHand = [];
    if (tData && tData.wanZhou && tData.yaojidai) {
        for (var i = 0; i < iArr2.length; i++) {
            if (!this.isHun(iArr2[i])) {
                iArrHand.push(iArr2[i]);
            }
        }
    } else {
        iArrHand = pl.mjhand.slice(0);
    }

    var test = [iArrHand, pl.mjpeng, pl.mjgang0, pl.mjgang1, pl.mjchi];
    var color = -1;
    for (var i = 0; i < test.length; i++) {
        var cds = test[i];
        for (var j = 0; j < cds.length; j++) {
            var cd = cds[j];
            if (color == -1) color = Math.floor(cd / 10);
            else if (color != Math.floor(cd / 10)) return false;
        }
    }
    return true;
}

/*
 * 是否是 3搭*/
CMajingBase.prototype.is3Da = function(pl) {
    return (pl.mjpeng.length + pl.mjgang0.length + pl.mjgang1.length) >= 3;
}

//癞子判断
CMajingBase.prototype.All3New = function(pl) {
        //this.GLog("MajingBase_All3New pl.uid=" + pl.uid + " pl.mjhand=" + pl.mjhand);
        //有吃牌
        if (pl.mjchi.length > 0) return 0;

        var laiziNums = 0;
        var cds = pl.mjhand.slice();
        //1，2，3，4张牌的数量
        //var counts = [0,0,0,0];
        var count1 = 0;
        var count2 = 0;
        var count3 = 0;
        var count4 = 0;
        //计算各牌的数量
        var PAI = {};
        var tempCD = 0;
        for (var i = 0; i < cds.length; i++) {
            tempCD = cds[i];
            if (this.isEqualHunCard(tempCD)) {
                laiziNums++;
                continue;
            }
            if (PAI[tempCD]) {
                PAI[tempCD]++;
            } else {
                PAI[tempCD] = 1;
            }
        }
        var tempCount = 0;
        for (var i in PAI) {
            tempCount = PAI[i];
            //counts[tempCount]++;
            if (tempCount == 1) count1++;
            else if (tempCount == 2) count2++;
            else if (tempCount == 3) count3++;
            else if (tempCount == 4) count4++;
        }

        var iRet = 0;
        //碰碰胡判断
        if (count4 == 0) {
            //条件判断
            var needNums = count1 * 2 + count2 - 1;
            // var needNums = count1 * 2 + count2 + 1;
            if (needNums <= laiziNums) {

                //this.GLog("MajingBase_All3New count4 == 0 return 1");
                iRet = 1;
            }
        } else {
            //条件判断
            var needNums = count1 * 2 + count2 + count4;
            //this.GLog("MajingBase_All3New 需要的癞子数是:"+needNums);
            if (needNums == laiziNums || (needNums < laiziNums && (laiziNums - needNums) % 2 != 0)) {
                //this.GLog("MajingBase_All3New count4 != 0 return 1");
                iRet = 1;
            }
        }
        return iRet;
    }
    /**
     * 是否大对碰 
     * @return 2是否258做将大对碰 1否
     */
CMajingBase.prototype.All3 = function(pl) {
    //是否258大对碰
    var is258 = true;

    if (pl.mjchi.length > 0) return 0;
    var hnum = {};
    var mjhand = pl.mjhand;
    //计算手牌张数
    for (var i = 0; i < mjhand.length; i++) {
        var cd = mjhand[i];
        var cnum = hnum[cd];
        if (!cnum) {
            cnum = 0;
        }
        cnum++;
        hnum[cd] = cnum;
    }

    var smallNum = 0;
    var num2 = 0;
    for (var cd in hnum) {
        var cnum = hnum[cd];
        if (cnum != 3) num2++;
        else {
            if ((cd % 10 == 2) || (cd % 10 == 5) || (cd % 10 == 8)) {

            } else {
                is258 = false;
            }
        }
    }
    if (num2 > 1) return 0;

    var test = [pl.mjhand, pl.mjpeng, pl.mjgang0, pl.mjgang1];
    for (var i = 0; i < test.length; i++) {
        var cds = test[i];
        for (var j = 0; j < cds.length; j++) {
            var cd = cds[j];
            if ((cd % 10 == 2) || (cd % 10 == 5) || (cd % 10 == 8)) {

            } else is258 = false;
        }
    }
    return is258 ? 2 : 1;
}


/*
 * player 是前4态吗?
 * @返回 true 现在处于前4态
 * @返回 false 现在处于前4态
 * */
CMajingBase.prototype.isQian4 = function(tTable) {
    if (!tTable) {
        return false;
    }
    var iAllPutCd = 0;
    var iGLog = this.GLog;
    tTable.AllPlayerRun(function(p) {
        if (p.mjput.length > 0) {
            iAllPutCd += p.mjput.length;
        }
    });

    //this.GLog("CMajingBase: isQian4 ==" + iAllPutCd);

    if (iAllPutCd <= 4) {
        //this.GLog("MajingBase: isQian4----true-------->iAllPutCd=" + iAllPutCd);
        return true;
    }

    //this.GLog("MajingBase: isQian4----false-------->iAllPutCd=" + iAllPutCd);
    return false;
}

/*
 * 牌桌 是后4态吗?
 * @返回 true 现在处于后4态
 * @返回 false 现在处于后4态
 * */
CMajingBase.prototype.isHou4 = function(pTable) {
        if (!pTable) {
            return false;
        }
        var tData = pTable.tData;
        if (tData.cardNext > pTable.cards.length - 4 &&
            tData.cardNext <= pTable.cards.length) {
            //this.GLog("MajingBase: isHou4----true-------->tData.cardNext=" + tData.cardNext + " tTable.cards.length=" + pTable.cards.length);
            return true;
        }

        //this.GLog("MajingBase: isHou4----false-------->tData.cardNext=" + tData.cardNext + " tTable.cards.length=" + pTable.cards.length);
        return false;
    }
    /**
     * 检测停牌
     */
CMajingBase.prototype.checkMJTing = function(pl, tTable) {
    var tData = tTable.tData;
    var mjhand = pl.mjhand.slice(0);
    var tryCard = {};
    for (var i = 0; i < mjhand.length; i++) {
        var cd = mjhand[i];
        if (tData && tData.wanZhou && tData.yaojidai && (this.isQian4(tTable) || this.isHou4(tTable))) { //add by wcx 20161215---手上有幺鸡时，前4后4不能报叫。
            if (this.isHun(cd)) {
                return false;
            }
        }
        for (var j = -1; j <= 1; j++) {
            var cj = cd + j;
            if (cj >= 1 && cj <= 9 || cj >= 11 && cj <= 19 || cj >= 21 && cj <= 29) {
                tryCard[cj] = cj;
            }
        }
    }

    var maxWin = 0;
    mjhand.push(0);
    for (var cd in tryCard) {
        var lastCD = mjhand[mjhand.length - 1];
        var cdi = tryCard[cd];
        mjhand[mjhand.length - 1] = cdi;
        var huType = this.canHu(false, mjhand, false, tData);
        if (huType > 0) {
            var oldDesc = pl.mjdesc;
            pl.huType = huType;
            maxWin = 1;
        }
    }
    mjhand.length = mjhand.length - 1;
    return maxWin;
}


/**
 * @return 所有牌数 = mjpeng +  mjgang0 +  mjgang1 +  mjchi + mjhand
 */
CMajingBase.prototype.CardCount = function(pl) {
        var rtn = (pl.mjpeng.length + pl.mjgang0.length + pl.mjgang1.length) * 3 + pl.mjchi.length;

        if (pl.mjhand)
            rtn += pl.mjhand.length;

        return rtn;
    }
    /**
     * @return 是否14张牌
     */
CMajingBase.prototype.NumOK = function(pl) {
    return pl.mjhand.length + (pl.mjpeng.length + pl.mjgang0.length + pl.mjgang1.length) * 3 + pl.mjchi.length == 14;
}

/***************************************************nodejs 测试驱动模块***********************************/
CMajingBase.prototype.TestRandomCards = function() {
    //this.GLog("TestRandomCards");
    var cards = this.randomCards();
    var nums = {};
    for (var i = 0; i < cards.length; i++) {
        var cd = cards[i];
        if (!nums[cd]) nums[cd] = 1;
        else nums[cd] = nums[cd] + 1;
    }
    for (var c in nums) {
        if (nums[c] != 4) console.error("not 4");
    }
    if (Object.keys(nums).length != 34) console.error("not 34");
}
CMajingBase.prototype.TestHu = function() {
    /*//this.GLog("TestHu");
    var hu=[

    [19,5,8,16,2,23,11,6,31,13,26,1,28,81]
    ,[1,9,11,19,21,29,31,41,51,61,71,81,91,71]
    ,[1,1, 2,2, 3,3, 4,4, 5,5, 6,6, 7,7]
    ,[1,2,3,4,4]
    ,[1,1,2,2,3,3,4,4]
    ,[8,5,15,14,16,81,6,27,21,22,17,13,12,91]
    ,*/
    //[15,17,23,18,16,23,15,15]
    /*
	[6,7,14,15,15,16,16,16,17,17,18,26,26,8]
	];
	for(var i=0;i<hu.length;i++)
	{
		this.GLog( this.canHu(false,hu[i])+" "+hu[i]);
	}*/

    var temPl = {};
    temPl.mjpeng=[];
    temPl.mjgang0 = [];
    temPl.mjgang1 =[];
    temPl.mjchi = [];
    temPl.mjhand =[1, 2, 3, 7, 8, 9, 1, 2, 3,8,8, 1,1,1 ];
    var result = this.all19(temPl);
    console.log( " relust === " +result );
    console.log("HHHHHHHHHHHHHHHHHH");
}
CMajingBase.prototype.TestcanGang1 = function() {
    // var gang=[
    //   [[1],[1,2,2,2,2]],
    //   [[1],[2,3]],
    // ];
    // for(var i=0;i<gang.length;i++)
    // 	this.GLog(this.canGang1(gang[i][0],gang[i][1] ));
}
CMajingBase.prototype.TestChi = function() {

    var chi = [

        [1, 2, 4, 5], 3

    ];
    this.GLog(this.canChi(chi, 3));
}
CMajingBase.prototype.TestMissHandMax = function() {
        var tests = [
            { name: "1", mjpeng: [28], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [1, 2, 2, 3, 3, 4, 7, 7, 26, 27], mjdesc: [], baseWin: 0 } //根
        ];
        for (var i = 0; i < tests.length; i++) {
            var pl = tests[i];
            if (this.CardCount(pl) != 13) {
                pl.mjdesc.push("牌数不对");
            } else pl.baseWin = this.missHandMax(pl);
            this.GLog(pl.name + " " + pl.mjdesc + "  " + pl.baseWin + " " + pl.mjhand);
        }
    }
    /**
     * 单独检测碰过是否有19
     */
CMajingBase.prototype.pengGameHas19 = function(pl) {
        var cds = [pl.mjpeng, pl.mjgang0, pl.mjgang1];
        //碰杠是否19
        for (var i = 0; i < cds.length; i++) {
            var cdi = cds[i];
            for (var j = 0; j < cdi.length; j++) {
                var num = cdi[j] % 10;
                if (num == 1 || num == 9) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 是否只湖一张牌
     * @return 是否
     */
CMajingBase.prototype.canOnlyOneCardHu = function(pl, tData, card, isonly) {
    var mjhand = pl.mjhand.slice(0);
    mjhand.length = mjhand.length - 1;
    var tryCard = {};
    for (var i = 0; i < mjhand.length; i++) {
        var cd = mjhand[i];
        for (var j = -1; j <= 1; j++) {
            var cj = cd + j;
            if (cj >= 1 && cj <= 9 || cj >= 11 && cj <= 19 || cj >= 21 && cj <= 29) {

                tryCard[cj] = cj;
            }
        }
    }
    var maxWin = 0;
    mjhand.push(0);
    //var oldBloodDes = pl.mjdesc.slice(0);
    var isFlag = false;
    for (var cd in tryCard) {
        var lastCD = mjhand[mjhand.length - 1];
        var cdi = tryCard[cd];
        mjhand[mjhand.length - 1] = cdi;
        var huType = this.canHu(false, mjhand);
        if (huType > 0 && 2 != huType) {
            // var oldDesc=pl.mjdesc;
            // pl.mjdesc=[];
            // pl.huType=huType;
            //var isCha = tData.blood;
            //看看是否胡这一张牌
            if (isonly) {
                if (cdi != card) {
                    return false;
                }
                isFlag = true;
            } else {
                if (cdi == card) {
                    return true;
                }
            }
        } else {
            // if(tData.blood)
            // {
            // 	pl.mjdesc=[];
            // }
            mjhand[mjhand.length - 1] = lastCD;
        }
    }
    return isFlag;
}

/**
 *
 * 获取 index 下的player uid
 */
CMajingBase.prototype.getPlayerUid = function(tData, i) {
    return tData.uids[(tData.curPlayer + i) % tData.maxPlayers];
}

/*add by wcx 20170215 托管*/
CMajingBase.prototype.getAutoPutCard = function(mjhands) {
    var cds = mjhands.slice(0);
    cds.sort(function(a, b) { return a - b });
    var putCard = 0;
    var cardTemp = cds[0];
    if (cardTemp != cds[1] && cardTemp - 1 != cds[1] && cardTemp - 2 != cds[1] && cardTemp + 1 != cds[1] && cardTemp + 2 != cds[1]) {
        return cardTemp;
    }
    var i = 1;
    for (; i < cds.length;) {
        cardTemp = cds[i];
        if (i < cds.length - 1) { //先比对是不是连着或者是一样的牌
            if (cardTemp != cds[i + 1] && cardTemp != cds[i - 1] && cardTemp - 1 != cds[i - 1] && cardTemp + 1 != cds[i + 1]) {
                return cardTemp;
            }
            if (0 == putCard && (cardTemp - 1 == cds[i - 1] || cardTemp + 1 == cds[i + 1])) {
                putCard = cardTemp;
            }
            ++i;
        } else {
            if (cardTemp != cds[i - 1] && cardTemp - 1 != cds[i - 1]) {
                return cardTemp;
            }
            ++i;
        }
    }
    if (0 == putCard) {
        putCard = cds[0];
    }
    return putCard;
}


CMajingBase.prototype.TestCardType = function() {
        var tests = [
            { name: "1", mjpeng: [2], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [2, 3, 4, 7, 8, 9, 11, 11, 11, 21, 21], mjdesc: [], baseWin: 0 } //根
            , { name: "2", mjpeng: [], mjgang0: [1], mjgang1: [], mjchi: [], mjhand: [2, 3, 4, 7, 8, 9, 11, 11, 11, 21, 21], mjdesc: [], baseWin: 0 }, { name: "3", mjpeng: [], mjgang0: [], mjgang1: [1], mjchi: [], mjhand: [2, 3, 4, 7, 8, 9, 11, 11, 11, 21, 21], mjdesc: [], baseWin: 0 }, { name: "4", mjpeng: [], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [2, 3, 4, 7, 8, 9, 11, 11, 11, 21, 21, 2, 2, 2], mjdesc: [], baseWin: 0 }, { name: "5", mjpeng: [1, 9], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [17, 18, 19, 17, 18, 19, 11, 11], mjdesc: [], baseWin: 0 } //幺九
            , { name: "6", mjpeng: [], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [1, 2, 3, 1, 2, 3, 1, 2, 3, 7, 8, 9, 9, 9], mjdesc: [], baseWin: 0 } //清幺九
            , { name: "7", mjpeng: [1, 2, 3], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [7, 8, 9, 9, 9], mjdesc: [], baseWin: 0 } //非清幺九
            , { name: "8", mjpeng: [], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [1, 2, 3, 1, 2, 3, 1, 2, 3, 7, 8, 9, 5, 5], mjdesc: [], baseWin: 0 } //非清幺九
            , { name: "9", mjpeng: [1, 2, 3], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [7, 8, 9, 5, 5], mjdesc: [], baseWin: 0 } //非清幺九
            , { name: "10", mjpeng: [], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [1, 2, 3, 1, 2, 3, 4, 2, 3, 7, 8, 9, 9, 9], mjdesc: [], baseWin: 0 } //非清幺九
            , { name: "11", mjpeng: [2, 15, 28], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 } //将对
            , { name: "12", mjpeng: [2, 15], mjgang0: [28], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 }, { name: "13", mjpeng: [2, 15], mjgang0: [], mjgang1: [28], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 }, { name: "14", mjpeng: [], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [2, 2, 2, 15, 15, 15, 5, 5, 5, 28, 28, 28, 8, 8, ], mjdesc: [], baseWin: 0 }, { name: "15", mjpeng: [2, 15, 29], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 } //非将对
            , { name: "16", mjpeng: [2, 15], mjgang0: [29], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 }, { name: "17", mjpeng: [2, 15], mjgang0: [], mjgang1: [29], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 }, { name: "18", mjpeng: [2, 15, 29], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 8, 8], mjdesc: [], baseWin: 0 }, { name: "19", mjpeng: [2, 15, 28], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 9, 9], mjdesc: [], baseWin: 0 } //非将对
            , { name: "20", mjpeng: [2, 15], mjgang0: [28], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 9, 9], mjdesc: [], baseWin: 0 }, { name: "21", mjpeng: [2, 15], mjgang0: [], mjgang1: [28], mjchi: [], mjhand: [5, 5, 5, 9, 9], mjdesc: [], baseWin: 0 }, { name: "22", mjpeng: [2, 15, 29], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [5, 5, 5, 9, 9], mjdesc: [], baseWin: 0 }
        ];
        for (var i = 0; i < tests.length; i++) {
            // var pl=tests[i];
            // if(!this.NumOK(pl))
            // {
            // 	pl.mjdesc.push("牌数不对"); 
            // 	pl.huType=-1;
            // }
            // else pl.huType=this.canHu(false,pl.mjhand);
            // if(pl.huType==0)
            // {
            // 	pl.mjdesc.push("不胡");
            // }
            // else if(pl.huType>0)
            // {
            // 	this.computeBaseWin(pl,true);
            // }
            // this.GLog(pl.name+" "+pl.mjdesc+"  "+pl.baseWin);
        }
    }
    /*************************************代理测试类*********************************** */
    // g_ServeMathProxy.majingInstance = null;
    // g_ServeMathProxy.GetMajingBaseInstance = function()
    // {
    // 	if(null == g_ServeMathProxy.majingInstance)
    // 	{
    // 		g_ServeMathProxy.majingInstance = new CMajingBase()
    // 	}
    // 	return g_ServeMathProxy.majingInstance;
    // }
    /********************************************************************************* */

function DoTest() {
    //TestMissHandMax();
    //TestCardType();
    //TestRandomCards();
    //TestHu();
    //TestcanGang1();
    //TestChi();
    this.GLog(this.canGang0([2, 3, 4, 3, 3], 3));
    this.GLog(this.canPeng([2, 3, 4, 3, 3], 3));
    g_ServeMathProxy.GetMajingBaseInstance().TestRandomCards()
    g_ServeMathProxy.GetMajingBaseInstance().TestHu()
}

// if (typeof(jsclient) != "undefined")
// {
// 	jsclient.this=this;
// }
//else
//{
module.exports = CMajingBase;
//}