// ==UserScript==
// @name         Bilibili直播间挂机助手3
// @namespace    SeaLoong
// @version      3.1.11
// @description  B站直播间挂机用: 签到，领瓜子，移动端心跳，瓜子换硬币等
// @author       SeaLoong
// @homepageURL  https://github.com/SeaLoong/BLRHH
// @supportURL   https://github.com/SeaLoong/BLRHH/issues
// @updateURL    https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/installer.jsdelivr.user.js
// @include      /^https?:\/\/live\.bilibili\.com\/(blanc\/)?\d+.*$/
// @license      MIT License
// @resource     EULA https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/html/eula.html
// @resource     NOTICE https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/html/notice.html
// @resource     tfjs https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@2.3.0/dist/tf.min.js
// @resource     Sign https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/sign.js
// @resource     Exchange https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/exchange.js
// @resource     TreasureBox https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/treasurebox.js
// @resource     TreasureBox/worker https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/treasurebox/worker.js
// @resource     Heartbeat https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/heartbeat.js
// @resource     DailyReward https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/dailyreward.js
// @resource     AvoidDetection https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist/modules/avoiddetection.js
// @resource     jquery https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @resource     lodash https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js
// @resource     toastr https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js
// @resource     spark-md5 https://cdn.bootcdn.net/ajax/libs/spark-md5/3.0.0/spark-md5.min.js
// @resource     Toast https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/toast.js
// @resource     Util https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/util.js
// @resource     Dialog https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/dialog.js
// @resource     Page https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/page.js
// @resource     Logger https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/logger.js
// @resource     Config https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/config.js
// @resource     Request https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/request.js
// @resource     Worker https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker.js
// @resource     Worker/env https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker/env.js
// @resource     Worker/channel https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/worker/channel.js
// @resource     AppToken https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist/modules/apptoken.js
// @connect      bilibili.com
// @connect      *
// @grant        unsafeWindow
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @grant        GM.getResourceUrl
// @grant        GM.xmlHttpRequest
// @grant        GM.addStyle
// @grant        GM.getResourceText
// @grant        GM.registerMenuCommand
// @grant        GM.unregisterMenuCommand
// @run-at       document-start
// @incompatible chrome 不支持内核低于80的版本
// @incompatible firefox 不支持内核低于72的版本
// ==/UserScript==

