# README

## cpzip2web.sh脚本说明
### 负载均衡更新
<pre>
1. cpzip2web.sh 用途：通用负载均衡服务器或者更新以后的项目的服务器执行的脚本
    浙江麻将样例：sh cpzip2web.sh zjmj

2. cpzip2web_new.sh 用途：老负载均衡切换为新git的脚本
    样例：sh cpzip2web_new.sh zjmj
    
    为了把控进度，拆分成了两个脚本：cpzip2web_newClone.sh，cpzip2web_newMv.sh
    cpzip2web_newClone.sh 克隆项目_web,项目_zip
    样例：sh cpzip2web_newClone.sh zjmj
    
    cpzip2web_newMv.sh  老项目改名，做ln，nginx重启
    样例：sh cpzip2web_newMv.sh zjmj
 
</pre>


### 数据服和房间服链接服等更新
<pre>
1. cpzip2web_data.sh 数据服切换新git，以后更新也可以用
    样例：sh cpzip2web_data.sh zjmj

2. cpzip2web_room.sh zjmj 房间服切换新git和更新，
    样例： sh cpzip2web_room.sh zjmj
    
    切换和更新目前均可用，更新支持不太好，会把老目录mv成bak，
    可以暂时到项目目录/root/zjmj/,手动git pull 即可
    样例：
    cd /root/zjmj/
    git pull

</pre>




