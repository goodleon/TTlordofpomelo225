
var aa = [
    931,
    208,
    9,
    60,
    969,
    1313,
    222,
    820,
    1083,
    1974,
    1643,
    1746,
    2111,
    1816,
    2065,
    1667,
    1519,
    2013,
    1992,
    1516,
    1750,
    1920,
    2368,
    1947,
    1859,
    1965,
    2018,
    1499,
    2297,
    2429,
    1579,
    2099,
];

var total = 0;
for(var i = 0; i < aa.length; i++)
{
    total += aa[i];
}

function convertNUM(beforeCountTest) {
    //转换之前的科学计数法表示
    var tempValue = beforeCountTest;
    var tempValueStr = tempValue +"";
    console.log(tempValue);
    if ((tempValueStr.indexOf('E') != -1)
        || (tempValueStr.indexOf('e') != -1))
    {
        console.log(tempValueStr + '是科学计数法表示!');
        var regExp = new RegExp('^((\\d+.?\\d+)[Ee]{1}(\\d+))$', 'ig');
        var result = regExp.exec(tempValue);
        var resultValue = "";
        var power = "";
        if (result != null)
        {
            resultValue = result[2];
            power = result[3];
            result = regExp.exec(tempValueStr);
        }
        if (resultValue != "") {
            if (power != "")
            {
                var powVer = Math.pow(10, power);
                console.log("10的" + power + "次方[" + powVer + "]");
                resultValue = resultValue * powVer;
            }
        }
        // $('afterCountTest').value = resultValue;
        console.log(resultValue);
    }

}
console.log('total', 2984239 - 2240630);