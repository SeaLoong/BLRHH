const NAME = '宝箱';
const config = {
  treasureBox: false,
  silverBox: false,
  goldBox: false,
  aid: 660,
  cache: {},
  interval: 60,
  ignoreKeywords: ['test', 'encrypt', '测试', '钓鱼', '加密', '炸鱼']
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  let worker;

  let tipElement;
  let timerElement;
  let canvas;
  let ctx;

  let loadImageResolveFn;
  const image = new Image(120, 40);
  image.onload = () => {
    if (loadImageResolveFn) {
      loadImageResolveFn();
      loadImageResolveFn = null;
    }
  };

  function loadImage (url) {
    const promise = new Promise(resolve => (loadImageResolveFn = resolve));
    image.src = url;
    return promise;
  }

  function setTip (html) {
    return tipElement && tipElement.html(html);
  }

  function timing (time) {
    if (!timerElement) return;
    if (timerElement.interval) {
      clearInterval(timerElement.interval);
      timerElement.interval = null;
    }
    time = Math.ceil(time);
    if (time <= 0) return;
    return new Promise(resolve => {
      timerElement.html(time);
      timerElement.show();
      timerElement.interval = setInterval(() => {
        if (--time <= 0) {
          clearInterval(timerElement.interval);
          timerElement.interval = null;
          timerElement.hide();
          resolve();
        } else {
          timerElement.html(time);
        }
      }, 1e3);
    });
  }

  let silverBoxData;

  const NAME_SILVER_BOX = NAME + '-银瓜子宝箱';
  async function silverBox () {
    BLUL.debug('TreasureBox.silverBox');
    try {
      const response = await BLUL.Request.fetch('https://api.live.bilibili.com/lottery/v1/SilverBox/getCurrentTask');
      const obj = await response.json();
      if (obj.code === 0) {
        silverBoxData = obj.data;
        setTip(`次数<br>${silverBoxData.times}/${silverBoxData.max_times}<br>银瓜子<br>${silverBoxData.silver}`);
        BLUL.Logger.info(NAME_SILVER_BOX, `任务:${silverBoxData.minute} 分钟, ${silverBoxData.silver} 银瓜子, 次数 ${silverBoxData.times}/${silverBoxData.max_times}`);
        await timing(silverBoxData.time_end - Date.now() / 1000 + 1);
        return silverBoxAward();
      } else if (obj.code === -10017) {
        // 今天所有的宝箱已经领完!
        setTip('今日<br>已领完');
        BLUL.Logger.info(NAME_SILVER_BOX, obj.message);
        return Util.cancelRetry(silverBox);
      } else if (obj.code === -500) {
        // 请先登录!
        setTip('请先<br>登录');
        BLUL.Logger.warn(NAME_SILVER_BOX, obj.message);
        return Util.cancelRetry(silverBox);
      }
      BLUL.Logger.warn(NAME_SILVER_BOX, obj.message);
    } catch (error) {
      BLUL.Logger.error(NAME_SILVER_BOX, error);
    }
    return Util.retry(silverBox);
  }

  async function silverBoxAward () {
    BLUL.debug('TreasureBox.silverBoxAward');
    try {
      let response = await BLUL.Request.fetch('https://api.live.bilibili.com/lottery/v1/SilverBox/getCaptcha?ts=' + Date.now());
      let obj = await response.json();
      await loadImage(obj.data.img);
      ctx.drawImage(image, 0, 0);
      const captcha = await worker.predict(ctx.getImageData(0, 0, image.width, image.height));
      const result = (0, eval)(captcha); // eslint-disable-line no-eval
      BLUL.debug('验证码识别结果: ', `${captcha}=${result}`);
      response = await BLUL.Request.fetch({
        url: 'https://api.live.bilibili.com/lottery/v1/SilverBox/getAward',
        search: {
          time_start: silverBoxData.time_start,
          end_time: silverBoxData.time_end,
          captcha: result
        }
      });
      obj = await response.json();
      switch (obj.code) {
        case 0:
          BLUL.Logger.success(NAME_SILVER_BOX, `领取了 ${obj.data.awardSilver} 银瓜子`);
          Util.cancelRetry(silverBoxAward);
          return silverBox();
        case -903: // -903: 已经领取过这个宝箱
        case -500: // -500：领取时间未到, 请稍后再试
          Util.cancelRetry(silverBoxAward);
          return silverBox();
        case -800: // -800：未绑定手机
        case 1001:
          setTip('未绑定<br>手机');
          BLUL.Logger.warn(NAME_SILVER_BOX, '未绑定手机，不能领取银瓜子');
          return Util.cancelRetry(silverBoxAward);
        case 400: // 400: 访问被拒绝
          setTip('访问<br>被拒绝');
          BLUL.Logger.error(NAME_SILVER_BOX, obj.message);
          return Util.cancelRetry(silverBoxAward);
        case -902: // -902: 验证码错误
        case -901: // -901: 验证码过期
          BLUL.Logger.info(NAME_SILVER_BOX, obj.message);
          Util.cancelRetry(silverBoxAward);
          break;
        default:
          BLUL.Logger.warn(NAME_SILVER_BOX, obj.message);
      }
    } catch (error) {
      BLUL.Logger.error(NAME_SILVER_BOX, error);
    }
    return Util.retry(silverBoxAward);
  }

  const NAME_GOLD_BOX = NAME + '-金宝箱';
  const joinedSet = new Set();
  const aidStatusMap = new Map();
  async function goldBox () {
    BLUL.debug('TreasureBox.goldBox');
    BLUL.Logger.info(NAME_GOLD_BOX, '正在检查可参加的宝箱抽奖');
    let joinTime = 0;
    for (const k in config.cache) {
      for (const o of config.cache[k].typeB) {
        joinTime = Math.max(joinTime, o.join_end_time);
      }
      if (joinTime * 1e3 <= Date.now()) {
        delete config.cache[k];
        aidStatusMap.set(parseInt(k, 10), 1);
      }
    }
    let aid = config.aid;
    let cnt = 0;
    const startedList = [];
    const waitList = [];
    while (cnt < 8) {
      switch (await joinActivity(aid)) {
        case 2:
          cnt++;
          break;
        case 1:
          startedList.push(aid);
          break;
        case 0:
          waitList.push(aid);
          break;
      }
      aid++;
    }
    let lastAid = waitList.reduce((m, v) => Math.min(m, v), Number.MAX_SAFE_INTEGER);
    if (lastAid === Number.MAX_SAFE_INTEGER) lastAid = startedList.reduce((m, v) => Math.max(m, v), 0) + 1;
    config.aid = Math.max(config.aid, lastAid);
    await BLUL.Config.set('treasureBox.goldBox.aid', config.aid);
    await BLUL.Config.set('treasureBox.goldBox.cache', JSON.stringify(config.cache));
    aidStatusMap.clear();
  }

  function joinActivity (aid) {
    return (async function tryJoin () {
      if (aidStatusMap.has(aid)) return aidStatusMap.get(aid);
      BLUL.debug('TreasureBox.joinActivity');
      try {
        let data;
        if (aid in config.cache) {
          data = config.cache[aid];
        } else {
          const r = await BLUL.Request.fetch({
            url: 'https://api.live.bilibili.com/xlive/lottery-interface/v2/Box/getStatus?aid=' + aid,
            referrer: 'https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=' + aid
          });
          const obj = await r.json();
          if (obj.code !== 0) {
            BLUL.Logger.warn(NAME_GOLD_BOX, obj.message);
            aidStatusMap.set(aid, 0);
            Util.cancelRetry(tryJoin);
            return 0;
          }
          data = obj.data;
          if (!data) {
            aidStatusMap.set(aid, 2);
            Util.cancelRetry(tryJoin);
            return 2;
          }
        }
        let joinTime = 0;
        const title = data.title;
        const ignore = config.ignoreKeywords.some(v => title.includes(v));
        if (ignore) {
          BLUL.Logger.info(NAME_GOLD_BOX, `忽略抽奖: ${title}(aid=${aid})`);
        }
        for (const o of data.typeB) {
          joinTime = Math.max(joinTime, o.join_end_time);
          if (!joinedSet.has(aid) && !ignore && (o.status === 0 || o.status === -1)) {
            const names = [];
            for (const g of o.list) {
              names.push(g.jp_name);
            }
            draw(aid, o.round_num, o.startTime, o.join_start_time, o.join_end_time, title, ...names);
          }
        }
        joinedSet.add(aid);
        const ret = joinTime * 1e3 <= Date.now() ? 1 : 0;
        if (ret === 0) {
          config.cache[aid] = data;
        } else {
          delete config.cache[aid];
        }
        aidStatusMap.set(aid, ret);
        Util.cancelRetry(tryJoin);
        return ret;
      } catch (error) {
        BLUL.Logger.error(NAME_GOLD_BOX, `aid=${aid}`, error);
      }
      return Util.retry(tryJoin);
    })();
  }

  /* eslint-disable camelcase */
  const drawMap = new Map();
  function draw (aid, number, startTime, join_start_time, join_end_time, title, ...names) {
    if (!drawMap.has(aid)) drawMap.set(aid, new Set());
    const set = drawMap.get(aid);
    if (set.has(number)) return;
    set.add(number);
    async function timeoutDraw () {
      BLUL.debug('TreasureBox.draw.timeoutDraw');
      try {
        const r = await BLUL.Request.fetch({
          url: 'https://api.live.bilibili.com/xlive/lottery-interface/v2/Box/draw',
          search: {
            aid,
            number
          },
          referrer: 'https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=' + aid
        });
        const obj = await r.json();
        if (obj.code === 0) {
          BLUL.Logger.success(NAME_GOLD_BOX, '已参加抽奖: ' + title, '奖品:', ...names);
          setTimeout(timeoutEnd, (join_end_time + 5) * 1e3 - Date.now());
          Util.cancelRetry(timeoutDraw);
        } else if (obj.message.includes('未开始')) {
          return Util.retry(timeoutDraw);
        } else {
          BLUL.Logger.warn(NAME_GOLD_BOX, obj.message);
        }
      } catch (error) {
        BLUL.Logger.error(NAME_GOLD_BOX, `aid=${aid},number=${number}`, error);
        return Util.retry(timeoutDraw);
      }
    }
    async function timeoutEnd () {
      BLUL.debug('TreasureBox.draw.timeoutEnd');
      try {
        const r = await BLUL.Request.fetch({
          url: 'https://api.live.bilibili.com/xlive/lottery-interface/v2/Box/getWinnerGroupInfo',
          search: {
            aid,
            number
          },
          referrer: 'https://live.bilibili.com/p/html/live-room-treasurebox/index.html?aid=' + aid
        });
        const obj = await r.json();
        if (obj.code === 0) {
          if (!obj.data.groups) {
            return Util.retry(timeoutEnd);
          }
          for (const gift of obj.data.groups) {
            const arr = [];
            for (const u of gift.list) {
              arr.push(u.uid + ' ' + u.uname);
            }
            BLUL.Logger.info(NAME_GOLD_BOX, '奖品: ' + gift.giftTitle, '中奖人:', ...arr);
          }
          Util.cancelRetry(timeoutEnd);
        } else {
          BLUL.Logger.warn(NAME_GOLD_BOX, obj.message);
        }
      } catch (error) {
        BLUL.Logger.error(NAME_GOLD_BOX, `aid=${aid},number=${number}`, error);
        return Util.retry(timeoutEnd);
      }
    }
    const t = (join_start_time + 3) * 1e3 - Date.now();
    if (t > 0) {
      BLUL.Logger.info(NAME_GOLD_BOX, '等待参加: ' + title, '开始时间: ' + startTime, '奖品: ', ...names);
    }
    setTimeout(timeoutDraw, t);
  }
  /* eslint-enable camelcase */

  async function run () {
    if (!config.treasureBox) return;
    BLUL.debug('TreasureBox.run');
    (async function runSilverBox () {
      if (!config.treasureBox || !config.silverBox) return;
      if (!tipElement && !timerElement && !$('.draw-box.gift-left-part').length) {
        await BLUL.addResource('tfjs', ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.1/dist/tf.min.js']);
        await BLUL.addResource('TreasureBox_Model', ['https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH/models/treasurebox_captcha/model.json', 'https://raw.githubusercontent.com/SeaLoong/BLRHH/dev/models/treasurebox_captcha/model.json']);

        const box = $('#gift-control-vm div.treasure-box.p-relative').first();
        box.attr('id', 'old_treasure_box');
        box.hide();
        const cssTreasureBox = `${BLUL.NAME}-treasure-box`;
        const cssTreasureBoxText = `${BLUL.NAME}-treasure-box-text`;
        await GM.addStyle(`
        .${cssTreasureBox} { position: relative; min-width: 46px; display: inline-block; float: left; padding: 22px 0 0 15px; }
        .${cssTreasureBoxText} { text-align: center; user-select: none; max-width: 40px; padding: 2px 4px; margin-top: 3px; font-size: 12px; color: #fff; background-color: rgba(0,0,0,.5); border-radius: 10px; }
        `);
        const div = $(`<div class="${cssTreasureBox}"></div>`);
        tipElement = $(`<div class="${cssTreasureBoxText}">自动<br>领取中</div>`);
        timerElement = $(`<div class="${cssTreasureBoxText}"></div>`);
        timerElement.hide();
        box.after(div);
        div.append(tipElement);
        tipElement.after(timerElement);
        worker = await BLUL.Worker.importModule('TreasureBox/worker');
        canvas = $('<canvas style="display:none" width="120" height="40"></canvas>')[0];
        ctx = canvas.getContext('2d');
      }
      /* eslint-disable camelcase */
      if (!BLUL.INFO?.InfoByUser?.info || BLUL.INFO.InfoByUser.info.mobile_verify) {
        setTip('自动<br>领取中');
        await worker.loadModel(await BLUL.getResourceUrl('TreasureBox_Model'));
        await silverBox();
      } else {
        setTip('未绑定<br>手机');
        BLUL.Logger.warn(NAME_SILVER_BOX, '未绑定手机，不能领取银瓜子');
      }
      /* eslint-enable camelcase */
      Util.callAtTime(runSilverBox);
    })();
    (async function runGoldBox () {
      if (!config.treasureBox || !config.goldBox) return;
      /* eslint-disable camelcase */
      if (!BLUL.INFO?.InfoByUser?.info || BLUL.INFO.InfoByUser.info.mobile_verify) {
        await goldBox();
      } else {
        BLUL.Logger.warn(NAME_SILVER_BOX, '未绑定手机，不能参加宝箱抽奖');
      }
      /* eslint-enable camelcase */
      setTimeout(runGoldBox, config.interval * 60e3);
    })();
  }

  BLUL.onupgrade(async () => {
    await BLUL.Config.set('treasureBox.goldBox.aid', config.aid);
  });

  BLUL.oninit(() => {
    BLUL.Config.addItem('treasureBox', NAME, config.treasureBox, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('treasureBox.silverBox', '银瓜子宝箱', config.silverBox, { tag: 'input', help: '领取银瓜子宝箱，需要绑定手机才能正常使用', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('treasureBox.goldBox', '金宝箱', config.silverBox, { tag: 'input', help: '参加金宝箱抽奖(即实物抽奖)，需要绑定手机才能正常使用', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('treasureBox.goldBox.aid', 'aid', config.aid, { tag: 'input', attribute: { type: 'number' } });
    BLUL.Config.addItem('treasureBox.goldBox.cache', 'cache', JSON.stringify(config.cache), { tag: 'input', help: '此项只用于存储和显示数据', attribute: { type: 'text', readonly: true } });
    BLUL.Config.addItem('treasureBox.goldBox.interval', '检查间隔', config.interval, { tag: 'input', help: '设定多久检查一次宝箱抽奖<br>单位为分钟，默认为60', corrector: v => v > 1 ? v : 60, attribute: { type: 'number', placeholder: '单位为分钟，默认为60', min: 1, max: 1440 } });
    BLUL.Config.addItem('treasureBox.goldBox.ignoreKeywords', '忽略关键字', config.ignoreKeywords.join(','), { tag: 'input', help: '忽略含有以下关键字的抽奖，用英文逗号隔开', attribute: { type: 'text' } });

    BLUL.Config.onload(() => {
      config.treasureBox = BLUL.Config.get('treasureBox');
      config.silverBox = BLUL.Config.get('treasureBox.silverBox');
      config.goldBox = BLUL.Config.get('treasureBox.goldBox');
      config.aid = BLUL.Config.get('treasureBox.goldBox.aid');
      config.cache = JSON.parse(BLUL.Config.get('treasureBox.goldBox.cache'));
      config.interval = BLUL.Config.get('treasureBox.goldBox.interval');
      config.ignoreKeywords = BLUL.Config.get('treasureBox.goldBox.ignoreKeywords').split(',').map(v => v.trim());
    });
  });
  BLUL.onrun(run);

  BLUL.TreasureBox = {
    run,
    silverBox: {
      silverBox,
      setTip,
      timing
    },
    goldBox: {
      goldBox,
      joinActivity,
      draw
    }
  };

  BLUL.debug('Module Loaded: TreasureBox', BLUL.TreasureBox);

  return BLUL.TreasureBox;
}
