#zeroModal

##### 弹出层组件

支持弹出常用的模态框，及操作提示框、操作等待层等。支持amd或cmd规范，或直接引入。

组件仓库地址：http://git.oschina.net/cylansad/zeroModal

| 调用方法                                 | 说明                                      |
| ------------------------------------ | --------------------------------------- |
| zeroModal.show(opt)                  | 显示普通的模态框，opt为参数对象，参数内容请参考下面的列表          |
| zeroModal.close(opt/unique)          | 关闭模态框                                   |
| zeroModal.closeAll()                 | 关闭全部模态框                                 |
| zeroModal.loading(type)              | 显示等待框，type为显示等待的类型，目前提供的值为（1、2、3、4、5、6） |
| zeroModal.alert(content/opt)         | 显示提示框                                   |
| zeroModal.error(content/opt)         | 显示错误提示框                                 |
| zeroModal.success(content/opt)       | 显示正确提示框                                 |
| zeroModal.confirm(content/opt, okFn) | 显示确认框                                   |

使用请参考index.html提供的demo



##### 参数说明

| 参数名           | 说明                                       |
| ------------- | ---------------------------------------- |
| title         | 标题                                       |
| content       | 显示内容                                     |
| url           | 如果输入url，将会根据url返回的内容显示在弹出层中              |
| iframe        | 是否需要嵌入iframe，默认false，该参数需要和url一起使用       |
| width         | 宽度（px、pt、%）                              |
| height        | 高度（px、pt、%）                              |
| transition    | 是否需要出场动画，默认false                         |
| overlay       | 是否需要显示遮罩层，默认true                         |
| overlayClose  | 是否允许点击遮罩层直接关闭弹出层，默认false                 |
| opacity  | 遮罩层的透明度，默认0.2                 |
| resize        | 是否允许调整大小，默认false                         |
| resizeAfterFn | 调整大小后触发的事件                               |
| ok            | 是否启用“ok”按钮，默认false                       |
| okTitle       | “ok”按钮的显示值，默认为“确定”                       |
| okFn          | 点击“ok”按钮触发的事件                            |
| cancel        | 是否启用“cancel”按钮，默认false                   |
| cancelTitle   | “cancel”按钮的显示值，默认为“取消”                   |
| cancelFn      | 点击“cancel”按钮触发的事件                        |
| buttons       | 自定义的按钮，使用了自定义按钮ok与cancel按钮将不会生效；格式：`[{ className: 'zeromodal-btn zeromodal-btn-primary', name: '开始导出' }]` |
| esc           | 是否需要按esc键退出弹出层，默认false                   |
| onOpen        | 弹出层弹开前事件                                 |
| onLoad        | 弹出层加载显示内容前事件                             |
| onComplete    | 弹出层加载显示内容后事件                             |
| onCleanup     | 弹出层关闭前事件                                 |
| onClosed      | 弹出层关闭后事件                                 |
| unique        | 模态框的唯一值，默认系统生成UUID，不建议自定义                |