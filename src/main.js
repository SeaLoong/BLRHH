/* global BLUL */
'use strict';

(async () => {
  BLUL.NAME = 'BLRHH';
  if (!await BLUL.run({ debug: true, slient: false, unique: true, login: true, EULA: '' })) {
    console.error('[BLRHH] BLUL加载失败');
    return;
  }
  BLUL.setBase('https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src');
  const { Util, importModule } = BLUL;
  await importModule('Sign');
  await importModule('Exchange');

  console.log('GlobalScope:', Util.getGlobalScope());

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
