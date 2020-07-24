const NAME = '心跳';
const config = {
  heartbeat: true,
  mobile: true,
  mobileInterval: 300
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  const NAME_MOBILE = NAME + '-移动端';
  let mobileTimer;
  async function mobile () {
    BLUL.debug('Heartbeat.mobile');
    if (mobileTimer) {
      clearTimeout(mobileTimer);
      mobileTimer = null;
    }
    try {
      const response = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://api.live.bilibili.com/heartbeat/v1/OnLine/mobileOnline',
        headers: BLUL.AppToken.headers,
        search: BLUL.AppToken.sign({ access_key: BLUL.AppToken.getAccessToken() }),
        data: {
          roomid: BLUL.INFO.ROOMID,
          scale: 'xxhdpi'
        }
      });
      const obj = await response.json();
      if (obj.code !== 0) {
        BLUL.Logger.warn(NAME_MOBILE, obj.message);
      }
      mobileTimer = setTimeout(mobile, config.interval * 1e3);
      return Util.cancelRetry(mobile);
    } catch (error) {
      BLUL.Logger.error(NAME_MOBILE, error);
    }
    return Util.retry(mobile);
  }

  async function run () {
    if (!config.heartbeat) return;
    BLUL.debug('Heartbeat.run');
    mobile();
  }

  BLUL.oninit(() => {
    BLUL.Config.addItem('heartbeat', NAME, config.heartbeat, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('heartbeat.mobile', '移动端', config.mobile, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('heartbeat.mobile.interval', '心跳间隔', config.mobileInterval, { tag: 'input', corrector: v => v > 1 ? v : 1, attribute: { type: 'number', placeholder: '单位为秒，默认为300', min: 1, max: 3600 } });
    BLUL.Config.onload(() => {
      config.heartbeat = BLUL.Config.get('heartbeat');
      config.mobile = BLUL.Config.get('heartbeat.mobile');
      config.mobileInterval = BLUL.Config.get('heartbeat.mobile.interval');
    });
  });
  BLUL.onrun(run);

  BLUL.Heartbeat = {
    run,
    mobile
  };

  BLUL.debug('Module Loaded: Heartbeat', BLUL.Heartbeat);

  return BLUL.Heartbeat;
}
