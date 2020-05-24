/* global RESOURCE */
'use strict';

if (typeof unsafeWindow !== 'undefined') {
  const safeWindow = window;
  // eslint-disable-next-line no-global-assign
  window = unsafeWindow;
  window.close = safeWindow.close;
  window.focus = safeWindow.focus;
  window.safeWindow = safeWindow;
}

const BLRHH = {
  NAME: 'BLRHH',
  ENVIRONMENT: GM.info.scriptHandler,
  ENVIRONMENT_VERSION: GM.info.version,
  VERSION: GM.info.script.version,
  RESOURCE: RESOURCE,
  info: {},
  onpreinit: [],
  oninit: [],
  onpostinit: [],
  onrun: [],
  debug: () => {}
};

(async () => {
  if (await GM.getValue('DEBUG')) {
    localStorage.setItem('videoVolume', 0);
    BLRHH.GM = GM;
    BLRHH.debug = function (...args) {
      console.debug.call(this, `[${BLRHH.NAME}]`, ...args);
    };
    window.top.BLRHH = BLRHH;
    BLRHH.debug(BLRHH);
  }

  await checkResetResource(); // eslint-disable-line no-undef

  // 特殊直播间页面，如 6 55 76
  if (document.getElementById('player-ctnr')) return;

  const importModule = createImportModuleFunc(BLRHH, GM); // eslint-disable-line no-undef

  await importModule('jquery');
  await importModule('Toast');

  const mark = 'running';
  // 检查重复运行
  if (await (async () => {
    const running = parseInt(await GM.getValue(mark) ?? 0);
    const ts = Date.now();
    return (ts - running >= 0 && ts - running <= 15e3);
  })()) {
    BLRHH.Toast.warn('已经有其他页面正在运行脚本了哟~');
    return;
  }
  await importModule('lodash');
  const Util = BLRHH.Util = await importModule('Util');

  BLRHH.info.uid = Util.getCookie('DedeUserID');
  BLRHH.info.csrf = Util.getCookie('bili_jct');

  if (!BLRHH.info.uid || !BLRHH.info.csrf) {
    BLRHH.Toast.warn('你还没有登录呢~');
    return;
  }

  // 标记运行中
  await GM.setValue(mark, Date.now());
  const uniqueCheckInterval = setInterval(async () => {
    await GM.setValue(mark, Date.now());
  }, 10e3);
  window.addEventListener('unload', async () => {
    clearInterval(uniqueCheckInterval);
    await GM.deleteValue(mark);
  });

  await importModule('Page');
  await importModule('Logger');
  await importModule('Dialog');
  await importModule('Config');
  await importModule('Request');
  await importModule('Sign');

  /* eslint-disable no-undef */
  BLRHH.onpreinit.push(preinitImport);
  BLRHH.oninit.push(initImport);
  /* eslint-enable no-undef */

  console.log('GlobalScope:', Util.getGlobalScope());

  await Util.callUntilTrue(() => window.BilibiliLive?.ROOMID !== 0);

  await Util.callEachAndWait(BLRHH.onpreinit, BLRHH, BLRHH, GM);
  await Util.callEachAndWait(BLRHH.oninit, BLRHH, BLRHH, GM);
  await Util.callEachAndWait(BLRHH.onpostinit, BLRHH, BLRHH, GM);
  await Util.callEachAndWait(BLRHH.onrun, BLRHH, BLRHH, GM);

  /*
  const url = Util.codeToURL(`importScripts('${RESOURCE.import}');RESOURCE.BASE += '/worker';importScripts('${RESOURCE.Worker}');`);
  console.log(url);
  const worker = new Worker(url);
  worker.onerror = e => console.error('main worker', e);
  worker.onmessage = e => console.log('main worker', e);
  worker.postMessage('main worker init');
  console.log(worker);
  */
})();
