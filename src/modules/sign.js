const NAME = '签到';
const config = {
  sign: true,
  live: true,
  linkGroup: true
};
export default async function (importModule, BLRHH, GM) {
  const NAME_LIVE = NAME + '-直播';
  async function live () {
    BLRHH.debug('Sign.live');
    if (!config.live) return;
    try {
      const response = await BLRHH.Request.fetch('https://api.live.bilibili.com/sign/doSign');
      const obj = await response.json();
      if (obj.code === 0) {
        BLRHH.Logger.success(NAME_LIVE, obj.data.text);
        return BLRHH.Util.cancelRetry(live);
      } else if (obj.code === 1011040 || obj.message.includes('已签到')) {
        BLRHH.Logger.info(NAME_LIVE, obj.message);
        return BLRHH.Util.cancelRetry(live);
      }
      BLRHH.Logger.warn(NAME_LIVE, obj.message);
    } catch (error) {
      BLRHH.Logger.error(NAME_LIVE, error);
    }
    return BLRHH.Util.retry(live);
  }

  const NAME_LINKGROUP = NAME + '-应援团';
  async function linkGroup () {
    BLRHH.debug('Sign.linkGroup');
    if (!config.linkGroup) return;
    try {
      const response = await BLRHH.Request.fetch('https://api.vc.bilibili.com/link_group/v1/member/my_groups');
      const obj = await response.json();
      if (obj.code === 0) {
        /* eslint-disable camelcase */
        const promises = [];
        for (const { owner_uid, group_id } of obj.data.list) {
          if (owner_uid === BLRHH.INFO.UID) continue; // 自己不能给自己的应援团应援
          const signOneLinkGroup = async () => {
            try {
              const msg = `应援团(group_id=${group_id},owner_uid=${owner_uid})`;
              const response = await BLRHH.Request.fetch({
                url: 'https://api.vc.bilibili.com/link_setting/v1/link_setting/sign_in',
                search: {
                  group_id,
                  owner_id: owner_uid
                }
              });
              const obj = await response.json();
              if (obj.code === 0) {
                if (obj.data.status === 0) {
                  BLRHH.Logger.success(NAME_LINKGROUP, msg, `签到成功，对应勋章亲密度+${obj.data.add_num}`);
                  return BLRHH.Util.cancelRetry(signOneLinkGroup);
                } else if (obj.data.status === 1) {
                  BLRHH.Logger.info(NAME_LINKGROUP, msg, '今日已签到过');
                  return BLRHH.Util.cancelRetry(signOneLinkGroup);
                }
              }
              BLRHH.Logger.warn(NAME_LINKGROUP, msg, obj.message);
            } catch (error) {
              BLRHH.Logger.error(NAME_LINKGROUP, error);
            }
            return BLRHH.Util.retry(signOneLinkGroup);
          };
          promises.push(signOneLinkGroup());
        }
        return Promise.all(promises);
      }
      BLRHH.Logger.warn(NAME_LINKGROUP, obj.message);
    } catch (error) {
      BLRHH.Logger.error(NAME_LINKGROUP, error);
    }
    return BLRHH.Util.retry(linkGroup);
  }

  const timestampName = 'signTimestamp';

  async function run () {
    BLRHH.debug('Sign.run');
    if (!config.sign) return;
    if (!BLRHH.Util.isToday(await GM.getValue(timestampName) ?? 0)) {
      await Promise.all([live(), linkGroup()]);
      await GM.setValue(timestampName, Date.now());
    }
    BLRHH.Util.callTomorrow(run);
    if (this !== BLRHH.Config) {
      BLRHH.Logger.info(NAME, '今日已进行过签到，等待下次签到');
    }
  }

  BLRHH.onupgrade.push(() => GM.deleteValue(timestampName));

  BLRHH.oninit.push(() => {
    BLRHH.Config.addItem('sign', NAME, config.sign, { tag: 'input', attribute: { type: 'checkbox' } });
    BLRHH.Config.addItem('sign.live', '直播', config.live, { tag: 'input', attribute: { type: 'checkbox' } });
    BLRHH.Config.addItem('sign.linkGroup', '应援团', config.linkGroup, { tag: 'input', attribute: { type: 'checkbox' } });
    BLRHH.Config.onload.push(() => {
      config.sign = BLRHH.Config.get('sign');
      config.live = BLRHH.Config.get('sign.live');
      config.linkGroup = BLRHH.Config.get('sign.linkGroup');
    });
  });

  BLRHH.onrun.push(run);

  BLRHH.Sign = {
    run,
    live,
    linkGroup
  };

  BLRHH.debug('Module Loaded: Sign', BLRHH.Sign);

  return BLRHH.Sign;
}
