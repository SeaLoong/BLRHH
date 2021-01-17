# Bilibili直播间挂机助手3

+ [Github项目地址](https://github.com/SeaLoong/BLRHH)

![Tampermonkey4.10](https://img.shields.io/badge/Tampermonkey4.10-pass-green.svg?longCache=true) ![Chromium80](https://img.shields.io/badge/Chromium80-pass-green.svg?longCache=true) ![Firefox72](https://img.shields.io/badge/Firefox72-pass-green.svg?longCache=true) [![Issues](https://img.shields.io/github/issues/SeaLoong/BLRHH.svg)](https://github.com/SeaLoong/BLRHH/issues)

+ 该脚本为 Tampermonkey 脚本，只在该环境下测试通过，使用其它脚本插件来加载此脚本的，不保证能正常运行。
+ 由于使用了比较新的语言特性，内核版本为 Chromium80 或 Firefox72 以下的版本无法使用。
+ 在 Tampermonkey 脚本设置中需要将此脚本的设置 “仅在顶层页面（框架）运行” 设置为否(默认为否)才使脚本在特殊直播间运行。

----------------------------------

## 如何使用

1. 安装 **油猴插件**(Tampermonkey/Greasemonkey/Violentmonkey等)，可以参考 [GreasyFork](https://greasyfork.org/zh-CN) 首页说明。
2. 安装插件，可从以下两种方式选择安装：
   + 点击 [安装脚本(github)](https://raw.githubusercontent.com/SeaLoong/BLRHH/dist/installer.github.user.js) 或 [安装脚本(jsdelivr)](https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/installer.jsdelivr.user.js) ，脚本管理器会弹出安装脚本页面，即可从Github更新脚本。
     + 如果没有出现脚本管理器的安装页面，则需要将代码复制下来。然后从脚本管理器中新建一个脚本，将自动生成的内容删除，粘贴复制的代码并保存。
   + 进入 [Bilibili直播间挂机助手](https://greasyfork.org/zh-CN/scripts/37095-bilibili%E7%9B%B4%E6%92%AD%E9%97%B4%E6%8C%82%E6%9C%BA%E5%8A%A9%E6%89%8B) 页面，点击 **安装此脚本** 即可从 GreasyFork 更新脚本。
3. 进入直播间页面，右上方多出如 "弹幕" "日志" "设置" 等选项，选择自己需要的功能，保存即可。

----------------------------------

## 功能

> 其余功能正在重新实现中

+ 签到
  + 直播签到
  + 应援团签到
+ 宝箱
  + 银瓜子宝箱领取（现已无效）
  + 金宝箱抽奖（即实物抽奖）参加
+ 心跳
  + 移动端
+ 兑换
  + 银瓜子兑换硬币
  + 硬币兑换银瓜子
+ 每日奖励（主站）
  + 签到
  + 观看
  + 投币
  + 分享
+ 避免挂机检测

----------------------------------

## 已知问题

+ 部分功能与别的浏览器插件/脚本不兼容，如
  + pakku – 哔哩哔哩弹幕过滤器\[Chrome、Firefox 扩展\] 与 银瓜子宝箱领取（现已无效） 不兼容

----------------------------------

## 捐赠作者

+ 支付宝 => ![支付宝二维码](https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/img/AliPay.png) 微信 => ![微信二维码](https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/img/WeChat.png)

----------------------------------

## 开源许可证

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/SeaLoong/BLRHH/blob/master/LICENSE)

+ 本项目中使用到的库
  + [BLUL](https://github.com/SeaLoong/BLUL) - [![MIT License](https://img.shields.io/badge/License-MIT-green.svg?longCache=true)](https://github.com/SeaLoong/BLUL/blob/master/LICENSE)
  + [tfjs](https://github.com/tensorflow/tfjs) - [![Apache-2.0 License](https://img.shields.io/badge/License-Apache--2.0-blue.svg?longCache=true)](https://github.com/tensorflow/tfjs/blob/master/LICENSE)

----------------------------------

## 更新日志

+ 3.1.11 (2020-01-17)
  + 修复给满级勋章对应的应援团签到时总跳出“应援失败”的问题。

[完整日志](https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/update-log.md)

----------------------------------

## 鸣谢

+ [Alexander Xia](https://github.com/xfl03)
+ [Jokin](https://github.com/jokin1999)
+ [Misha](https://github.com/Mishasama)

以及所有提出过建议和意见的用户
