const NAME = '每日奖励';
const config = {
  dailyReward: true,
  login: true,
  watch: false,
  coin: false,
  coinNumber: 5,
  share: false
};
let cards;
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  const NAME_DYNAMIC = NAME + '-获取动态视频';
  async function dynamic () {
    if (!config.dailyReward) return Util.cancelRetry(dynamic);
    BLUL.debug('DailyReward.dynamic');
    try {
      const r = await BLUL.Request.fetch({
        url: 'https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new',
        search: {
          uid: BLUL.INFO.UID,
          type_list: 8
        }
      });
      const obj = await r.json();
      if (obj.code === 0 && obj?.data?.cards) {
        cards = obj?.data?.cards;
        for (const c of cards) {
          c.card = JSON.parse(c.card);
        }
      } else {
        BLUL.Logger.warn(NAME_DYNAMIC, obj.message);
      }
      return Util.cancelRetry(dynamic);
    } catch (error) {
      BLUL.Logger.error(NAME_DYNAMIC, error);
    }
    return Util.retry(dynamic);
  }

  const NAME_LOGIN = NAME + '-登录';
  async function login () {
    if (!config.dailyReward || !config.login) return Util.cancelRetry(login);
    BLUL.debug('DailyReward.login');
    try {
      const r = await BLUL.Request.fetch({
        url: 'https://api.bilibili.com/x/report/click/now',
        search: {
          jsonp: 'jsonp'
        }
      });
      const obj = await r.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_LOGIN, '完成');
      } else {
        BLUL.Logger.warn(NAME_LOGIN, obj.message);
      }
      return Util.cancelRetry(login);
    } catch (error) {
      BLUL.Logger.error(NAME_LOGIN, error);
    }
    return Util.retry(login);
  }

  const NAME_WATCH = NAME + '-观看';
  async function watch () {
    if (!config.dailyReward || !config.watch) return Util.cancelRetry(watch);
    BLUL.debug('DailyReward.watch');
    if (!cards?.length) {
      Util.cancelRetry(watch);
      BLUL.Logger.warn(NAME_WATCH, '没有可用的视频动态，10分钟后将重试');
      await Util.sleep(600e3);
      return watch();
    }
    try {
      const { aid, cid } = cards[0].card;
      const { bvid } = cards[0].desc;
      const r = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://api.bilibili.com/x/report/web/heartbeat',
        data: {
          aid: aid,
          cid: cid,
          bvid: bvid,
          mid: BLUL.INFO.UID,
          start_ts: Math.floor(Date.now() / 1e3),
          played_time: 0,
          realtime: 0,
          type: 3,
          play_type: 1, // 1:播放开始，2:播放中
          dt: 2,
          csrf: BLUL.INFO.CSRF
        }
      });
      const obj = await r.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_WATCH, `完成(av=${aid})`);
      } else {
        BLUL.Logger.warn(NAME_WATCH, obj.message);
      }
      return Util.cancelRetry(watch);
    } catch (error) {
      BLUL.Logger.error(NAME_WATCH, error);
    }
    return Util.retry(watch);
  }

  const NAME_COIN = NAME + '-投币';
  async function coin () {
    if (!config.dailyReward || !config.coin) return Util.cancelRetry(coin);
    try {
      BLUL.debug('DailyReward.coin');
      if (!cards?.length) {
        Util.cancelRetry(coin);
        BLUL.Logger.warn(NAME_COIN, '没有可用的视频动态，10分钟后将重试');
        await Util.sleep(600e3);
        return coin();
      }
      const r = await BLUL.Request.fetch({
        url: 'https://www.bilibili.com/plus/account/exp.php'
      });
      const obj = await r.json();
      if (!('number' in obj)) {
        Util.cancelRetry(coin);
        BLUL.Logger.error(NAME_COIN, '获取今日已投币经验失败，10分钟后将重试');
        await Util.sleep(600e3);
        return coin();
      }
      let count = obj.number / 10;
      let stop = false;
      for (const { card } of cards) {
        if (config.coinNumber <= count || stop) return;
        const { aid } = card;
        let one = false;
        await (async function tryCoin () {
          if (!config.dailyReward || !config.coin || config.coinNumber <= count) return Util.cancelRetry(tryCoin);
          BLUL.debug('DailyReward.coin.tryCoin');
          try {
            const multiply = one ? 1 : Math.min(2, (config.coinNumber - count));
            const r = await BLUL.Request.monkey({
              method: 'POST',
              url: 'https://app.bilibili.com/x/v2/view/coin/add',
              headers: BLUL.AppToken.headers,
              data: BLUL.AppToken.sign({
                access_key: await BLUL.AppToken.getAccessToken(),
                aid: aid,
                avtype: 1,
                c_locale: 'zh_CN',
                multiply: multiply,
                select_like: 0
              })
            });
            const obj = await r.json();
            if (obj.code === 0) {
              count += multiply;
              BLUL.Logger.success(NAME_COIN, `投币成功(av=${aid},num=${multiply})`);
            } else if (obj.code === -110) {
              stop = true;
              BLUL.Logger.warn(NAME_COIN, '未绑定手机，不能投币');
            } else if (obj.code === 34003) {
            // 非法的投币数量
              if (!one) {
                one = true;
                return tryCoin();
              }
            } else if (obj.code === 34005) {
            // 塞满啦！先看看库存吧~
            } else {
              BLUL.Logger.warn(NAME_COIN, obj.message);
            }
            return Util.cancelRetry(tryCoin);
          } catch (error) {
            BLUL.Logger.error(NAME_COIN, error);
          }
          return Util.retry(tryCoin);
        })();
      }
      Util.cancelRetry(coin);
      if (!stop && config.coinNumber > count) {
        BLUL.Logger.warn(NAME_COIN, '可投币的视频动态不足，10分钟后将重试');
        await Util.sleep(600e3);
        return coin();
      }
      return;
    } catch (error) {
      BLUL.Logger.error(NAME_COIN, error);
    }
    return Util.retry(coin);
  }

  const NAME_SHARE = NAME + '-分享';
  async function share () {
    if (!config.dailyReward || !config.share) return Util.cancelRetry(share);
    BLUL.debug('DailyReward.share');
    if (!cards?.length) {
      Util.cancelRetry(share);
      BLUL.Logger.warn(NAME_SHARE, '没有可用的视频动态，10分钟后将重试');
      await Util.sleep(600e3);
      return share();
    }
    try {
      const { aid } = cards[0].card;
      const r = await BLUL.Request.fetch({
        method: 'POST',
        url: 'https://api.bilibili.com/x/web-interface/share/add',
        data: {
          aid: aid,
          csrf: BLUL.INFO.CSRF
        }
      });
      const obj = await r.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_SHARE, `完成(av=${aid})`);
      } else if (obj.code === 71000) {
      } else {
        BLUL.Logger.warn(NAME_SHARE, obj.message);
      }
      return Util.cancelRetry(share);
    } catch (error) {
      BLUL.Logger.error(NAME_SHARE, error);
    }
    return Util.retry(share);
  }

  const TIMESTAMP_NAME_LOGIN = 'timestampDailyReward-login';
  const TIMESTAMP_NAME_WATCH = 'timestampDailyReward-watch';
  const TIMESTAMP_NAME_COIN = 'timestampDailyReward-coin';
  const TIMESTAMP_NAME_SHARE = 'timestampDailyReward-share';

  async function run () {
    if (!config.dailyReward) return;
    BLUL.debug('DailyReward.run');
    (async function runLogin () {
      if (!config.dailyReward || !config.login) return;
      if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_LOGIN) ?? 0)) {
        await login();
        await GM.setValue(TIMESTAMP_NAME_LOGIN, Date.now());
      }
      BLUL.Logger.info(NAME_LOGIN, '今日已完成');
      Util.callAtTime(runLogin);
    })();

    (async function runWatch () {
      if (!config.dailyReward || !config.watch) return;
      if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_WATCH) ?? 0)) {
        if (!cards) await dynamic();
        await watch();
        await GM.setValue(TIMESTAMP_NAME_WATCH, Date.now());
      }
      BLUL.Logger.info(NAME_WATCH, '今日已完成');
      Util.callAtTime(runWatch);
    })();

    (async function runCoin () {
      if (!config.dailyReward || !config.coin) return;
      if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_COIN) ?? 0)) {
        if (!BLUL.INFO?.InfoByUser?.info || BLUL.INFO.InfoByUser.info.mobile_verify) {
          if (!cards) await dynamic();
          await coin();
          await GM.setValue(TIMESTAMP_NAME_COIN, Date.now());
          BLUL.Logger.info(NAME_COIN, '今日已完成');
        } else {
          BLUL.Logger.warn(NAME_COIN, '未绑定手机，不能投币');
        }
      }
      Util.callAtTime(runCoin);
    })();

    (async function runShare () {
      if (!config.dailyReward || !config.share) return;
      if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_SHARE) ?? 0)) {
        if (!cards) await dynamic();
        await share();
        await GM.setValue(TIMESTAMP_NAME_SHARE, Date.now());
      }
      BLUL.Logger.info(NAME_SHARE, '今日已完成');
      Util.callAtTime(runShare);
    })();
  }

  BLUL.onupgrade(() => {
    GM.deleteValue(TIMESTAMP_NAME_LOGIN);
    GM.deleteValue(TIMESTAMP_NAME_WATCH);
    GM.deleteValue(TIMESTAMP_NAME_COIN);
    GM.deleteValue(TIMESTAMP_NAME_SHARE);
  });

  BLUL.oninit(() => {
    BLUL.Config.addItem('dailyReward', NAME, config.dailyReward, { tag: 'input', help: '自动完成主站的每日任务', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('dailyReward.login', '登录', config.login, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('dailyReward.watch', '观看', config.watch, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('dailyReward.coin', '投币', config.coin, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('dailyReward.coin.number', '数量', config.coinNumber, { tag: 'input', attribute: { type: 'number', placeholder: '默认为5', min: 1, max: 5 } });
    BLUL.Config.addItem('dailyReward.share', '分享', config.share, { tag: 'input', attribute: { type: 'checkbox' } });

    BLUL.Config.onload(() => {
      config.dailyReward = BLUL.Config.get('dailyReward');
      config.login = BLUL.Config.get('dailyReward.login');
      config.watch = BLUL.Config.get('dailyReward.watch');
      config.coin = BLUL.Config.get('dailyReward.coin');
      config.coinNumber = BLUL.Config.get('dailyReward.coin.number');
      config.share = BLUL.Config.get('dailyReward.share');
    });
  });
  BLUL.onrun(run);

  BLUL.DailyReward = {
    run,
    login,
    watch,
    coin,
    share
  };

  BLUL.debug('Module Loaded: DailyReward', BLUL.DailyReward);

  return BLUL.DailyReward;
}
