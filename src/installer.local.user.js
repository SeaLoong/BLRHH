// ==UserScript==
// @name         Bilibili直播间挂机助手alpha
// @namespace    SeaLoong
// @version      3.0.0
// @description  Bilibili直播间自动签到，领瓜子，参加抽奖，完成任务，送礼等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/Bilibili-LRHH
// @supportURL   https://github.com/SeaLoong/Bilibili-LRHH/issues
// @include      /^https?:\/\/live\.bilibili\.com\/\d+.*$/
// @include      /^https?:\/\/live\.bilibili\.com\/blanc\/\d+.*$/
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
// @resource     EULA https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/eula.html
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/dist/require.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/toast.js
// @resource     Util https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/util.js
// @resource     Dialog https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/dialog.js
// @resource     Page https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/page.js
// @resource     Logger https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/logger.js
// @resource     Config https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/config.js
// @resource     Request https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/request.js
// @resource     Worker https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/worker.js
// @resource     Worker/env https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/worker/env.js
// @resource     Worker/channel https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/worker/channel.js
// @resource     AppClient https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@master/src/modules/appclient.js
// @require      https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/main.js
// @resource     Sign https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/modules/sign.js
// @resource     Exchange https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/modules/exchange.js
// @resource     TreasureBox https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/modules/treasurebox.js
// @resource     TreasureBox/worker https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/modules/treasurebox/worker.js
// @resource     Heartbeat https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src/modules/heartbeat.js
// ==/UserScript==
