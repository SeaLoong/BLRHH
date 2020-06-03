const NAME = '兑换';
const config = {
  exchange: false,
  silver2coin: false,
  coin2silver: false,
  quantity: 1
};
export default async function (importModule, BLRHH, GM) {
  const Util = BLRHH.Util;

  const NAME_SILVER2COIN = NAME + '-银瓜子兑换硬币';
  async function silver2coin () {
    BLRHH.debug('Exchange.silver2coin');
    try {
      const response = await BLRHH.Request.fetch({
        method: 'POST',
        url: 'https://api.live.bilibili.com/pay/v1/Exchange/silver2coin',
        data: {
          platform: 'pc',
          csrf: BLRHH.INFO.CSRF,
          csrf_token: BLRHH.INFO.CSRF,
          visit_id: BLRHH.INFO.VISIT_ID
        }
      });
      const obj = await response.json();
      if (obj.code === 0) {
        BLRHH.Logger.success(NAME_SILVER2COIN, obj.message);
        return Util.cancelRetry?.(silver2coin);
      } else if (obj.message.includes('最多')) {
        BLRHH.Logger.info(NAME_SILVER2COIN, obj.message);
        return Util.cancelRetry?.(silver2coin);
      }
      BLRHH.Logger.warn(NAME_SILVER2COIN, obj.message);
    } catch (error) {
      BLRHH.Logger.error(NAME_SILVER2COIN, error);
    }
    return Util.retry?.(silver2coin);
  }

  const NAME_COIN2SILVER = NAME + '-硬币兑换银瓜子';
  async function coin2silver () {
    BLRHH.debug('Exchange.coin2silver');
    try {
      const response = await BLRHH.Request.fetch({
        method: 'POST',
        url: 'https://api.live.bilibili.com/pay/v1/Exchange/coin2silver',
        data: {
          num: config.quantity,
          platform: 'pc',
          csrf: BLRHH.INFO.CSRF,
          csrf_token: BLRHH.INFO.CSRF,
          visit_id: BLRHH.INFO.VISIT_ID
        }
      });
      const obj = await response.json();
      if (obj.code === 0) {
        BLRHH.Logger.success(NAME_COIN2SILVER, obj.message);
        return Util.cancelRetry?.(coin2silver);
      } else if (obj.message.includes('最多')) {
        BLRHH.Logger.info(NAME_COIN2SILVER, obj.message);
        return Util.cancelRetry?.(coin2silver);
      }
      BLRHH.Logger.warn(NAME_COIN2SILVER, obj.message);
    } catch (error) {
      BLRHH.Logger.error(NAME_COIN2SILVER, error);
    }
    return Util.retry?.(coin2silver);
  }

  const TIMESTAMP_NAME_SILVER2COIN = 'timestampExchange-silver2coin';
  const TIMESTAMP_NAME_COIN2SILVER = 'timestampExchange-coin2silver';

  async function run () {
    if (!config.exchange) return;
    BLRHH.debug('Exchange.run');
    (async function runSilver2coin () {
      if (!config.silver2coin || Util.inOneDay(await GM.getValue(TIMESTAMP_NAME_SILVER2COIN) ?? 0)) return;
      await silver2coin();
      await GM.setValue(TIMESTAMP_NAME_SILVER2COIN, Date.now());
      Util.callAtTime(runSilver2coin);
      BLRHH.Logger.info(TIMESTAMP_NAME_SILVER2COIN, '今日已进行过兑换，等待下次兑换');
    })();
    (async function runCoin2silver () {
      if (!config.silver2coin || Util.inOneDay(await GM.getValue(TIMESTAMP_NAME_COIN2SILVER) ?? 0)) return;
      await coin2silver();
      await GM.setValue(TIMESTAMP_NAME_COIN2SILVER, Date.now());
      Util.callAtTime(runCoin2silver);
      BLRHH.Logger.info(TIMESTAMP_NAME_COIN2SILVER, '今日已进行过兑换，等待下次兑换');
    })();
  }

  BLRHH.onupgrade.push(() => {
    GM.deleteValue(TIMESTAMP_NAME_SILVER2COIN);
    GM.deleteValue(TIMESTAMP_NAME_COIN2SILVER);
  });

  BLRHH.oninit.push(() => {
    BLRHH.Config.addItem('exchange', NAME, config.exchange, { tag: 'input', attribute: { type: 'checkbox' } });
    BLRHH.Config.addItem('exchange.silver2coin', '银瓜子兑换硬币', config.silver2coin, { tag: 'input', help: '700银瓜子=1硬币，每天最多兑换1次', attribute: { type: 'checkbox' } });
    BLRHH.Config.addItem('exchange.coin2silver', '硬币兑换银瓜子', config.coin2silver, { tag: 'input', help: '1硬币=450银瓜子（老爷或大会员500银瓜子）普通用户每天兑换上限25硬币；老爷或大会员每天兑换上限50硬币。', attribute: { type: 'checkbox' } });
    BLRHH.Config.addItem('exchange.coin2silver.quantity', '兑换数量', config.quantity, { tag: 'input', corrector: v => v > 1 ? v : 1, attribute: { type: 'number', placeholder: '默认为1', min: 1, max: 50 } });
    BLRHH.Config.onload.push(() => {
      config.exchange = BLRHH.Config.get('exchange');
      config.silver2coin = BLRHH.Config.get('exchange.silver2coin');
      config.coin2silver = BLRHH.Config.get('exchange.coin2silver');
      config.quantity = BLRHH.Config.get('exchange.coin2silver.quantity');
    });
  });
  BLRHH.onrun.push(run);

  BLRHH.Exchange = {
    run,
    silver2coin,
    coin2silver
  };

  BLRHH.debug('Module Loaded: Exchange', BLRHH.Exchange);

  return BLRHH.Exchange;
}
