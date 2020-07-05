/* global BLUL */
'use strict';

(async () => {
  const EULA = await GM.getResourceText('EULA');
  BLUL.NAME = 'BLRHH';
  if (!await BLUL.run({ debug: true, slient: false, unique: true, login: true, EULA: EULA, EULA_VERSION: EULA.match(/\[v(.+?)\]/)[1] })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  const { Util, importModule } = BLUL;
  /*
  try {
    const r = await BLUL.Request.fetch({
      url: 'https://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb',
      search: {
        roomid: BLUL.INFO.ROOMID
      }
    });
    const obj = await r.json();
    BLUL.INFO.LotteryInfo = obj.data;
    if (obj.code !== 0) {
      BLUL.Logger.warn(obj.message);
    }
  } catch (error) {
    BLUL.Logger.error('初始化抽奖信息失败', error);
  }
  */
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src');
  await importModule('Sign');
  await importModule('Exchange');
  await importModule('TreasureBox');
})();