'use strict';
var BLUL;
(function () {
  try {
    ((0, eval)('(null ?? 1) && (({a: 1})?.a)')); // eslint-disable-line no-eval
  } catch (error) {
    console.error('[BLUL]不支持当前浏览器，请使用内核不低于Chromium80或Firefox72的浏览器', error);
    return;
  }

  if (typeof unsafeWindow !== 'undefined') {
    const safeWindow = window;
    window = unsafeWindow; // eslint-disable-line no-global-assign
    window.safeWindow = safeWindow;
  }

  if (window.top.BLUL) {
    // console.warn('[BLUL]检测到BLUL已存在，本脚本将不再初始化BLUL，脚本行为可能会出现异常');
    BLUL = new Proxy(window.top.BLUL, {
      has: function (target, property) {
        if (property === 'isChild') return true;
        return property in target;
      },
      get: function (target, property, receiver) {
        if (property === 'isChild') return true;
        return target[property];
      }
    });
    return;
  }
  BLUL = {
    debug: () => {},
    NAME: 'BLUL',
    GM: GM,
    ENVIRONMENT: GM.info.scriptHandler,
    ENVIRONMENT_VERSION: GM.info.version,
    VERSION: GM.info.script.version,
    RESOURCE: {},
    BLUL_MODULE_NAMES: ['Toast', 'Util', 'Dialog', 'Page', 'Logger', 'Config', 'Request', 'Worker', 'Worker/env', 'Worker/channel', 'AppToken'],
    INFO: {},
    TRACKED_LISTENERS: {}
  };

  BLUL.lazyFn = function (...args) {
    let object = BLUL;
    let name;
    let promise = false;
    if (args.length >= 3) [object, name, promise] = args;
    else if (args.length === 2) [object, name] = args;
    else [name] = args;
    const list = [];
    let fn;
    Object.defineProperty(object, name, {
      configurable: true,
      get: () => fn ?? ((...args) => promise ? new Promise(resolve => list.push({ args, resolve })) : list.push({ args })),
      set: f => {
        fn = f;
        if (fn instanceof Function) {
          for (const { resolve, args } of list) {
            const v = fn.apply(object, args);
            if (resolve) resolve(v);
          }
        }
      }
    });
  };

  BLUL.getResourceUrl = async (name) => await GM.getResourceUrl(name) ?? BLUL.RESOURCE[name] ?? ((BLUL.BLUL_MODULE_NAMES.includes(name) ? BLUL.RESOURCE.BLULBase : BLUL.RESOURCE.base) + '/modules/' + name.toLowerCase() + '.js');

  BLUL.getResourceText = async (name) => {
    let ret = await GM.getResourceText(name);
    if (ret === undefined || ret === null) {
      ret = (await window.fetch(await BLUL.getResourceUrl(name))).text();
    }
    return ret;
  };

  BLUL.createImportModuleFunc = function (context, keepContext = false) {
    /**
     * 如果需要上下文, Module 应当返回(export default)一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
     * 在不需要上下文的情况下可以返回任意
     */
    const importUrlMap = new Map();
    async function importModule (name, reImport = false) {
      try {
        if (!reImport && importUrlMap.has(name)) return importUrlMap.get(name);
        const url = await BLUL.getResourceUrl(name);
        try {
          let ret = await import(url);
          ret = ret?.default ?? ret;
          if (ret instanceof Function) ret = ret.apply(window, context);
          ret = await ret;
          importUrlMap.set(name, ret);
          return ret;
        } catch (error) {
          (BLUL.Logger ?? console).error(`模块 ${name} 导入失败，尝试使用script标签加载`, error);
          return new Promise((resolve, reject) => {
            const elem = document.createElement('script');
            elem.onerror = reject;
            elem.onload = () => {
              importUrlMap.set(name, undefined);
              resolve();
            };
            document.body.appendChild(elem);
            elem.src = url;
          });
        }
      } catch (error) {
        (BLUL.Logger ?? console).error(`使用script标签加载模块 ${name} 失败`, error);
      }
    }
    if (!keepContext) context.unshift(importModule);
    return importModule;
  };

  BLUL.createImportModuleFromCodeFunc = function (context, keepContext = false) {
    /**
     * 如果需要上下文, Module 应当返回(const exports = )一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
     * 在不需要上下文的情况下可以返回任意
     * 这种方式不兼容 export 语法
     */
    const importCodeMap = new Map();
    async function importModule (code, reImport = false) {
      try {
        if (!reImport && importCodeMap.has(code)) return importCodeMap.get(code);
        code = (await BLUL.getResourceText(code) ?? code);
        code = code.replace('export default', 'const exports =') + ';\nif (typeof exports !== "undefined") return exports;';
        const fn = Function(code); // eslint-disable-line no-new-func
        let ret = fn.apply(window, context);
        if (ret instanceof Function) ret = ret.apply(window, context);
        ret = await ret;
        importCodeMap.set(code, ret);
        return ret;
      } catch (error) {
        (BLUL.Logger ?? console).error('模块导入失败', error, code);
      }
    }
    if (!keepContext) context.unshift(importModule);
    return importModule;
  };

  BLUL.lazyFn('__addResourceConfig');
  BLUL.lazyFn('setBase');
  BLUL.lazyFn('importModule');
  BLUL.lazyFn('onupgrade');
  BLUL.lazyFn('onpreinit');
  BLUL.lazyFn('oninit');
  BLUL.lazyFn('onpostinit');
  BLUL.lazyFn('onrun');

  BLUL.addResource = async function (name, urls, displayName) {
    if (BLUL.RESOURCE[name] !== undefined) return;
    BLUL.RESOURCE[name] = urls instanceof Array ? urls[0] : urls;
    BLUL.__addResourceConfig(name, urls, displayName);
    if (await GM.getValue('resetResource')) return;
    const resource = (await GM.getValue('config'))?.resource;
    if (!resource) return;
    if (resource[name]?.__VALUE__) BLUL.RESOURCE[name] = resource[name]?.__VALUE__;
  };

  const listenerFilters = {};
  BLUL.addListenerFilter = (type, f) => {
    if (!(listenerFilters[type] instanceof Array)) listenerFilters[type] = [];
    listenerFilters[type].push(f);
  };

  BLUL.removeListenerFilter = (type, f) => {
    if (listenerFilters[type] instanceof Array) {
      for (let i = 0; i < listenerFilters[type].length; i++) {
        if (listenerFilters[type][i] === f) {
          listenerFilters[type].splice(i, 1);
          break;
        }
      }
    }
  };

  const addEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, ...args) {
    if (listenerFilters[type] instanceof Array) {
      let allow = true;
      for (const f of listenerFilters[type]) {
        allow &= f.call(this, type, listener, ...args);
        if (!allow) return;
      }
    }
    if (!(BLUL.TRACKED_LISTENERS[type] instanceof Array)) BLUL.TRACKED_LISTENERS[type] = [];
    BLUL.TRACKED_LISTENERS[type].push({ target: this, listener, args });
    addEventListener.call(this, type, listener, ...args);
  };

  const removeEventListener = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.removeEventListener = function (type, listener, ...args) {
    if (BLUL.TRACKED_LISTENERS[type] instanceof Array) {
      for (let i = 0; i < BLUL.TRACKED_LISTENERS[type].length; i++) {
        const o = BLUL.TRACKED_LISTENERS[type][i];
        if (o.target === this && o.listener === listener) {
          BLUL.TRACKED_LISTENERS[type].splice(i, 1);
          break;
        }
      }
    }
    removeEventListener.call(this, type, listener, ...args);
  };

  BLUL.removeAllListener = (type, rejectType = true) => {
    if (rejectType) {
      listenerFilters[type] = [t => type !== t];
    }
    for (const o of BLUL.TRACKED_LISTENERS[type]) {
      removeEventListener.call(o.target, type, o.listener, ...o.args);
    }
    BLUL.TRACKED_LISTENERS[type] = null;
  };

  BLUL.recover = () => {
    EventTarget.prototype.addEventListener = addEventListener;
    EventTarget.prototype.removeEventListener = removeEventListener;
  };

  let hasRun = false;
  BLUL.run = async (options) => {
    if (hasRun) return 2;
    hasRun = true;
    const { debug, slient, unique, login, EULA, EULA_VERSION, NOTICE } = options ?? {};
    if (debug) {
      BLUL.debug = console.debug;
      BLUL.debug(BLUL);
    }

    // 等待load事件
    await new Promise(resolve => {
      window.addEventListener('load', resolve);
    });

    // 特殊直播间页面，如 6 55 76
    if (!document.getElementById('aside-area-vm')) return 1;

    const resetResourceMenuCmdId = await GM.registerMenuCommand?.('恢复默认源', async () => {
      await GM.setValue('resetResource', true);
      window.location.reload(true);
    });
    const unregisterMenuCmd = async () => {
      BLUL.debug('unregisterMenuCmd');
      if (await GM.getValue('resetResource')) {
        await BLUL.Config.reset('resource', true);
        await GM.deleteValue('resetResource');
      }
      await GM.unregisterMenuCommand?.(resetResourceMenuCmdId); // eslint-disable-line no-unused-expressions
    };

    await BLUL.addResource('BLULBase', ['https://cdn.jsdelivr.net/gh/SeaLoong/BLUL@dist'], 'BLUL根目录');
    await BLUL.addResource('lodash', ['https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.19/lodash.min.js', 'https://cdn.jsdelivr.net/npm/lodash@4.17.19/lodash.min.js']);
    await BLUL.addResource('toastr', ['https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js', 'https://cdn.jsdelivr.net/npm/toastr@2.1.4/toastr.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/toastr.js/latest/toastr.min.js']);
    await BLUL.addResource('jquery', ['https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js', 'https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js', 'https://code.jquery.com/jquery-3.5.1.min.js']);

    BLUL.onpostinit(unregisterMenuCmd);

    const importModule = BLUL.createImportModuleFromCodeFunc([BLUL, GM]);

    await importModule('jquery');
    await importModule('Toast');

    if (unique) {
      const mark = 'running';
      // 检查重复运行
      if (await (async () => {
        const running = parseInt(await GM.getValue(mark) ?? 0);
        const ts = Date.now();
        return (ts - running >= 0 && ts - running <= 5e3);
      })()) {
        if (!slient) {
          BLUL.Toast.warn('已经有其他页面正在运行脚本了哟~');
        }
        await unregisterMenuCmd();
        return 2;
      }
      // 标记运行中
      await GM.setValue(mark, Date.now());
      const uniqueCheckInterval = setInterval(async () => {
        await GM.setValue(mark, Date.now());
      }, 4e3);
      window.addEventListener('unload', async () => {
        clearInterval(uniqueCheckInterval);
        await GM.deleteValue(mark);
      });
    }
    await importModule('lodash'); /* global _ */
    const Util = BLUL.Util = await importModule('Util');

    await Util.callUntilTrue(() => window.BilibiliLive?.ROOMID && window.BilibiliLive?.ANCHOR_UID && window.BilibiliLive?.SHORT_ROOMID && window.__statisObserver);

    if (login) {
      BLUL.INFO.CSRF = Util.getCookie('bili_jct');
      if (!BLUL.INFO.CSRF) {
        if (!slient) {
          BLUL.Toast.warn('你还没有登录呢~');
        }
        await unregisterMenuCmd();
        return 3;
      }
      await Util.callUntilTrue(() => window.BilibiliLive?.UID);
    }
    await importModule('Dialog');

    if (EULA) {
      if (Util.compareVersion(EULA_VERSION, await GM.getValue('eulaVersion')) > 0) {
        await GM.setValue('eula', false);
      }
      if (!await GM.getValue('eula')) {
        const dialog = new BLUL.Dialog(await Util.result(EULA), '最终用户许可协议');
        dialog.addButton('我同意', () => dialog.close(true));
        dialog.addButton('我拒绝', () => dialog.close(false), 1);
        if (!await dialog.show()) {
          await unregisterMenuCmd();
          return 4;
        }
        await GM.setValue('eula', true);
        await GM.setValue('eulaVersion', EULA_VERSION);
      }
    }

    await importModule('Page');
    await importModule('Logger');
    await importModule('Config');
    await importModule('Request');
    await importModule('Worker');
    await importModule('AppToken');

    BLUL.Config.addItem('resource', '自定义源', false, { tag: 'input', help: '该设置项下的各设置项只在没有设置对应的 @resource 时有效。<br>此项直接影响脚本的加载，URL不正确或访问速度太慢均可能导致不能正常加载。<br>需要重置源可点击油猴图标再点击此脚本下的"恢复默认源"来重置。', attribute: { type: 'checkbox' } });

    BLUL.__addResourceConfig = (name, urls, displayName = name) => {
      BLUL.Config.addItem(`resource.${name}`, displayName, BLUL.RESOURCE[name], {
        tag: 'input',
        list: urls instanceof Array ? urls : undefined,
        corrector: v => {
          const i = v.trim().search(/\/+$/);
          return i > -1 ? v.substring(0, i) : v;
        },
        attribute: { type: 'url' }
      });
      BLUL.Config.onload(() => {
        BLUL.RESOURCE[name] = BLUL.Config.get(`resource.${name}`);
      });
    };

    BLUL.setBase = _.once(urls => BLUL.addResource('base', urls, '根目录'));

    BLUL.importModule = importModule;

    BLUL.INFO.UID = window.BilibiliLive.UID;
    BLUL.INFO.ROOMID = window.BilibiliLive.ROOMID;
    BLUL.INFO.ANCHOR_UID = window.BilibiliLive.ANCHOR_UID;
    BLUL.INFO.SHORT_ROOMID = window.BilibiliLive.SHORT_ROOMID;
    BLUL.INFO.VISIT_ID = window.__statisObserver.__visitId ?? '';
    BLUL.INFO.__NEPTUNE_IS_MY_WAIFU__ = window.__NEPTUNE_IS_MY_WAIFU__; // 包含B站自己请求返回的一些数据，当然也可以自行请求获取

    const callHandler = f => {
      try {
        return f.apply(BLUL.load, [BLUL, GM]);
      } catch (error) {
        (BLUL.Logger ?? console).error(error);
      }
    };
    if (Util.compareVersion(BLUL.VERSION, await GM.getValue('version')) > 0) {
      await GM.setValue('version', BLUL.VERSION);
      if (NOTICE) {
        const dialog = new BLUL.Dialog(await Util.result(NOTICE), '更新说明-' + BLUL.VERSION);
        dialog.addButton('知道了', () => dialog.close());
        dialog.show();
      }
      BLUL.onupgrade = callHandler;
    }
    BLUL.onpreinit = callHandler;
    BLUL.oninit = callHandler;
    BLUL.onpostinit = callHandler;
    BLUL.onrun = callHandler;

    window.top[BLUL.NAME] = window.top.BLUL = BLUL;
    return 0;
  };
})();





