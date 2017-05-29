/**
 * Created by wangxiaolei on 2017/2/22.
 * 创建图标
 */
var MaskUtil = (function(){

    var $mask,$maskMsg;

    var defMsg = '正在处理，请稍待。。。';

    function init(){
        if(!$mask){
            $mask = $("<div class=\"datagrid-mask mymask\"></div>").appendTo("body");
        }
        if(!$maskMsg){
            $maskMsg = $("<div class=\"datagrid-mask-msg mymask\">"+defMsg+"</div>")
                .appendTo("body").css({'font-size':'12px','z-index':9999});
        }

        $mask.css({width:"100%",height:$(document).height()});

        $maskMsg.css({
            left:($(document.body).outerWidth(true) - 190) / 2,top:($(window).height() - 45) / 2
        });

    }

    return {
        mask:function(msg){
            init();
            $mask.show();
            $maskMsg.html(msg||defMsg).show();
        }
        ,unmask:function(){
            $mask.hide();
            $maskMsg.hide();
        }
    }

}());