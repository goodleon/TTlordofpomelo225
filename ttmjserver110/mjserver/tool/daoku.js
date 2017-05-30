var process = require('child_process');

//数组里面放的是 需要导库的表名称
var datas = [

];

var index = 0;
var length = datas.length;

dodata();


function dodata() {

    var smd = 'mongodump -h 数据服内网Ip地址 -d 数据库名称 -c ' + datas[index] + ' -o /root/db';
    console.info(smd);
    process.exec(smd,

        function(error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {

                index++;
                if (index < length) {
                    setTimeout(function() {
                        dodata();
                    }, 4000);

                } else {
                    console.log('Done');
                }
            }
        });

}