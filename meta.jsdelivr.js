// ==UserScript==
// @name         Bilibili直播间挂机助手3
// @namespace    SeaLoong
// @version      3.1.11
// @description  B站直播间挂机用: 签到，领瓜子，移动端心跳，瓜子换硬币等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLRHH
// @supportURL   https://github.com/SeaLoong/BLRHH/issues
// @updateURL    https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/installer.jsdelivr.user.js
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @license      MIT License
// @require      https://raw.githubusercontent.com/SeaLoong/BLUL/dist/meta.jsdelivr.js
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/main.js
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/main.js
// @resource     EULA https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/html/eula.html
// @resource     NOTICE https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/html/notice.html
// @resource     tfjs https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.3.0/dist/tf.min.js
// @resource     Sign https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/sign.js
// @resource     Exchange https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/exchange.js
// @resource     TreasureBox https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/treasurebox.js
// @resource     TreasureBox/worker https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/treasurebox/worker.js
// @resource     Heartbeat https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/heartbeat.js
// @resource     DailyReward https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/dailyreward.js
// @resource     AvoidDetection https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/avoiddetection.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/toast.js
// @resource     Util https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/util.js
// @resource     Dialog https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/dialog.js
// @resource     Page https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/page.js
// @resource     Logger https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/logger.js
// @resource     Config https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/config.js
// @resource     Request https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/request.js
// @resource     Worker https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker.js
// @resource     Worker/env https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker/env.js
// @resource     Worker/channel https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker/channel.js
// @resource     AppToken https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/apptoken.js
// @connect      bilibili.com
// @connect      *
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @grant        GM.getResourceText
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-start
// @incompatible chrome 不支持内核低于80的版本
// @incompatible firefox 不支持内核低于72的版本
// ==/UserScript==


