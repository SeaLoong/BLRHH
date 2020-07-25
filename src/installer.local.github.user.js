// ==UserScript==
// @name         Bilibili直播间挂机助手alpha
// @namespace    SeaLoong
// @version      3.0.0
// @description  Bilibili直播间自动签到，领瓜子，参加抽奖，完成任务，送礼等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/Bilibili-LRHH
// @supportURL   https://github.com/SeaLoong/Bilibili-LRHH/issues
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
// @resource     EULA https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/eula.html
// @require      https://raw.githubusercontent.com/SeaLoong/BLUL/master/dist/require.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/toast.js
// @resource     Util https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/util.js
// @resource     Dialog https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/dialog.js
// @resource     Page https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/page.js
// @resource     Logger https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/logger.js
// @resource     Config https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/config.js
// @resource     Request https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/request.js
// @resource     Worker https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker.js
// @resource     Worker/env https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/env.js
// @resource     Worker/channel https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/worker/channel.js
// @resource     AppToken https://raw.githubusercontent.com/SeaLoong/BLUL/master/src/modules/apptoken.js
// @require      https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/main.js
// @resource     Sign https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/modules/sign.js
// @resource     Exchange https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/modules/exchange.js
// @resource     TreasureBox https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/modules/treasurebox.js
// @resource     TreasureBox/worker https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/modules/treasurebox/worker.js
// @resource     Heartbeat https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src/modules/heartbeat.js
// ==/UserScript==
