/* global BLUL */
'use strict';

(async () => {
  const EULA = await GM.getResourceText('EULA');
  BLUL.NAME = 'BLRHH';
  if (!await BLUL.run({ debug: true, slient: false, unique: true, login: true, EULA: EULA, EULA_VERSION: EULA.match(/\[v(.+?)\]/)[1] })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  BLUL.Logger.info('脚本信息', `运行环境: ${BLUL.ENVIRONMENT} ${BLUL.ENVIRONMENT_VERSION}`, `版本: ${BLUL.VERSION}`);
  const { Util, importModule } = BLUL;
  try {
    const r = await BLUL.Request.fetch('https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=' + BLUL.INFO.ROOMID);
    const obj = await r.json();
    BLUL.INFO.InfoByUser = obj.data;
    if (obj.code !== 0) {
      BLUL.Logger.warn(obj.message);
    }
    /* eslint-disable camelcase */
    BLUL.Logger.info('用户信息', `uid: ${BLUL.INFO.UID} 用户名: ${BLUL.INFO.InfoByUser?.info?.uname} 手机绑定: ${BLUL.INFO.InfoByUser?.info?.mobile_verify} 实名认真: ${BLUL.INFO.InfoByUser?.info?.identification}`,
    `UL: ${BLUL.INFO.InfoByUser?.user_level?.level} 金瓜子: ${BLUL.INFO.InfoByUser?.wallet?.gold} 银瓜子: ${BLUL.INFO.InfoByUser?.wallet?.silver}`,
    `弹幕模式: ${BLUL.INFO.InfoByUser?.property?.danmu?.mode} 弹幕颜色: ${BLUL.INFO.InfoByUser?.property?.danmu?.color} 弹幕长度: ${BLUL.INFO.InfoByUser?.property?.danmu?.length}`,
    `房间id: ${BLUL.INFO.ROOMID} 短id: ${BLUL.INFO.SHORT_ROOMID} 主播uid: ${BLUL.INFO.ANCHOR_UID}`);
    /* eslint-enable camelcase */
  } catch (error) {
    BLUL.Logger.error('初始化抽奖信息失败', error);
  }
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src');
  await importModule('Sign');
  await importModule('Exchange');
  await importModule('TreasureBox');
})();
