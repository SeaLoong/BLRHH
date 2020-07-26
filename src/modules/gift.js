const NAME = '礼物';
const config = {
  gift: true,
  fastReceiveSmallHeartHeart: true,
  send: false,
  lightMedal: false
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  const NAME_SENDGIFT = NAME + '-送礼';
  const roomidSet = new Set();
  function mobile (roomid = BLUL.INFO.ROOMID) {
    BLUL.debug('Heartbeat.mobile');
    if (roomidSet.has(roomid)) return;
    roomidSet.add(roomid);
    const heartbeat = async () => {
      if (!roomidSet.has(roomid)) return;
      try {
        const response = await BLUL.Request.monkey({
          method: 'POST',
          url: 'https://api.live.bilibili.com/heartbeat/v1/OnLine/mobileOnline',
          headers: BLUL.AppToken.headers,
          search: BLUL.AppToken.sign({ access_key: await BLUL.AppToken.getAccessToken() }),
          data: {
            roomid: roomid,
            scale: 'xxhdpi'
          }
        });
        const obj = await response.json();
        if (obj.code !== 0) {
          BLUL.Logger.warn(NAME_MOBILE, roomid, obj.message);
        }
        setTimeout(heartbeat, config.mobileInterval * 1e3);
        return Util.cancelRetry(heartbeat);
      } catch (error) {
        BLUL.Logger.error(NAME_MOBILE, roomid, error);
      }
      return Util.retry(heartbeat);
    };
    heartbeat();
  }

  function stopMobile (roomid = BLUL.INFO.ROOMID) {
    BLUL.debug('Heartbeat.stopMobile');
    roomidSet.delete(roomid);
  }

  async function run () {
    if (!config.heartbeat) return;
    BLUL.debug('Heartbeat.run');
    mobile();
  }

  BLUL.oninit(() => {
    BLUL.Config.addItem('gift', NAME, config.gift, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('gift.fastReceiveSmallHeartHeart', '快速领取小心心', config.fastReceiveSmallHeartHeart, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('gift.send', '送礼', config.send, { tag: 'input', help: '送礼原则：<br>1.只送包裹中的银瓜子礼物<br>2.尽量保证不浪费<br>3.优先送出快到期的礼物<br>4.优先送出高价值的礼物<br>以下送礼功能会以满足这几个原则为基础来实现', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('gift.', '心跳间隔', config.mobileInterval, { tag: 'input', corrector: v => v > 1 ? v : 1, attribute: { type: 'number', placeholder: '单位为秒，默认为300', min: 1, max: 3600 } });

    BLUL.Config.onload(() => {
      config.gift = BLUL.Config.get('gift');
      config.send = BLUL.Config.get('gift.send');
      config.fastReceiveSmallHeartHeart = BLUL.Config.get('gift.fastReceiveSmallHeartHeart');
    });
  });
  BLUL.onrun(run);

  BLUL.Gift = {
    run,
    mobile,
    stopMobile
  };

  BLUL.debug('Module Loaded: Gift', BLUL.Gift);

  return BLUL.Gift;
}
