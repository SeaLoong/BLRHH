# Bilibili直播间挂机助手/Bilibili-LRHH/BLRHH

![ECMAScript2016](https://img.shields.io/badge/ECMAScript-2016-green.svg?longCache=true) ![TamperMonkey](https://img.shields.io/badge/TamperMonkey-pass-green.svg?longCache=true) ![Chromium_67](https://img.shields.io/badge/Chromium_67-pass-green.svg?longCache=true) ![Firefox_61](https://img.shields.io/badge/Firefox_61-pass-green.svg?longCache=true)
 [![Issues](https://img.shields.io/github/issues/SeaLoong/Bilibili-LRHH.svg)](https://github.com/SeaLoong/Bilibili-LRHH/issues)

> 该脚本为TamperMonkey脚本，只在该环境下测试通过，使用其它脚本插件来加载此脚本的，不能保证正常运行

-----------------

## 如何使用
1. 见[GreasyFork](https://greasyfork.org/zh-CN) 首页说明
2. 进入[Bilibili直播间挂机助手](https://greasyfork.org/zh-CN/scripts/37095-bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B)页面，点击"安装此脚本"即可从GreasyFork更新此脚本
3. 或者点击上方的[Bilibili直播间挂机助手](https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/master/Bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B.js)，将代码复制下来。然后从脚本管理器中新建一个脚本，将自动生成的内容删除，粘贴复制的代码即可从Github更新此脚本

-----------------

## 已实现功能
+ 自动签到
+ 自动领取银瓜子
+ 自动应援团签到
+ 移动端心跳
+ 自动抽奖
+ 自动完成任务
+ 自动送礼物
+ 银瓜子换硬币

-----------------

## 注意
    自动抽奖功能有封号风险，使用前请做好心理准备
    挂在直播间过久极有可能导致页面崩溃(吃内存过多)

-----------------

## 捐赠作者

+ 投喂QQ：984391132
+ ![支付宝](https://i.loli.net/2018/08/02/5b622e36a0f41.png)  ![微信](https://i.loli.net/2018/08/02/5b622e36a1002.png)
+ ---------↑↑↑↑↑↑↑↑支付宝↑↑↑↑↑↑↑↑------------------------↑↑↑↑↑↑↑↑微信↑↑↑↑↑↑↑↑

-----------------

## 许可证
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?longCache=true)](https://github.com/SeaLoong/Bilibili-LRHH/blob/master/LICENSE)

-----------------

## 更新日志
> ###  2018-08-02 (Version 2.0.0)
>     增加了自动应援团签到的功能
>     增加了移动端心跳的功能(可配合自动完成任务来完成双端观看)
>     增加了银瓜子换硬币的旧API兑换功能
>     增加了自动抽奖->总督领奖的功能
>     增加了自动抽奖->实物抽奖的功能
>     重新命名了自动抽奖功能，现为自动抽奖->礼物抽奖功能
>     增加了自动抽奖->礼物抽奖的自定义设置
>     修改了自动抽奖->礼物抽奖的检测方式
>     修改了自动抽奖->礼物抽奖的参与方式
>     降低了自动抽奖->礼物抽奖功能的内存占用
>     调整了浮动提示的位置
>     优化了设置界面的生成方式
>     移除了未实现的节奏风暴代码部分
>     在GreasyFork上恢复脚本
> ### 2018-05-19
>     更新API，优化代码，第二次尝试规避封号
> ### 2018-05-12
>     更新API相关，优化逻辑，尝试规避封号
> ### 2018-04-30
>     更新验证码识别算法，修复无法正常领取瓜子的问题
>     增加新的设置项
> ### 2018-03-31
>     更新总督API相关(缺少数据,功能未实装)
> ### 2018-03-10
>     在Github上创建脚本仓库
>     更新领取银瓜子的功能
> -----------------
> ### 2018-02-15
>     修正了节奏风暴有关功能的实现逻辑
>     在GreasyFork上删除脚本
> ### 2018-02-12
>     解决了不能在任意直播间参加抽奖的问题(实验性)(需在设置中勾选)
> ### 2018-02-10
>     修复了不能领取银瓜子的问题
> ### 2018-02-04
>     增加了银瓜子兑换硬币的功能
>     修改了默认设置
>     调整了设置界面的位置
> ### 2018-01-28
>     调整了设置界面
>     修改了送礼逻辑
> ### 2018-01-22
>     增加了可视设置界面和保存设置的功能
>     增加了新的设置项
>     移除了使用银瓜子送礼的功能
>     修复了会自动送出永久期限礼物的bug(未测试)
>     优化了领取瓜子信息的界面设计
>     优化了抽奖计时逻辑
> ### 2018-01-20
>     优化了抽奖功能，调整了浮动提示
> ### 2018-01-18
>     修复了不能正常参加新春抽奖的问题
> ### 2018-01-13
>     修复了领取宝箱的有关bug
> ### 2018-01-12
>     增加了自定义送礼等功能，优化了脚本逻辑
> ### 2018-01-09
>     修复了脚本不能运行的问题
> ### 2018-01-06
>     在GreasyFork上创建脚本
-----------------