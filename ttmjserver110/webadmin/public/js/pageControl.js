/*
 * author : wanglingyu
 * time : 2016-05-20
 *
 * update:
 * 增加e.data
 * wanglingyu 
 * 20160611
 *
 * 增加更改pageSize的方法
 * wanglingyu
 * 20160611
 *
 * 增加更改isControl的方法
 * wanglingyu
 * 20160810
 *
 * 增加pageSizeChangeg事件
 * wanglingyu
 * 20160830
 *
 * 增加控件不能重复初始化
 */
;(function(win) {
    /*
     * opt.config  object 配置项
     * opt.pageBoxClass : 'page_common',
     * opt.firstPageClass : 'firstPage',
     * opt.lastPageClass : 'lastPage',
     * opt.prevPageClass : 'prevPage',
     * opt.nextPageClass : 'nextPage',
     * opt.pageListClass : 'pageList',
     * opt.activePageClass : 'active',
     * opt.totalItemNumClass : 'totalItemNum',
     * opt.totalPageNumClass : 'totalPageNum',
     * opt.go2PageBtnClass : 'go2PageBtn',
     * opt.go2PageIptClass : 'go2PageIpt',
     * opt.readonlyClass : 'readonly',
     * opt.disabledClass : 'disabled'
     *
     * 实例对象pageControl:
     *      pageControl.init(opt);初始化 opt object:对象参数
     *      pageControl.toPage(vArg,opt);跳转页，vArg:string或number 页码;  opt:object 跳转参数
     *
     *      pageControl.target JQ对象: page控件
     *      pageControl.pageBox JQ对象: pageControl.target第0项
     *      pageControl.firstPage JQ对象: 首页
     *      pageControl.lastPage JQ对象: 尾页
     *      pageControl.prevPage JQ对象: 上一页
     *      pageControl.nextPage JQ对象: 下一页
     *      pageControl.pageList JQ对象: 页码列表
     *      pageControl.totalItemNum JQ对象: 数据总条数
     *      pageControl.totalPageNum JQ对象: 总页数
     *      pageControl.go2PageBtn JQ对象: 跳转页按钮
     *      pageControl.go2PageIpt JQ对象: 跳转页输入框
     *
     *      event:
     *          pageChange(fnEvent);给pageControl对象添加pageChange事件
     *          pageSizeChange(fnEvent);给pageControl对象添加pageSizeChange事件
     *
     * function: 控件化指定DOM
     */
    function PageControl(opt) {
        if (!opt) {
            throw 'page_control method_error : arguments[0] is needful';
        }
        if (!opt.target) {
            throw 'page_control method_error : arguments[0].target is needful';
        }
        var config = PageControl.config;

        //配置PageControl.config
        if ( typeof opt.config == 'object') {
            for (var attr in config) {
                attr in opt.config && (config[attr] = opt.config[attr]);
            }
        }

        this.pageBoxClass = opt.pageBoxClass || config.defaultOption.pageBoxClass;
        this.pageSizeClass = opt.pageSizeClass || config.defaultOption.pageSizeClass;
        this.firstPageClass = opt.firstPageClass || config.defaultOption.firstPageClass;
        this.lastPageClass = opt.lastPageClass || config.defaultOption.lastPageClass;
        this.prevPageClass = opt.prevPageClass || config.defaultOption.prevPageClass;
        this.nextPageClass = opt.nextPageClass || config.defaultOption.nextPageClass;
        this.pageListClass = opt.pageListClass || config.defaultOption.pageListClass;
        this.activePageClass = opt.activePageClass || config.defaultOption.activePageClass;

        this.totalItemNumClass = opt.totalItemNumClass || config.defaultOption.totalItemNumClass;
        this.totalPageNumClass = opt.totalPageNumClass || config.defaultOption.totalPageNumClass;
        this.go2PageBtnClass = opt.go2PageBtnClass || config.defaultOption.go2PageBtnClass;
        this.go2PageIptClass = opt.go2PageIptClass || config.defaultOption.go2PageIptClass;

        this.disabledClass = opt.disabledClass || config.defaultOption.disabledClass;
        this.readonlyClass = opt.readonlyClass || config.defaultOption.readonlyClass;

        var pageControls = [];

        if (!this.init) {
            PageControl.prototype.init = function(opt) {
                if (!opt) {
                    //throw 'page_control method_error : arguments[0] is needful';
                    throw '分页控件 方法调用错误 : 第一个参数必传';
                }
                if (!opt.target) {
                    //throw 'page_control method_error : arguments[0].target is needful';
                    throw '分页控件 方法调用错误 : 第一个参数的target属性必须存在';
                }
                var conf = config;
                var target = this.target = $(opt.target);

                if (this.isControl(target)) {
                    throw '分页控件 方法调用错误 : 当前控件已经初始化';
                }

                this.curPage = opt.curPage || 1;
                //this.curPageSize = opt.curPageSize || 10;
                this.pageSize = opt.pageSize || 50;
                this.totalPage = opt.totalPage || 0;
                this.totalItem = opt.totalItem || 0;

                this.showPageNum = opt.showPageNum || conf.showPageNum;
                if (this.showPageNum % 2 == 0) {
                    this.showPageNum++;
                }

                this.pageChange = opt.pageChange;
                this.pageSizeChange = opt.pageSizeChange;
                var pattern = this.pattern = opt.pattern || conf.pattern;
                var me = this;
                if (this.target.length <= 0) {
                    throw 'pageControl error : opt.target.length == 0';
                }
                var pageBox = this.pageBox = this.target.eq(0);
                this.pageSizeSelect = pageBox.find('.' + this.pageSizeClass).find('select');

                this.firstPage = pageBox.find('.' + this.firstPageClass);
                this.lastPage = pageBox.find('.' + this.lastPageClass);
                this.prevPage = pageBox.find('.' + this.prevPageClass);
                this.nextPage = pageBox.find('.' + this.nextPageClass);
                this.pageList = pageBox.find('.' + this.pageListClass);
                this.totalItemNum = pageBox.find('.' + this.totalItemNumClass);
                this.totalPageNum = pageBox.find('.' + this.totalPageNumClass);
                this.go2PageBtn = pageBox.find('.' + this.go2PageBtnClass);
                this.go2PageIpt = pageBox.find('.' + this.go2PageIptClass);

                //清空
                this.go2PageIpt.val('');

                this.pageSizeSelect.on('change', function() {
                    var oSel = $(this);
                    $.each(me.pageSizeChangeQueue, function(i) {
                        return me.pageSizeChangeQueue[i].call(me, {
                            pageSize : Number(oSel.val()),
                            action : 'operate'
                        });
                    });
                });

                this.pageSizeSelect.val(this.pageSize);

                if (pattern == 'ease') {
                    this.firstPage.hide();
                    this.lastPage.hide();
                    this.totalItemNum.hide();
                    this.totalPageNum.hide();
                    this.go2PageBtn.closest('section').hide();
                } else {
                    this.firstPage.attr('e-control', 'firstPage');
                    this.lastPage.attr('e-control', 'lastPage');
                    this.go2PageBtn.attr('e-control', 'go2PageBtn');

                    var format = opt.format || conf.format;
                    this.totalPageNum.html(format.totalPageNumFormat.replace('{{$}}', this.totalPage));
                    this.totalItemNum.html(format.totalItemNumFormat.replace('{{$}}', this.totalItem));

                    this.go2PageIpt[0].pageControl = this;
                    this.go2PageIpt.on('input', _userOperate);
                    this.go2PageIpt.on('keypress', function(e) {
                        if (e.keyCode == 13) {
                            me.getState() == 'normal' && _userOperate.call(this, 'keypress');
                        }
                    });
                }

                this.pageList.html('');
                for (var i = 0; i < this.totalPage && i < this.showPageNum; i++) {
                    var oLi = $('<li></li>');
                    oLi.attr('e-control', 'page');
                    this.pageList.append(oLi);
                }
                this.pages = this.pageList.children();

                this.prevPage.attr('e-control', 'prevPage');
                this.nextPage.attr('e-control', 'nextPage');

                var pageChangeQueue = [];
                if (this.pageChange) {
                    if ( typeof this.pageChange == 'function') {
                        pageChangeQueue.push(this.pageChange);
                    } else {
                        $.each(this.pageChange, function() {
                            pageChangeQueue.push(this);
                        });
                    }
                }
                this.pageChangeQueue = pageChangeQueue;

                var pageSizeChangeQueue = [];
                if (this.pageSizeChange) {
                    if ( typeof this.pageSizeChange == 'function') {
                        pageSizeChangeQueue.push(this.pageSizeChange);
                    } else {
                        $.each(this.pageSizeChange, function() {
                            pageSizeChangeQueue.push(this);
                        });
                    }
                }
                this.pageSizeChangeQueue = pageSizeChangeQueue;

                pageBox.on('click', '[e-control]', function() {
                    if (me.getState() == 'normal') {
                        var item = $(this);
                        var eControl = item.attr('e-control');
                        if (item.attr('e-state') != 'readonly') {
                            switch(eControl) {
                                case 'firstPage':
                                    me.toPage(1, {
                                        action : 'firstPage'
                                    });
                                    break;
                                case 'lastPage':
                                    me.toPage(me.totalPage, {
                                        action : 'lastPage'
                                    });
                                    break;
                                case 'prevPage':
                                    me.toPage(me.curPage - 1, {
                                        action : 'prevPage'
                                    });
                                    break;
                                case 'nextPage':
                                    me.toPage(me.curPage + 1, {
                                        action : 'nextPage'
                                    });
                                    break;
                                case 'page':
                                    var pageNum = item.attr('pageNum');
                                    me.curPage == pageNum || me.toPage(Number(pageNum), {
                                        action : 'page'
                                    });
                                    break;
                                case 'go2PageBtn':
                                    var pageNum = me.go2PageIpt.val();
                                    me.curPage == pageNum || (pageNum && me.toPage(Number(pageNum), {
                                        action : 'go2PageBtn'
                                    }));
                                    me.go2PageIpt.val('');
                                    break;
                            }
                        }
                    }
                });

                this.toPage(this.curPage, {
                    action : 'init'
                });

                pageControls.push(pageBox[0]);
            };

            PageControl.prototype.updatePage = function(opt) {
                this.curPage = opt.curPage || this.curPage;
                //this.curPageSize = opt.curPageSize || this.curPageSize;
                this.pageSize = 'pageSize' in opt ? opt.pageSize : this.pageSize;
                this.totalPage = 'totalPage' in opt ? opt.totalPage : this.totalPage;
                this.totalItem = 'totalItem' in opt ? opt.totalItem : this.totalItem;
                this.pageChange = 'pageChange' in opt ? opt.pageChange : this.pageChange;
                this.pageSizeChange = 'pageSizeChange' in opt ? opt.pageSizeChange : this.pageSizeChange;
                var pageChangeQueue = [];
                if (this.pageChange) {
                    if ( typeof this.pageChange == 'function') {
                        pageChangeQueue.push(this.pageChange);
                    } else {
                        $.each(this.pageChange, function() {
                            pageChangeQueue.push(this);
                        });
                    }
                }
                this.pageChangeQueue = pageChangeQueue;

                this.pageSizeSelect.val(this.pageSize);

                var pageSizeChangeQueue = [];
                if (this.pageSizeChange) {
                    if ( typeof this.pageSizeChange == 'function') {
                        pageSizeChangeQueue.push(this.pageSizeChange);
                    } else {
                        $.each(this.pageSizeChange, function() {
                            pageSizeChangeQueue.push(this);
                        });
                    }
                }
                this.pageSizeChangeQueue = pageSizeChangeQueue;

                if (this.pattern != 'ease') {
                    var format = opt.format || config.format;
                    this.totalPageNum.html(format.totalPageNumFormat.replace('{{$}}', this.totalPage));
                    this.totalItemNum.html(format.totalItemNumFormat.replace('{{$}}', this.totalItem));
                }

                this.pageList.html('');
                for (var i = 0; i < this.totalPage && i < this.showPageNum; i++) {
                    var oLi = $('<li></li>');
                    oLi.attr('e-control', 'page');
                    this.pageList.append(oLi);
                }
                this.pages = this.pageList.children();

                var action = opt.action || 'init';
                this.toPage(this.curPage, {
                    action : 'init'
                });
            };

            PageControl.prototype.toPage = function(vArg, opt) {
                var I = this;
                opt = opt || {};
                var pages = this.totalPage;
                if (pages <= 0) {
                    //return;
                }
                var pageNum = null;
                switch(typeof vArg) {
                    case 'number':
                        pageNum = vArg;
                        break;
                    case 'string':
                        switch(vArg) {
                            case 'first':
                                pageNum = 1;
                                break;
                            case 'last':
                                pageNum = pages;
                                break;
                            case 'next':
                                pageNum = this.curPage + 1;
                                break;
                            case 'prev':
                                pageNum = this.curPage - 1;
                                break;
                        }
                        pageNum = vArg;
                        break;
                }
                if (this.curPage == pageNum && opt.action != 'init') {
                    return;
                }
                if (pageNum < 1) {
                    pageNum = 1;
                } else if (pageNum > pages) {
                    pageNum = pages;
                }

                var sAct = pageNum <= 1 ? 'attr' : 'removeAttr';
                var sAct2 = (pageNum <= 1 ? 'add' : 'remove') + 'Class';
                this.firstPage[sAct]('e-state', 'readonly')[sAct2](this.readonlyClass);
                this.prevPage[sAct]('e-state', 'readonly')[sAct2](this.readonlyClass);

                var sAct = pageNum >= pages ? 'attr' : 'removeAttr';
                var sAct2 = (pageNum >= pages ? 'add' : 'remove') + 'Class';
                this.lastPage[sAct]('e-state', 'readonly')[sAct2](this.readonlyClass);
                this.nextPage[sAct]('e-state', 'readonly')[sAct2](this.readonlyClass);

                this.curPage = pageNum;

                var sActive = this.activePageClass;
                var iIndex = pageNum - 1;

                var iMiddle = Math.floor(this.showPageNum / 2);
                if (pages > this.showPageNum && pageNum > iMiddle + 1) {
                    iIndex = pageNum <= (pages - iMiddle) ? iMiddle : iMiddle + (pageNum - (pages - iMiddle));
                }

                this.pages.each(function(i) {
                    var I = $(this);
                    var iNum = pageNum - iIndex + i;
                    var act = i == iIndex ? 'add' : 'remove';
                    I[act+'Class'](sActive);
                    I.html(iNum);
                    I.attr('pageNum', iNum);
                });

                $.each(this.pageChangeQueue, function(i) {
                    return I.pageChangeQueue[i].call(I, {
                        curPage : pageNum,
                        action : opt.action,
                        data : opt.data
                    });
                });
            };

            PageControl.prototype.setState = function(state) {
                switch(state) {
                    case 'disabled':
                    case 'readonly':
                        break;
                    default:
                        state = 'normal';
                        break;
                }
                this.pageBox.attr('e-state', state);
            };

            PageControl.prototype.getState = function() {
                var state = this.pageBox.attr('e-state');
                switch(state) {
                    case 'disabled':
                    case 'readonly':
                        break;
                    default:
                        state = 'normal';
                        break;
                }
                return state;
            };

            PageControl.prototype.isControl = function(target) {
                target = $(target)[0];
                for (var i = 0; i < pageControls.length; i++) {
                    if (pageControls[i] == target) {
                        return true;
                    }
                }

                return false;
            };
        }

        config.autoInit && this.init(opt);

        this.setState(this.getState());

        function _userOperate(_action) {
            var pageControl = this.pageControl;
            var oIpt = $(this);
            var val = oIpt.val().trim().replace(/\D/g, '');
            oIpt.val(val);
            if (val && pageControl.getState() == 'normal') {
                var page = Number(val);
                if (val > pageControl.totalPage) {
                    oIpt.val(pageControl.totalPage);
                    page = pageControl.totalPage;
                } else if (val < 1) {
                    oIpt.val(1);
                    page = 1;
                }
                _action == 'keypress' && (pageControl.toPage(page, {
                    action : 'jump'
                }), oIpt.val(''));
            } else {
                oIpt.val('');
            }
        }

    }


    PageControl.config = {
        autoInit : true,
        defaultOption : {
            pageBoxClass : 'page_common',
            pageSizeClass : 'pageSize',
            firstPageClass : 'firstPage',
            lastPageClass : 'lastPage',
            prevPageClass : 'prevPage',
            nextPageClass : 'nextPage',
            pageListClass : 'pageList',
            activePageClass : 'active',
            totalItemNumClass : 'totalItemNum',
            totalPageNumClass : 'totalPageNum',
            go2PageBtnClass : 'go2PageBtn',
            go2PageIptClass : 'go2PageIpt',
            readonlyClass : 'readonly',
            disabledClass : 'disabled'
        },
        pattern : 'complex', //'ease' 'complex'
        format : {
            totalItemNumFormat : '共<span>{{$}}</span>条',
            totalPageNumFormat : '共{{$}}页'
        },
        showPageNum : 5
    };

    win.components || (win.components = {});
    win.components.PageControl = PageControl;
    win.components.pageControl = function(opt) {
        return new PageControl(opt);
    };
})(this);
