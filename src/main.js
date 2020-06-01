/* global BLUL */
'use strict';

(async () => {
  BLUL.NAME = 'BLRHH';
  BLUL.RESOURCE.base = 'https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src';
  await BLUL.preload({ debug: true, slient: false, unique: true, login: true, EULA: '' });
  BLUL.onpreinit.push(() => {
    BLUL.Config.addItem('resource.base', '根目录', BLUL.RESOURCE.base, {
      tag: 'input',
      list: [
        'http://127.0.0.1:8080/src',
        'https://cdn.jsdelivr.net/gh/SeaLoong/Bilibili-LRHH@dev/src',
        'https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src'
      ],
      attribute: { type: 'url' }
    });
    BLUL.Config.onload.push(() => {
      BLUL.RESOURCE.base = BLUL.Config.get('resource.base');
    });
  });
  const { Util, importModule } = BLUL;
  await importModule('Sign');
  await importModule('Exchange');
  await BLUL.load();

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
