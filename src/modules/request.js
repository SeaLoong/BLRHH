/* global _ */
/*
请求的options标准格式：
{
  method: 'GET',
  url: 'https://example.com',
  search: {}, // 查询字符串
  headers: {},
  data: {} // POST用，fetch下会自动转换为 URLSearchParam ，monkeyx想类型取决于 Content-type
  /// 剩余参数取决于所选择的实现
}
 */
const config = {
  interval: 50,
  maxRequesting: 8
};
export default async function (importModule, BLRHH, GM) {
  const toURLSearchParamString = (search) => {
    return (search instanceof URLSearchParams ? search : new URLSearchParams(search)).toString();
  };

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
    if (!_.isEmpty(details.search)) {
      details.url += '?' + toURLSearchParamString(details.search);
    }
    if (details.method === 'POST' && !_.isEmpty(details.data)) {
      _.defaultsDeep(details, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    }
    const responseType = details.responseType;
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= config.maxRequesting) {
      await BLRHH.Util.sleep(config.interval);
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
      referrer: ''
    });
    if (!_.isEmpty(init.search)) {
      init.url += '?' + toURLSearchParamString(init.search);
    }
    if (init.method === 'POST' && !_.isEmpty(init.data)) {
      _.defaultsDeep(init, { headers: { 'content-type': 'application/x-www-form-urlencoded' } });
      if (init.headers?.['content-type'] === 'application/x-www-form-urlencoded') {
        init.body = toURLSearchParamString(init.data);
      } else {
        init.body = init.data;
      }
    }
    // eslint-disable-next-line no-unmodified-loop-condition
    while (requesting >= config.maxRequesting) {
      await BLRHH.Util.sleep(config.interval);
    }
    return new Promise((resolve, reject) => {
      requesting++;
      const req = new Request(init.url, init);
      window.fetch(req).then(response => {
        requesting--;
        BLRHH.debug('Request.fetch:', req, response);
        return resolve(response);
      }, reason => {
        requesting--;
        BLRHH.debug('Request.fetch:', req, reason);
        return reject(reason);
      });
    });
  };

  BLRHH.onpreinit.push(() => {
    BLRHH.Config.addObjectItem('request', '网络请求设置', false, {
      onclick: async (checked) => {
        if (!checked) return;
        const dialog = new BLRHH.Dialog('除非您知道自己在做什么，否则不建议修改这项设置。确定要继续？', '警告');
        dialog.addButton('确定', () => dialog.close(true));
        dialog.addButton('取消', () => dialog.close(false), 1);
        return dialog.show();
      }
    });
    BLRHH.Config.addItem('request.interval', '请求间隔', config.interval, { placeholder: '单位(ms)' });
    BLRHH.Config.addItem('request.maxRequesting', '最大并发数', config.maxRequesting);

    BLRHH.Config.onload.push(() => {
      config.interval = BLRHH.Config.get('request.interval');
      config.maxRequesting = BLRHH.Config.get('request.maxRequesting');
    });
  });

  BLRHH.Request = {
    monkey,
    fetch
  };

  BLRHH.debug('Module Loaded: Request', BLRHH.Request);

  return BLRHH.Request;
}
