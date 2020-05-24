const NAME = '自动签到';
export default async function (importModule, BLRHH, GM) {
  const NAME_LIVE = NAME + '-直播';

  let sign = true;
  let signLive = true;
  async function live () {
    BLRHH.debug('Sign.live');
    if (!signLive) return;
    try {
      const response = await BLRHH.Request.fetch('https://api.live.bilibili.com/sign/doSign');
      const obj = await response.json();
      if (obj.code === 0) {
        BLRHH.Logger.success(NAME_LIVE, obj.message);
        return BLRHH.Util.removeRetry(live);
      } else if (obj.code === 1011040 || obj.message.includes('已签到')) {
        BLRHH.Logger.info(NAME_LIVE, obj.message);
        return BLRHH.Util.removeRetry(live);
      }
      BLRHH.Logger.warn(NAME_LIVE, obj.message);
    } catch (error) {
      BLRHH.Logger.error(NAME_LIVE, error);
    }
    return BLRHH.Util.retry(live);
  }

  const NAME_LINKGROUP = NAME + '-应援团';

  let signLinkGroup = true;
  async function linkGroup () {
    BLRHH.debug('Sign.linkGroup');
    if (!signLinkGroup) return;
    try {
      const response = await BLRHH.Request.fetch({
        url: 'https://api.vc.bilibili.com/link_group/v1/member/my_groups',
        referrer: ''
      });
      const obj = await response.json();
      if (obj.code === 0) {
        /* eslint-disable camelcase */
        const promises = [];
        for (const { owner_uid, group_id } of obj.data.list) {
          if (owner_uid === BLRHH.info.uid) continue; // 自己不能给自己的应援团应援
          const signOneLinkGroup = async () => {
            try {
              const msg = `应援团(group_id=${group_id},owner_uid=${owner_uid})`;
              const response = await BLRHH.Request.fetch({
                url: 'https://api.vc.bilibili.com/link_setting/v1/link_setting/sign_in',
                search: {
                  group_id,
                  owner_id: owner_uid
                },
                referrer: ''
              });
              const obj = await response.json();
              if (obj.code === 0) {
                if (obj.data.status === 0) {
                  BLRHH.Logger.success(NAME_LINKGROUP, msg, `签到成功，对应勋章亲密度+${obj.data.add_num}`);
                  return BLRHH.Util.removeRetry(signOneLinkGroup);
                } else if (obj.data.status === 1) {
                  BLRHH.Logger.info(NAME_LINKGROUP, msg, '今日已签到过');
                  return BLRHH.Util.removeRetry(signOneLinkGroup);
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
    if (!sign) return;
    if (!BLRHH.Util.isToday(await GM.getValue(timestampName) ?? 0)) {
      await Promise.all([live(), linkGroup()]);
      await GM.setValue(timestampName, Date.now());
    }
    BLRHH.Util.callTomorrow(run);
    if (this !== BLRHH.Config) {
      BLRHH.Logger.info(NAME, '等待下次签到');
    }
  }

  BLRHH.oninit.push(() => {
    BLRHH.Config.addObjectItem('sign', NAME, sign);
    BLRHH.Config.addItem('sign.live', '直播', signLive);
    BLRHH.Config.addItem('sign.linkGroup', '应援团', signLinkGroup);
    BLRHH.Config.onload.push(() => {
      sign = BLRHH.Config.get('sign');
      signLive = BLRHH.Config.get('sign.live');
      signLinkGroup = BLRHH.Config.get('sign.linkGroup');
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
