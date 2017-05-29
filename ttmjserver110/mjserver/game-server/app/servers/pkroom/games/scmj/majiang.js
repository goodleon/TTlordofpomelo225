/*
 *
 *
 *
 *
 * 废弃------------------只供,参考代码用!!!!!
 *
 *
 *
 *
 *
 * */
(function() //麻将牌
    {
        var mjcards = [
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,

            11, 12, 13, 14, 15, 16, 17, 18, 19,
            11, 12, 13, 14, 15, 16, 17, 18, 19,
            11, 12, 13, 14, 15, 16, 17, 18, 19,
            11, 12, 13, 14, 15, 16, 17, 18, 19,

            21, 22, 23, 24, 25, 26, 27, 28, 29,
            21, 22, 23, 24, 25, 26, 27, 28, 29,
            21, 22, 23, 24, 25, 26, 27, 28, 29,
            21, 22, 23, 24, 25, 26, 27, 28, 29,


            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91,
            31, 41, 51, 61, 71, 81, 91
        ]

        var mjcardsWithTwoCardHouse = [
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9,
            1, 2, 3, 4, 5, 6, 7, 8, 9, //条
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

        //13要牌型
        var s13 = [1, 9, 11, 19, 21, 29, 31, 41, 51, 61, 71, 81, 91];
        //
        var all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29];
        //计算连牌
        function canLink(a, b) {
            return (a + 1 == b || a == b);
        }

        var majiang = {};
        var nextTest = -1;
        var testCds = [


            [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14,
                29, 29, 29, 23, 23, 23, 16, 15, 14, 11, 11, 12, 13,
                22, 27, 25, 19, 21, 19, 17, 15, 13, 11, 9, 7, 5,
                22, 27, 25, 19, 21, 19, 17, 15, 13, 11, 9, 7, 5,
                29, 23, 28, 28, 28, 26, 26, 26, 26, 24, 24, 24
            ] //双杠 杠后炮


        ];


        majiang.getCardMaxSize = function(tData) {
            if (tData.doubleCarHouse) {
                return mjcardsWithTwoCardHouse.length - 28;
            } else {
                return mjcards.length - 28;
            }
        }

        //洗牌
        majiang.randomCards = function(withWind) {
                //return testCds[(++nextTest)%testCds.length ];

                var rtn = [];
                rtn.length = withWind ? mjcards.length : (mjcards.length - 28);
                for (var i = 0; i < rtn.length; i++) rtn[i] = mjcards[i];
                for (var i = 0; i < rtn.length; i++) {
                    var ci = rtn[i];
                    var j = Math.floor(Math.random() * rtn.length);
                    rtn[i] = rtn[j];
                    rtn[j] = ci;
                }
                return rtn;
            }
            //
            //两牌房洗牌
        majiang.randomCardsWithTwoCardHouse = function(withWind) {
                //return testCds[(++nextTest)%testCds.length ];

                var rtn = [];
                rtn.length = withWind ? mjcardsWithTwoCardHouse.length : (mjcardsWithTwoCardHouse.length - 28);
                for (var i = 0; i < rtn.length; i++) rtn[i] = mjcardsWithTwoCardHouse[i];
                for (var i = 0; i < rtn.length; i++) {
                    var ci = rtn[i];
                    var j = Math.floor(Math.random() * rtn.length);
                    rtn[i] = rtn[j];
                    rtn[j] = ci;
                }
                return rtn;
            }
            //
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
        //
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
        //
        function canMath3(cds, i) {
            if (i + 2 >= cds.length) return 0;
            var match3 = 0;
            var pat = [
                [0, 0, 0],
                [0, 1, 2]
            ];
            for (var j = 0; j < pat.length; j++) {
                var pj = pat[j];
                for (var k = 0; k < pj.length; k++) {
                    if (pj[k] + cds[i] != cds[k + i]) break;
                    if (k == pj.length - 1) {
                        if (match3 == 0) match3++;
                        if (j == 0 && (cds[k + i] % 10 == 1 || cds[k + i] % 10 == 9)) {
                            return 2;
                        } else if (j == 1 && (cds[k + i - 2] % 10 == 1 || cds[k + i] % 10 == 9)) {
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
                [0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4]
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
         * 检测是否是胡的某一张 如果传5 则检测5万 5条 5筒 是否夹5 如果是返回true
         *  @inputCard   传数字
         *  @return 是，否
         */
        function isWinStucMiddleCard(cards, inputCard) {
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
                return majiang.canHu(false, tempCards, 0) == 1 ? true : false;
            }
            //if( Array.isArray(otherCards) )
            //{
            //	tempCards = tempCards.concat( otherCards );
            //}
            return false;
        }
        /**
         * 检测是否是胡的某一张 如果传5 则检测5万 5条 5筒 是否夹5 如果是返回true
         *  @inputCard   传数字
         *  @return 是，否
         */
        function isKa5Xing(cards) {
            var tempCards = [].concat(cards);
            var lastCards = tempCards[tempCards.length - 1];
            //console.info( "isKa5Xing1 lastCards: " + lastCards.toString() );
            if (lastCards != 5 && lastCards != 15 && lastCards != 25)
                return false;
            tempCards.length = tempCards.length - 1;
            //console.info( "isKa5Xing2 tempCards: " + tempCards.toString() );
            if (isWinStucMiddleCard(tempCards, 5) == true ||
                isWinStucMiddleCard(tempCards, 15) == true ||
                isWinStucMiddleCard(tempCards, 25) == true) //砍5
                return true;
            return false;
        }
        /**
         * 检测是否是不包括1,9
         *  @return 是，否
         */
        function isNoInclude1or9(cds, otherCards) {
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
        function isDouble3Line(cds) {
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
                    var res = majiang.canHu(false, tempCards2, 0);
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
        function getTypeLine1_9(cds) {
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
        function is9Line(cds) {
            var tempCards = [].concat(cds);
            var lineType9 = getTypeLine1_9(tempCards);
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
                var res = majiang.canHu(false, tempCards, 0);
                return res == 1 ? true : false;
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
        majiang.computeBaseWin = function(pi, withDesc, tData, isCha, genArr) {

                if (tData.doubleCarHouse) {
                    return majiang.computeBaseWinDoubleCardHouse(pi, withDesc, tData, isCha, genArr)
                } else if (tData.deyangType) {
                    return majiang.computeDeYangType(pi, withDesc, tData, isCha, genArr);
                } else {
                    return majiang.computeBaseWinBase(pi, withDesc, tData, isCha, genArr)
                }
            }
            /**
             * 算翻数 通用
             * @pi 调去该函数玩家
             * @withDesc 带不带描述
             * @tData 牌桌数据　
             * @isCha 是否大叫
             * @genArr 跟的数组
             */
        majiang.computeBaseWinBase = function(pi, withDesc, tData, isCha, genArr) {
                //是否7小队胡法
                var num2 = pi.huType == 7 ? 1 : 0;
                //是否龙7对
                if (num2 == 1 && majiang.canGang1([], pi.mjhand).length > 0) {
                    num2 = 2;
                }
                //是否大对碰
                var num3 = num2 > 0 ? 0 : majiang.All3(pi);
                var sameColor = majiang.SameColor(pi, tData);
                var all19 = majiang.all19(pi);

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
                    if (0 == majiang.hasCardNum(pi.mjhand, 1) && 0 == majiang.hasCardNum(pi.mjhand, 9) && 0 == majiang.hasCardNum(pi.mjhand, 11) && 0 == majiang.hasCardNum(pi.mjhand, 19) &&
                        0 == majiang.hasCardNum(pi.mjhand, 21) && 0 == majiang.hasCardNum(pi.mjhand, 29) && !majiang.pengGameHas19(pi)) {

                        baseWin *= 2;
                        if (withDesc) {
                            pi.mjdesc.push("中张");
                        }
                    }

                }

                var have4 = majiang.have4(pi);
                if (num2 > 1) have4--;
                if (have4 > 0) {
                    if (withDesc) pi.mjdesc.push("根X" + have4);
                    for (var i = 0; i < have4; i++) baseWin *= 2;
                    genArr.push(have4);
                }
                return baseWin;
            }
            /**
             * 算番数两牌房
             * @pi 调去该函数玩家
             * @withDesc 带不带描述
             * @tData 牌桌数据　
             * @isCha 是否大叫
             * @genArr 跟的数组
             */
        majiang.computeBaseWinDoubleCardHouse = function(pi, withDesc, tData, isCha, genArr) {
            //是否7小队胡法
            var num2 = pi.huType == 7 ? 1 : 0;
            //是否龙7对
            if (num2 == 1 && majiang.canGang1([], pi.mjhand).length > 0) {
                num2 = 2;
            }
            //是否大对碰
            var num3 = num2 > 0 ? 0 : majiang.All3(pi);
            var sameColor = majiang.SameColor(pi, tData);
            var all19 = majiang.all19(pi);

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
                if (0 == majiang.hasCardNum(pi.mjhand, 1) && 0 == majiang.hasCardNum(pi.mjhand, 9) && 0 == majiang.hasCardNum(pi.mjhand, 11) && 0 == majiang.hasCardNum(pi.mjhand, 19) &&
                    0 == majiang.hasCardNum(pi.mjhand, 21) && 0 == majiang.hasCardNum(pi.mjhand, 29) && !majiang.pengGameHas19(pi)) {

                    baseWin *= 2;
                    if (withDesc) {
                        pi.mjdesc.push("中张");
                    }
                }

            }

            var have4 = majiang.have4(pi);
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
            if (tData.fight3p) {

            } else {
                //卡 二 条
                //判断手牌是否只胡2条
                if (majiang.canOnlyOneCardHu(pi, tData, 2, false)) //modify by wcx 20160919  纠正卡二条的逻辑
                {
                    //判断手牌是否有1个1条和一个3条
                    if (1 <= majiang.hasCardNum(pi.mjhand, 1) && 1 <= majiang.hasCardNum(pi.mjhand, 3) &&
                        (pi.mjhand[pi.mjhand.length - 1] == 2)) {
                        if (withDesc) {
                            /*var sInfo = "卡二条" + "|" + pi.mjhand[pi.mjhand.length-1];
                            pi.mjdesc.push(sInfo);*/
                            pi.mjdesc.push("卡二条");
                        }
                        baseWin *= 2;
                    }

                }
            }

            return baseWin;
        }


        /**
         *  德阳麻将计算番  1.断幺九 2.夹心五 3.姊妹对 4.一条龙
         * @pi 调去该函数玩家
         * @withDesc 带不带描述
         * @tData 牌桌数据　
         * @isCha 是否大叫
         * @genArr 跟的数组
         * @return 番数
         *
         */
        majiang.computeDeYangType = function(pi, withDesc, tData, isCha, genArr) {
                var baseWin = majiang.computeBaseWinBase(pi, withDesc, tData, isCha, genArr);
                var cds = pi.mjhand;
                var otherCards = [].concat(pi.mjchi, pi.mjpeng, pi.mjgang0, pi.mjgang1);
                if (isKa5Xing(cds) == true) //砍5
                {
                    baseWin *= 2;
                    if (withDesc) pi.mjdesc.push("夹心五");
                }
                if (isDouble3Line(cds) == true) //姊妹对
                {
                    baseWin *= 2;
                    if (withDesc) pi.mjdesc.push("姊妹对");
                }
                if (isNoInclude1or9(cds, otherCards) == true) //断幺九
                {
                    baseWin *= 2;
                    if (withDesc) pi.mjdesc.push("断幺九");
                }
                if (is9Line(cds) == true) {
                    baseWin *= 2;
                    if (withDesc) pi.mjdesc.push("一条龙");
                }
                return baseWin;
            }
            /**
             * 是否只湖一张牌
             * @return 是否
             */
        majiang.canOnlyOneCardHu = function(pl, tData, card, isonly) {
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
                    var huType = majiang.canHu(false, mjhand);
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
             * 查大叫
             * @return 查大叫返的分数
             */
        majiang.missHandMax = function(pl, tData, _notdesc) {
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
                var huType = majiang.canHu(false, mjhand);
                //console.info("tryCard "+cdi+" "+huType);
                if (huType > 0) {
                    var oldDesc = pl.mjdesc.slice(0);
                    //是否显示赢描述

                    pl.mjdesc = [];

                    pl.huType = huType;
                    var isCha = tData.blood;
                    var winNum = majiang.computeBaseWin(pl, desc, tData, isCha, []);
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
            return maxWin;
        }

        /**
         * 能否胡牌
         * @no7 有没有7小对
         * @cds 当前手牌(去除碰吃杠掉的牌)
         * @cd  点炮牌
         */
        majiang.canHu = function(no7, cds, cd) {
                var tmp = [];
                for (var i = 0; i < cds.length; i++) {
                    tmp.push(cds[i]);
                }
                if (cd) {
                    tmp.push(cd);
                }
                //
                cds = tmp;
                //排序
                cds.sort(function(a, b) { return a - b });
                var pair = {};
                for (var i = 0; i < cds.length; i++) {
                    if (i < cds.length - 1 && cds[i] == cds[i + 1]) {
                        pair[cds[i]] = cds[i];
                    }
                }
                //判断对牌
                if (Object.keys(pair).length == 0) {
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
                        for (var i = 0; i + off13 < s13.length; i++) {
                            //找13腰的将牌
                            if (pcd == s13[i]) {
                                off13++;
                            }
                            if (left[i] != s13[i + off13]) {
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
            /**
             * @return 是否摸牌杠
             */
        majiang.canGang1 = function(peng, hand, peng4) {
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
        majiang.canGang0 = function(hand, cd) {
                var num = 0;
                for (var i = 0; i < hand.length; i++) {
                    if (hand[i] == cd) num++;
                }
                return num == 3;
            }
            /**
             * 是否碰
             */
        majiang.canPeng = function(hand, cd) {
                var num = 0;
                for (var i = 0; i < hand.length; i++) {
                    if (hand[i] == cd) num++;
                }
                return num >= 2;
            }
            /**
             * 牌的类型的数量
             */
        majiang.cardTypeNum = function(hand, tp) {
                var typeNum = 0;
                for (var i = 0; i < hand.length; i++) {
                    if (Math.floor(hand[i] / 10) == tp) typeNum++;
                }
                return typeNum;
            }
            /**
             * @return 牌数量
             */
        majiang.hasCardNum = function(hand, tp) {
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
        majiang.cardType = function(tp) { return Math.floor(tp / 10) }
            /**
             * @return 是否有跟
             */
        majiang.have4 = function(pl) {
                var cardNum = {};
                var cards = [pl.mjhand, pl.mjchi, pl.mjpeng, pl.mjgang0, pl.mjgang1];
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
                var rtn = 0;
                for (var cd in cardNum) {
                    if (cardNum[cd] == 4 || cardNum[cd] == 5) {

                        if (pl.mjgang0.indexOf(cd) >= 0 || pl.mjgang1.indexOf(cd) >= 0) {
                            var foundWin = false;
                            for (var cduid in pl.gangWin) {
                                //是否杠上炮
                                if (cd == parseInt(cduid.split("|")[0])) {
                                    foundWin = true;
                                }
                            }
                            if (!foundWin) {
                                continue;
                            }
                        }
                        rtn++;
                    }
                }
                return rtn;
            }
            /**
             * 单独检测碰过是否有19
             */
        majiang.pengGameHas19 = function(pl) {
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
             * @return 所有牌是否带19
             */
        majiang.all19 = function(pl) {

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
                if (Object.keys(pair).length == 0) return false;
                var skipPair = 0;
                for (var pairKey in pair) {
                    var pcd = pair[pairKey];
                    var v19 = pcd % 10;
                    if (v19 > 1 && v19 < 9) {
                        skipPair++;
                        //console.info("skip "+pcd);
                        continue;
                    }
                    //console.info("test  "+pcd);

                    var left = [];
                    var pnum = 0;
                    for (var i = 0; i < cds.length; i++) {
                        if (cds[i] == pcd && pnum < 2)
                            pnum++;
                        else left.push(cds[i]);
                    }
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
                    var matchOK = true;
                    for (var i = 0; matchOK && i < segs.length; i++) {
                        seg = segs[i];
                        //console.info("seg "+seg);
                        for (var m = 0; matchOK && m < seg.length;) {
                            if (canMath12(seg, m)) return false;
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
                                                    switch (canMath3(seg, m)) {
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
                return false;
            }
            /**
             * @return 是否能吃
             */
        majiang.canChi = function(hand, cd) {
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
        majiang.OnlyHand = function(pl) {
                return pl.mjpeng.length == 0 && pl.mjgang0.length == 0 && pl.mjchi.length == 0;
            }
            /**
             * 是否清一色
             */
        majiang.SameColor = function(pl, tData) {
                var test = [pl.mjhand, pl.mjpeng, pl.mjgang0, pl.mjgang1, pl.mjchi];
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
            /**
             * 是否大对碰
             * @return 2是否258做将大对碰 1否
             */
        majiang.All3 = function(pl) {
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
            /**
             * 检测停牌
             */
        majiang.checkMJTing = function(pl, tData) {
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
            for (var cd in tryCard) {
                var lastCD = mjhand[mjhand.length - 1];
                var cdi = tryCard[cd];
                mjhand[mjhand.length - 1] = cdi;
                var huType = majiang.canHu(false, mjhand, false, tData);
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
         * @return 所有牌数
         */
        majiang.CardCount = function(pl) {
                var rtn = (pl.mjpeng.length + pl.mjgang0.length + pl.mjgang1.length) * 3 + pl.mjchi.length;
                if (pl.mjhand) rtn += pl.mjhand.length;
                return rtn;
            }
            /**
             * @return 是否14张牌
             */
        majiang.NumOK = function(pl) {
            return pl.mjhand.length + (pl.mjpeng.length + pl.mjgang0.length + pl.mjgang1.length) * 3 + pl.mjchi.length == 14;
        }

        function TestRandomCards() {
            var cards = majiang.randomCards();
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

        function TestHu() {
            var hu = [
                /*
                		   [19,5,8,16,2,23,11,6,31,13,26,1,28,81]
                		   ,[1,9,11,19,21,29,31,41,51,61,71,81,91,71]
                		   ,[1,1, 2,2, 3,3, 4,4, 5,5, 6,6, 7,7]
                		   ,[1,2,3,4,4]
                		   ,[1,1,2,2,3,3,4,4]
                		   ,[8,5,15,14,16,81,6,27,21,22,17,13,12,91]
                		   ,*/
                //[15,17,23,18,16,23,15,15]
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 21, 21, 21, 24, 24]
            ];
            for (var i = 0; i < hu.length; i++) {
                console.info(majiang.canHu(false, hu[i]) + " " + hu[i]);
            }
        }
        //卡2条测试
        function TestHuOneCard() {
            var pl = {};
            pl.mjhand = [1, 2, 4, 5, 6, 7, 8, 9, 21, 21, 21, 24, 24];
            console.info(majiang.canOnlyOneCardHu(pl, null, 2));
        }

        function TestcanGang1() {
            var gang = [
                [
                    [1],
                    [1, 2, 2, 2, 2]
                ],
                [
                    [1],
                    [2, 3]
                ],
            ];
            for (var i = 0; i < gang.length; i++)
                console.info(majiang.canGang1(gang[i][0], gang[i][1]));
        }

        function TestChi() {

            var chi = [

                [1, 2, 4, 5], 3

            ];
            console.info(majiang.canChi(chi, 3));
        }

        function TestMissHandMax() {
            var tests = [
                { name: "1", mjpeng: [28], mjgang0: [], mjgang1: [], mjchi: [], mjhand: [1, 2, 2, 3, 3, 4, 7, 7, 26, 27], mjdesc: [], baseWin: 0 } //根
            ];
            for (var i = 0; i < tests.length; i++) {
                var pl = tests[i];
                if (majiang.CardCount(pl) != 13) {
                    pl.mjdesc.push("牌数不对");
                } else pl.baseWin = majiang.missHandMax(pl);
                console.info(pl.name + " " + pl.mjdesc + "  " + pl.baseWin + " " + pl.mjhand);
            }
        }

        function TestCardType() {
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
                var pl = tests[i];
                if (!majiang.NumOK(pl)) {
                    pl.mjdesc.push("牌数不对");
                    pl.huType = -1;
                } else pl.huType = majiang.canHu(false, pl.mjhand);
                if (pl.huType == 0) {
                    pl.mjdesc.push("不胡");
                } else if (pl.huType > 0) {
                    majiang.computeBaseWin(pl, true);
                }
                console.info(pl.name + " " + pl.mjdesc + "  " + pl.baseWin);
            }
        }


        function DoTest() {
            //TestMissHandMax();
            //TestCardType();
            //TestRandomCards();
            //TestHu();
            //TestcanGang1();
            //TestChi();
            //console.info(majiang.canGang0([2,3,4,3,3],3));
            //console.info(majiang.canPeng([2,3,4,3,3],3));
            //TestHuOneCard();

            var temPl = {};
            temPl.mjpeng=[];
            temPl.mjgang0 = [];
            temPl.mjgang1 =[];
            temPl.mjgang4 =[];
            temPl.mjchi = [];
            temPl.mjhand =[12,13,13,14,14,14,14,15,15,15,16,18,18,13];
            var result = majiang.canHu(false,temPl.mjhand);
            console.log( " relust === " +result );

            //console.info( "double3line t:" + isDouble3Line( tempcards ) );
            //console.info( "1-9 t3:" + isNoInclude1or9( tempcards, [12,12,12] ) );
            //console.info( "ke5 t: " + isKa5Xing( tempcards ) );


        }

        if (typeof(jsclient) != "undefined") {
            jsclient.majiang = majiang;
        } else {
            module.exports = majiang;
            DoTest();
        }


    })();