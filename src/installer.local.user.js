// ==UserScript==
// @name         Bilibili直播间挂机助手3
// @namespace    SeaLoong
// @version      3.1.1
// @description  B站直播间挂机用: 签到，领瓜子，移动端心跳，瓜子换硬币等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLRHH
// @supportURL   https://github.com/SeaLoong/BLRHH/issues
// @updateURL    https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/installer.local.user.js
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
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
// @license      MIT License
// @compatible   chrome 支持80或更高的版本
// @resource     EULA https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/eula.html
// @resource     NOTICE https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/notice.html
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/dist/require.js
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/main.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/toast.js
// @resource     Util https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/util.js
// @resource     Dialog https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/dialog.js
// @resource     Page https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/page.js
// @resource     Logger https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/logger.js
// @resource     Config https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/config.js
// @resource     Request https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/request.js
// @resource     Worker https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/worker.js
// @resource     Worker/env https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/worker/env.js
// @resource     Worker/channel https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/worker/channel.js
// @resource     AppToken https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/src/modules/apptoken.js
// @resource     Sign https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/sign.js
// @resource     Exchange https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/exchange.js
// @resource     TreasureBox https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/treasurebox.js
// @resource     TreasureBox/worker https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/treasurebox/worker.js
// @resource     Heartbeat https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/heartbeat.js
// @resource     DailyReward https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/modules/dailyreward.js
// ==/UserScript==
