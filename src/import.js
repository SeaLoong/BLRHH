/* eslint-disable no-unused-vars */
const RESOURCE = {
  base: 'https://raw.githubusercontent.com/SeaLoong/Bilibili-LRHH/dev/src',
  lodash: 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.15/lodash.min.js',
  toastr: 'https://cdn.bootcdn.net/ajax/libs/toastr.js/2.1.4/toastr.min.js',
  jquery: 'https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js'
};
RESOURCE.import = RESOURCE.base + '/import.js';
RESOURCE.Worker = RESOURCE.base + '/worker/main.js';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function createImportModuleFunc (...context) {
  /**
   * 如果需要上下文, Module 应当返回(export default)一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
   * 在不需要上下文的情况下可以返回任意
   */
  const importUrlMap = new Map();
  async function importModule (name, reImport = false) {
    try {
      if (!reImport && importUrlMap.has(name)) return importUrlMap.get(name);
      let ret = await import(RESOURCE[name] ?? (RESOURCE.base + '/modules/' + name + '.js'));
      const def = ret.default;
      if (def instanceof Function) ret = def.apply(def, context);
      while (ret instanceof Promise) ret = await ret;
      importUrlMap.set(name, ret);
      return ret;
    } catch (error) {
      console.error('[BLRHH]', name, '模块导入失败', error);
    }
  }
  context.unshift(importModule);
  return importModule;
}

function createImportModuleFuncFromGM (...context) {
  /**
   * 如果需要上下文, Module 应当返回(const exports = )一个 Function/AsyncFunction, 其参数表示上下文, 且第一个参数是importModule
   * 在不需要上下文的情况下可以返回任意
   * 这种方式不兼容 export 语法
   */
  const importModuleMap = new Map();
  async function importModule (name, reImport = false) {
    try {
      if (!reImport && importModuleMap.has(name)) return importModuleMap.get(name);
      const code = await GM.getResourceText(name);
      // eslint-disable-next-line no-new-func
      const fn = Function(`${code};\n if (typeof exports !== "undefined") return exports;`);
      let ret = fn.apply(fn, context);
      if (ret instanceof Function) ret = ret.apply(ret, context);
      while (ret instanceof Promise) ret = await ret;
      importModuleMap.set(name, ret);
      return ret;
    } catch (error) {
      console.error('[BLRHH]', name, '模块导入失败', error);
    }
  }
  context.unshift(importModule);
  return importModule;
}

async function checkResetResource () {
  // eslint-disable-next-line no-unused-expressions
  GM.registerMenuCommand?.('恢复默认源', async () => {
    await GM.setValue('resetResource', true);
    window.location.reload(true);
  });
  if (await GM.getValue('resetResource')) return;
  const resource = (await GM.getValue('config'))?.resource;
  if (!resource) return;
  for (const key in RESOURCE) {
    if (resource[key]) RESOURCE[key] = resource[key];
  }
}

function preinitImport (BLRHH) {
  BLRHH.Config.addObjectItem('resource', '自定义源', false);
  BLRHH.Config.addItem('resource.base', '根目录', RESOURCE.base, null, null, null, v => {
    const i = v.trim().search(/\/+$/);
    return i > -1 ? v.substring(0, i) : v;
  });
  for (const name of ['jquery', 'toastr', 'lodash']) {
    BLRHH.Config.addItem(`resource.${name}`, name, RESOURCE[name]);
  }
}

async function initImport (BLRHH) {
  if (await GM.getValue('resetResource')) {
    await BLRHH.Config.reset('resource');
    await GM.deleteValue('resetResource');
  }
  BLRHH.Config.onload.push(loadImport);
}

function loadImport (BLRHH) {
  RESOURCE.base = BLRHH.Config.get('resource.base');
  for (const name of ['jquery', 'toastr', 'lodash']) {
    RESOURCE[name] = BLRHH.Config.get(`resource.${name}`);
  }
}