/* global BLUL */
'use strict';

(async () => {
  const EULA = await GM.getResourceText('EULA');
  const NOTICE = await GM.getResourceText('NOTICE');
  BLUL.NAME = 'BLRHH';
  const result = await BLUL.run({ debug: await GM.getValue('debug'), slient: false, unique: true, login: true, EULA: EULA, EULA_VERSION: EULA.match(/\[v(.+?)\]/)[1], NOTICE: NOTICE });
  switch (result) {
    case 0:
      break;
    case 1:
      break;
    case 2:
      break;
    case 3:
      (BLUL.Logger ?? console).warn('脚本运行需要登录，当前未登录');
      break;
    case 4:
      (BLUL.Logger ?? console).warn('未同意EULA，脚本将不会运行');
      break;
  }
  if (result !== 0) {
    BLUL.recover();
    return;
  }
  BLUL.Logger.info('脚本信息', `运行环境: ${BLUL.ENVIRONMENT} ${BLUL.ENVIRONMENT_VERSION}`, `版本: ${BLUL.VERSION}`);
  const { importModule } = BLUL;
  try {
    const r = await BLUL.Request.fetch('https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByUser?room_id=' + BLUL.INFO.ROOMID);
    const obj = await r.json();
    BLUL.INFO.InfoByUser = obj.data;
    if (obj.code !== 0) {
      BLUL.Logger.warn(obj.message);
    }
    /* eslint-disable camelcase */
    const color = Number(BLUL.INFO.InfoByUser?.property?.danmu?.color).toString(16).toUpperCase();
    BLUL.Logger.info('用户信息', `uid: ${BLUL.INFO.UID} 用户名: ${BLUL.INFO.InfoByUser?.info?.uname}`,
    `手机绑定: ${BLUL.INFO.InfoByUser?.info?.mobile_verify ? '是' : '否'} 实名认证: ${BLUL.INFO.InfoByUser?.info?.identification ? '是' : '否'}`,
    `UL: ${BLUL.INFO.InfoByUser?.user_level?.level} 金瓜子: ${BLUL.INFO.InfoByUser?.wallet?.gold} 银瓜子: ${BLUL.INFO.InfoByUser?.wallet?.silver}`,
    `弹幕模式: ${BLUL.INFO.InfoByUser?.property?.danmu?.mode} 弹幕颜色: <span style="color: #${color};">${color}</span> 弹幕长度: ${BLUL.INFO.InfoByUser?.property?.danmu?.length}`,
    `房间id: ${BLUL.INFO.ROOMID} 短id: ${BLUL.INFO.SHORT_ROOMID} 主播uid: ${BLUL.INFO.ANCHOR_UID}`);
    /* eslint-enable camelcase */
  } catch (error) {
    BLUL.Logger.error('初始化用户信息失败', error);
  }
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/BLRHH@dist');
  await importModule('Sign');
  await importModule('Exchange');
  await importModule('TreasureBox');
  await importModule('Heartbeat');
  await importModule('DailyReward');
  await importModule('AvoidDetection');
})();


