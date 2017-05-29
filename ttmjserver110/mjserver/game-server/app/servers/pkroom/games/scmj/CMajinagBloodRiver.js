//**************************************
//算法类 处理麻将核心算法---血流算分类 CMajiangBloodRiver
//create by huyan
//
function CMajinagBloodRiver() {
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

inherit(require("./CMajiangBase.js"), CMajinagBloodRiver)
    /**
     * 查大叫
     * @return 查大叫返的分数
     */
CMajinagBloodRiver.prototype.missHandMax = function(pl, tData, _notdesc) {
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
        var huType = this.canHu(false, mjhand);
        //console.info("tryCard "+cdi+" "+huType);
        if (huType > 0) {
            var oldDesc = pl.mjdesc;
            pl.mjdesc = [];
            pl.huType = huType;
            var isCha = true;
            var winNum = this.computeBaseWin(pl, desc, tData, isCha, []);
            if (winNum > maxWin) {
                maxWin = winNum;
            } else {
                pl.mjdesc = oldDesc;
                mjhand[mjhand.length - 1] = lastCD;
            }
        } else {
            // if(tData.blood)
            // {
            pl.mjdesc = [];
            //			}
            mjhand[mjhand.length - 1] = lastCD;
        }
    }
    //if(tData.blood){
    if (pl.mjdesc.length > 0) {
        for (var i = 0; i < pl.mjdesc.length; i++) {
            oldBloodDes.push(pl.mjdesc[i]);
        }
        pl.mjdesc = oldBloodDes;
    } else {
        pl.mjdesc = oldBloodDes;
    }
    //}

    if (maxWin == 0) mjhand.length = mjhand.length - 1;
    return maxWin;
}

module.exports = CMajinagBloodRiver;