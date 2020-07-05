const NAME = '宝箱';
const config = {
  treasureBox: false,
  silverBox: false
};
export default async function (importModule, BLUL, GM) {
  await BLUL.addResource('tfjs', ['https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.0.1/dist/tf.min.js']);
  await BLUL.addResource('TreasureBox_Model', ['https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/models/treasurebox_captcha/model.json']);
  const Util = BLUL.Util;

  const worker = await BLUL.Worker.importModule('TreasureBox/worker');

  let tipElement;
  let timerElement;
  const canvas = $('<canvas style="display:none" width="120" height="40"></canvas>')[0];
  const ctx = canvas.getContext('2d');

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
    return new Promise(resolve => {
      timerElement.show();
      timerElement.interval = setInterval(() => {
        if (time <= 0) {
          clearInterval(timerElement.interval);
          timerElement.interval = null;
          timerElement.hide();
          resolve();
        } else {
          timerElement.html(time--);
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
        BLUL.Logger.info(NAME_SILVER_BOX, `${silverBoxData.minute} 分钟, ${silverBoxData.silver} 银瓜子, 次数 ${silverBoxData.times}/${silverBoxData.max_times}`);
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
          setTip('未绑定<br>手机');
          BLUL.Logger.warn(NAME_SILVER_BOX, obj.message);
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

  async function run () {
    if (!config.treasureBox) return;
    BLUL.debug('TreasureBox.run');
    (async function runSilverBox () {
      if (!config.silverBox) return;
      if (!$('.draw-box.gift-left-part').length) {
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
        tipElement = $(`<div class="${cssTreasureBoxText}"></div>`);
        timerElement = $(`<div class="${cssTreasureBoxText}"></div>`);
        timerElement.hide();
        box.after(div);
        div.append(tipElement);
        tipElement.after(timerElement);
      }
      /* eslint-disable camelcase */
      if (!BLUL.INFO?.InfoByUser?.info || BLUL.INFO.InfoByUser.info.mobile_verify) {
        await worker.loadModel(await BLUL.getResourceUrl('TreasureBox_Model'));
        await silverBox();
      } else {
        setTip('未绑定<br>手机');
        BLUL.Logger.warn(NAME_SILVER_BOX, '未绑定手机，不能领取银瓜子');
      }
      /* eslint-enable camelcase */
      Util.callAtTime(runSilverBox);
    })();
  }

  BLUL.onupgrade(() => {
  });

  BLUL.oninit(() => {
    BLUL.Config.addItem('treasureBox', NAME, config.treasureBox, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('treasureBox.silverBox', '银瓜子宝箱', config.silverBox, { tag: 'input', help: '领取银瓜子宝箱，需要绑定手机才能正常使用', attribute: { type: 'checkbox' } });
    BLUL.Config.onload(() => {
      config.treasureBox = BLUL.Config.get('treasureBox');
      config.silverBox = BLUL.Config.get('treasureBox.silverBox');
    });
  });
  BLUL.onrun(run);

  BLUL.TreasureBox = {
    run,
    setTip,
    timing
  };

  BLUL.debug('Module Loaded: TreasureBox', BLUL.TreasureBox);

  return BLUL.TreasureBox;
}
