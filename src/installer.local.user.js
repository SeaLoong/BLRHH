// ==UserScript==
// @name         Bilibili直播间挂机助手alpha
// @namespace    SeaLoong
// @version      3.0.0
// @description  Bilibili直播间自动签到，领瓜子，参加抽奖，完成任务，送礼等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/Bilibili-LRHH
// @supportURL   https://github.com/SeaLoong/Bilibili-LRHH/issues
// @include      https://live.bilibili.com/4991758*
// @include      /^https?:\/\/live\.bilibili\.com\/blanc\/\d+.*$/
// @connect      bilibili.com
// @connect      *
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValue
// @grant        GM.getResourceUrl
// @grant        GM.notification
// @grant        GM.openInTab
// @grant        GM.setClipboard
// @grant        GM.xmlHttpRequest
// @grant        window.close
// @grant        window.focus
// @grant        GM.addStyle
// @grant        GM.addValueChangeListener
// @grant        GM.removeValueChangeListener
// @grant        GM.getResourceText
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @grant        GM.download
// @grant        GM.getTab
// @grant        GM.saveTab
// @grant        GM.getTabs
// @run-at       document-start
// @license      MIT License
// @require      https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/import.js
// @require      https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/main.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     toastr.css https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.css
// @resource     Toast https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/toast.js
// @resource     Util https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/util.js
// @resource     Dialog https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/dialog.js
// @resource     Page https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/page.js
// @resource     Logger https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/logger.js
// @resource     Config https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/config.js
// @resource     Request https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/request.js
// @resource     Sign https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/sign.js
// @resource     Exchange https://gitee.com/SeaLoong/Bilibili-LRHH/raw/dev/src/modules/exchange.js
// ==/UserScript==
