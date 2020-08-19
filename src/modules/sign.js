const NAME = '签到';
const config = {
  sign: true,
  live: true,
  linkGroup: true
};
export default async function (importModule, BLUL, GM) {
  const Util = BLUL.Util;

  const NAME_LIVE = NAME + '-直播';
  async function live () {
    BLUL.debug('Sign.live');
    try {
      const response = await BLUL.Request.fetch('https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign');
      const obj = await response.json();
      if (obj.code === 0) {
        BLUL.Logger.success(NAME_LIVE, obj.data.text);
        return Util.cancelRetry(live);
      } else if (obj.code === 1011040 || obj.message.includes('已签到')) {
        BLUL.Logger.info(NAME_LIVE, obj.message);
        return Util.cancelRetry(live);
      } else if (obj.code === 1001) {
        BLUL.Logger.warn(NAME_LIVE, '未绑定手机，不能签到');
        return Util.cancelRetry(live);
      }
      BLUL.Logger.warn(NAME_LIVE, obj.message);
    } catch (error) {
      BLUL.Logger.error(NAME_LIVE, error);
    }
    return Util.retry(live);
  }

  const NAME_LINKGROUP = NAME + '-应援团';
  async function linkGroup () {
    BLUL.debug('Sign.linkGroup');
    try {
      const response = await BLUL.Request.fetch('https://api.vc.bilibili.com/link_group/v1/member/my_groups');
      const obj = await response.json();
      if (obj.code === 0) {
        /* eslint-disable camelcase */
        const promises = [];
        for (const { owner_uid, group_id } of obj.data.list) {
          if (owner_uid === BLUL.INFO.UID) continue; // 自己不能给自己的应援团应援
          const signOneLinkGroup = async () => {
            try {
              const msg = `应援团(group_id=${group_id},owner_uid=${owner_uid})`;
              const response = await BLUL.Request.fetch({
                url: 'https://api.vc.bilibili.com/link_setting/v1/link_setting/sign_in',
                search: {
                  group_id,
                  owner_id: owner_uid
                }
              });
              const obj = await response.json();
              if (obj.code === 0) {
                if (obj.data.status === 0) {
                  BLUL.Logger.success(NAME_LINKGROUP, msg, `签到成功，对应勋章亲密度+${obj.data.add_num}`);
                  return Util.cancelRetry(signOneLinkGroup);
                } else if (obj.data.status === 1) {
                  BLUL.Logger.info(NAME_LINKGROUP, msg, '今日已签到过');
                  return Util.cancelRetry(signOneLinkGroup);
                }
              }
              BLUL.Logger.warn(NAME_LINKGROUP, msg, obj.message);
            } catch (error) {
              BLUL.Logger.error(NAME_LINKGROUP, error);
            }
            return Util.retry(signOneLinkGroup);
          };
          promises.push(signOneLinkGroup());
        }
        return Promise.all(promises);
      }
      BLUL.Logger.warn(NAME_LINKGROUP, obj.message);
    } catch (error) {
      BLUL.Logger.error(NAME_LINKGROUP, error);
    }
    return Util.retry(linkGroup);
  }

  const TIMESTAMP_NAME_LIVE = 'timestampSign-live';
  const TIMESTAMP_NAME_LINKGROUP = 'timestampSign-linkGroup';

  async function run () {
    if (!config.sign) return;
    BLUL.debug('Sign.run');
    (async function runLive () {
      if (!config.sign || !config.live) return;
      if (!BLUL.INFO?.InfoByUser?.info || BLUL.INFO.InfoByUser.info.mobile_verify) {
        if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_LIVE) ?? 0)) {
          await live();
          await GM.setValue(TIMESTAMP_NAME_LIVE, Date.now());
        }
        BLUL.Logger.info(NAME_LIVE, '今日已进行过签到，等待下次签到');
      } else {
        BLUL.Logger.warn(NAME_LIVE, '未绑定手机，不能签到');
      }
      Util.callAtTime(runLive);
    })();
    const hourRunLinkGroup = 9;
    (async function runLinkGroup () {
      if (!config.sign || !config.linkGroup) return;
      if (Util.isAtTime(await GM.getValue(TIMESTAMP_NAME_LINKGROUP) ?? 0, hourRunLinkGroup)) {
        await linkGroup();
        await GM.setValue(TIMESTAMP_NAME_LINKGROUP, Date.now());
      }
      BLUL.Logger.info(NAME_LINKGROUP, '今日已进行过签到，等待下次签到');
      Util.callAtTime(runLinkGroup, hourRunLinkGroup);
    })();
  }

  BLUL.onupgrade(() => {
    GM.deleteValue(TIMESTAMP_NAME_LIVE);
    GM.deleteValue(TIMESTAMP_NAME_LINKGROUP);
  });

  BLUL.oninit(() => {
    BLUL.Config.addItem('sign', NAME, config.sign, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('sign.live', '直播', config.live, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('sign.linkGroup', '应援团', config.linkGroup, { tag: 'input', attribute: { type: 'checkbox' } });
    BLUL.Config.onload(() => {
      config.sign = BLUL.Config.get('sign');
      config.live = BLUL.Config.get('sign.live');
      config.linkGroup = BLUL.Config.get('sign.linkGroup');
    });
  });

  BLUL.onrun(run);

  BLUL.Sign = {
    run,
    live,
    linkGroup
  };

  BLUL.debug('Module Loaded: Sign', BLUL.Sign);

  return BLUL.Sign;
}
