/* global _ */
/*
请求的options标准格式：
{
  method: 'GET',
  url: 'https://example.com',
  search: {}, // 查询字符串
  headers: {},
  data: {} // POST用，类型取决于 Content-type
  /// 剩余参数取决于所选择的实现
}
 */
export default async function (importModule, BLRHH, GM) {
  const toURLSearchParamString = (search) => {
    return (search instanceof URLSearchParams ? search : new URLSearchParams(search)).toString();
  };

  let interval = 50;
  let maxRequesting = 8;
  let requesting = 0;

  const monkey = async (options) => {
    if (_.isString(options)) options = { url: options };
    const details = _.defaultsDeep({}, options);
    _.defaultsDeep(details, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Cookie: document.cookie
      },
      responseType: 'json'
    });
    if (details.search) {
      details.url += '?' + toURLSearchParamString(details.search);
    }
    if (details.method === 'POST' && details.data) {
      _.defaultsDeep(details, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    }
    const responseType = details.responseType;
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= maxRequesting) {
      await BLRHH.Util.sleep(interval);
    }
    return new Promise((resolve, reject) => {
      requesting++;
      details.onload = response => {
        requesting--;
        response.arrayBuffer = async function () {
          if (responseType === 'arraybuffer') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        response.blob = async function () {
          if (responseType === 'blob') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        response.json = async function () {
          if (responseType === 'json') return response.response;
          try {
            if (responseType === 'text' || responseType === '') return JSON.parse(response.response);
          } catch (error) {
            throw new TypeError('Invalid responseType ' + responseType);
          }
        };
        response.text = async function () {
          if (responseType === 'text' || responseType === '') return response.response;
          throw new TypeError('Invalid responseType ' + responseType);
        };
        BLRHH.debug('Request.monkey:', details, response);
        return resolve(response);
      };
      details.ontimeout = response => {
        requesting--;
        BLRHH.debug('Request.monkey:', details, response);
        return reject(response);
      };
      GM.xmlHttpRequest(details);
    });
  };

  const fetch = async (options) => {
    if (_.isString(options)) options = { url: options };
    const init = _.defaultsDeep({}, options);
    _.defaultsDeep(init, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*'
      },
      cache: 'no-cache',
      credentials: 'include',
      referrer: 'no-referrer'
    });
    if (init.search) {
      init.url += '?' + toURLSearchParamString(init.search);
    }
    if (init.method === 'POST' && init.data) {
      init.body = toURLSearchParamString(init.data);
      _.defaultsDeep(init, { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
    }
    if (init.referrer !== undefined && init.referrer !== 'client' && init.referrer !== 'no-referrer') {
      init.referrerPolicy = 'unsafe-url';
    }
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= maxRequesting) {
      await BLRHH.Util.sleep(interval);
    }
    return new Promise((resolve, reject) => {
      requesting++;
      window.fetch(init.url, init).then(response => {
        requesting--;
        BLRHH.debug('Request.fetch:', init, response);
        return resolve(response);
      }, reason => {
        requesting--;
        BLRHH.debug('Request.fetch:', init, reason);
        return reject(reason);
      });
    });
  };

  BLRHH.onpreinit.push(() => {
    BLRHH.Config.addObjectItem('request', '网络请求设置', false, null, checked => checked ? new Promise((resolve, reject) => {
      const dialog = BLRHH.Dialog.create('除非您知道自己在做什么，否则不建议修改这项设置。确定要继续？', '警告',
        [
          BLRHH.Dialog.createButton('确定', () => confirm(true)),
          BLRHH.Dialog.createButton('取消', () => confirm(false), true)
        ]
      );
      const confirm = (select) => {
        resolve(select);
        BLRHH.Dialog.close(dialog);
      };
      BLRHH.Dialog.show(dialog);
    }) : null);
    BLRHH.Config.addItem('request.interval', '请求间隔', interval, null, null, '单位(ms)');
    BLRHH.Config.addItem('request.maxRequesting', '最大并发数', maxRequesting, null, null, null);

    BLRHH.Config.onload.push(() => {
      interval = BLRHH.Config.get('request.interval');
      maxRequesting = BLRHH.Config.get('request.maxRequesting');
    });
  });

  BLRHH.Request = {
    monkey,
    fetch
  };

  BLRHH.debug('Module Loaded: Request', BLRHH.Request);

  return BLRHH.Request;
}
