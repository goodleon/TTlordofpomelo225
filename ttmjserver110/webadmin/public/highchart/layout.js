function addNewTab(title, url) {

        //$(this).add
        if(title=="数据分析"){

            if($('#tabs').tabs("exists","数据分析")){

                $('#tabs').tabs("select","数据分析");

            }else{

                $('#tabs').tabs('add', {
                    title: "数据分析",
                    content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                        ' allowtransparency="yes" src="bulletinboard.html" ></iframe>',
                    closable: true,
                    tools:[{
                            iconCls:'icon-mini-refresh',
                            handler:function(){
                               var currTab = $('#tabs').tabs('getSelected'); //获得当前tab
                               var url = $(currTab.panel('options').content).attr('src');
                               $('#tabs').tabs('update', {
                                tab : currTab,
                                options : {
                                    content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                                             ' allowtransparency="yes" src="bulletinboard.html" ></iframe>'
                                }
                            });
                            }
                        }]
                });

            }
        }
        else{
                if (tabCache[title] == undefined) {
                if (url == ''||url==undefined) return;
                $('#tabs').tabs('add', {
                    title: title,
                    content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                        ' allowtransparency="yes" src="' + url + '" ></iframe>',
                    closable: true,
                    tools:[{
                            iconCls:'icon-mini-refresh',
                            handler:function(){
                               var currTab = $('#tabs').tabs('getSelected'); //获得当前tab
                               var url = $(currTab.panel('options').content).attr('src');
                               $('#tabs').tabs('update', {
                                tab : currTab,
                                options : {
                                    content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                                             ' allowtransparency="yes" src="' + url + '" ></iframe>'
                                }
                            });
                            }
                        }]
                });
            } else {

                    $('#tabs').tabs('select', parseInt(tabCache[title]));

            }
    }
}
//以下是对左边菜单栏进行选择时进行的清除其它菜单的选中只选中一个菜单的功能实现
function clearother(node){

    for(var i=2;i<40;i++) {
        $("#_easyui_tree_" + i).removeClass("tree-node-selected");
    }
    $("#"+node.domId).addClass("tree-node-selected");
}
var tabCache = new Object;

$(function () {
     //打开页面后首页展示数据
     $('#tabs').tabs('add', {
            title: "数据分析",
            content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                ' allowtransparency="yes" src="bulletinboard.html" ></iframe>',
            closable: true,
            tools:[{
                    iconCls:'icon-mini-refresh',
                    handler:function(){
                       var currTab = $('#tabs').tabs('getSelected'); //获得当前tab
                       var url = $(currTab.panel('options').content).attr('src');
                       $('#tabs').tabs('update', {
                        tab : currTab,
                        options : {
                            content: '<iframe width="100%" height="99%" frameborder="0" marginwidth="5" marginheight="5" ' +
                                     ' allowtransparency="yes" src="bulletinboard.html" ></iframe>'
                        }
                    });
                    }
                }]
        });
    $('#tabs').tabs({
        onSelect: function (title, index) {
            tabCache[title] = index;
            var treelen=$(".easyui-tree").length-1;
            var treenodelen=$(".tree-node").length+1;
            //以下是选择tab栏时选中对应左边的菜单栏选项的实现
            for(var i=2;i<treenodelen;i++) {
                $("#_easyui_tree_" + i).removeClass("tree-node-selected");
            }
            for(var k=0;k<treelen;k++){
                var nodes=$("#tr"+k).tree('getChildren');
                for(var j=0;j<nodes.length;j++){
                    if(title==nodes[j].text){
                        $("#tr"+k).tree('select',nodes[j].target);
                        $("#"+nodes[j].domId).addClass("tree-node-selected");
                    }
                }
            }
        },
        onBeforeClose: function (title, index) {
            return confirm('您确定要关闭“' + title + '”吗？');
        },
        onClose: function (title, index) {
            delete tabCache[title];

        }
    });
});