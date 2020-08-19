// ==UserScript==
// @name         Bilibili直播间挂机助手3
// @namespace    SeaLoong
// @version      3.1.0
// @description  B站直播间挂机用: 签到，领瓜子，移动端心跳，瓜子换硬币等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLRHH
// @supportURL   https://github.com/SeaLoong/BLRHH/issues
// @updateURL    https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src/installer.user.js
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
// @require      https://greasyfork.org/scripts/407791-blul/code/BLUL.js
// ==/UserScript==

/* global BLUL */
'use strict';

(async () => {
  const EULA = await GM.getResourceText('EULA');
  const NOTICE = await GM.getResourceText('NOTICE');
  BLUL.NAME = 'BLRHH';
  if (!await BLUL.run({ debug: await GM.getValue('debug'), slient: false, unique: true, login: true, EULA: EULA, EULA_VERSION: EULA.match(/\[v(.+?)\]/)[1], NOTICE: NOTICE })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  BLUL.Logger.info('脚本信息', `运行环境: ${BLUL.ENVIRONMENT} ${BLUL.ENVIRONMENT_VERSION}`, `版本: ${BLUL.VERSION}`);
  const { importModule } = BLUL;
  try {
    const r = await BLUL.Request.fetch('https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=' + BLUL.INFO.ROOMID);
    const obj = await r.json();
    BLUL.INFO.InfoByUser = obj.data;
    if (obj.code !== 0) {
      BLUL.Logger.warn(obj.message);
    }
    /* eslint-disable camelcase */
    const color = Number(BLUL.INFO.InfoByUser?.property?.danmu?.color).toString(16).toUpperCase();
    BLUL.Logger.info('用户信息', `uid: ${BLUL.INFO.UID} 用户名: ${BLUL.INFO.InfoByUser?.info?.uname}`,
    `手机绑定: ${BLUL.INFO.InfoByUser?.info?.mobile_verify ? '是' : '否'} 实名认证: ${BLUL.INFO.InfoByUser?.info?.identification ? '是' : '否'}`,
    `UL: ${BLUL.INFO.InfoByUser?.user_level?.level} 金瓜子: ${BLUL.INFO.InfoByUser?.wallet?.gold} 银瓜子: ${BLUL.INFO.InfoByUser?.wallet?.silver}`,
    `弹幕模式: ${BLUL.INFO.InfoByUser?.property?.danmu?.mode} 弹幕颜色: <span style="color: #${color};">${color}</span> 弹幕长度: ${BLUL.INFO.InfoByUser?.property?.danmu?.length}`,
    `房间id: ${BLUL.INFO.ROOMID} 短id: ${BLUL.INFO.SHORT_ROOMID} 主播uid: ${BLUL.INFO.ANCHOR_UID}`);
    /* eslint-enable camelcase */
  } catch (error) {
    BLUL.Logger.error('初始化用户信息失败', error);
  }
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/src');
  await importModule('Sign');
  await importModule('Exchange');
  await importModule('TreasureBox');
  await importModule('Heartbeat');
  await importModule('DailyReward');
})();



