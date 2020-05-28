/* global $, _ */
const NAME = '设置';
const CONFIG = {};
const CONFIG_DEFAULT = {};
const nameMap = new Map();
const helpMap = new Map();
const onclickMap = new Map();
const placeholderMap = new Map();
const validatorMap = new Map();
export default async function (importModule, BLRHH, GM) {
  const cssConfigItem = `${BLRHH.NAME}-config-item`;
  const cssConfigControlItem = `${BLRHH.NAME}-config-control-item`;
  const cssInputCheckbox = `${BLRHH.NAME}-config-input-checkbox`;
  const cssInputText = `${BLRHH.NAME}-config-input-text`;
  const cssHelpButton = `${BLRHH.NAME}-config-help-button`;
  await GM.addStyle(`
  .${cssConfigItem} { margin: 8px; font-size: 14px; }
  .${cssConfigControlItem} { padding: 0 8px 4px 8px; border: 1px solid #c8c8c8; border-top: none; }
  .${cssInputCheckbox} { vertical-align: bottom; margin: 0 8px 0 0; height: 16px; width: 16px; }
  .${cssInputText} { margin: -1px 0 -1px 8px; padding: 0; }
  .${cssInputText}.text { width: 400px; }
  .${cssInputText}.number { width: 100px; }
  .${cssHelpButton} { margin: 0 4px; cursor: pointer; text-decoration: underline; color: #0080c6; display: inline; }
  `);

  const DOMMap = new Map();
  const innerOnClickMap = new Map();

  // 返回与 config 对应的一个DOM树(jQuery对象)
  const generate = async (config = CONFIG_DEFAULT, path = '') => {
    if (!path) {
      DOMMap.clear();
      innerOnClickMap.clear();
      const divElement = $('<div/>');
      for (const key in config) {
        divElement.append(await generate(config[key], key));
      }
      return divElement;
    }
    const name = nameMap.get(path);
    let help = helpMap.get(path);
    help = help instanceof Function ? await help() : help;
    const onclick = onclickMap.get(path);
    let placeholder = placeholderMap.get(path) ?? name;
    placeholder = placeholder instanceof Function ? await placeholder() : placeholder;
    const itemElement = $(`<div class="${cssConfigItem}"></div>`);
    const labelElement = $(`<label title="${name}"></label>`);
    let inputElement, helpElement, controlElement;
    let rightToLeft = true;
    switch ($.type(config)) {
      case 'number':
        rightToLeft = false;
        inputElement = $(`<input type="text" class="${cssInputText} number" placeholder="${placeholder}">`);
        break;
      case 'string':
      case 'array':
        rightToLeft = false;
        inputElement = $(`<input type="text" class="${cssInputText} text" placeholder="${placeholder}">`);
        break;
      case 'boolean':
        inputElement = $(`<input type="checkbox" class="${cssInputCheckbox}">`);
        break;
      case 'object':
        inputElement = $(`<input type="checkbox" class="${cssInputCheckbox}">`);
        controlElement = $(`<div class="${cssConfigControlItem}"></div>`);
        for (const key in config) {
          if (key.startsWith('_')) continue;
          controlElement.append(await generate(config[key], path + '.' + key));
        }
        break;
    }
    if (help) {
      helpElement = $(`<span class="${cssHelpButton}">?</span>`);
      helpElement.click(() => {
        if (BLRHH.Dialog) {
          const dialog = new BLRHH.Dialog(help, '帮助');
          dialog.addButton('知道了', dialog.close);
          dialog.show();
        } else {
          alert(help);
        }
      });
    }
    itemElement.append(labelElement);
    if (rightToLeft) {
      labelElement.append(inputElement);
      labelElement.append(name);
    } else {
      labelElement.append(name);
      labelElement.append(inputElement);
    }
    if (helpElement) {
      itemElement.append(helpElement);
    }
    const onclicks = [];
    if (onclick instanceof Function) {
      onclicks.push(async () => {
        try {
          const r = await onclick.call(inputElement, inputElement.is(':checked'));
          if (r !== undefined && r !== null) inputElement.prop('checked', r);
        } catch (error) {
          BLRHH.Logger.error(NAME, error);
        }
      });
    }
    if (controlElement) {
      itemElement.append(controlElement);
      const innerOnClick = () => {
        if (inputElement.is(':checked')) {
          controlElement.show();
        } else {
          controlElement.hide();
        }
      };
      innerOnClickMap.set(inputElement, innerOnClick);
      onclicks.push(innerOnClick);
    }
    if (onclicks.length > 0) {
      inputElement.click(async () => {
        await BLRHH.Util.callEachAndWait(onclicks, inputElement, inputElement.is(':checked'));
      });
    }
    DOMMap.set(path, inputElement);
    return itemElement;
  };

  const get = (path) => {
    if ($.type(_.get(CONFIG_DEFAULT, path)) === 'object') path += '._VALUE_';
    return _.get(CONFIG, path) ?? _.get(CONFIG_DEFAULT, path);
  };

  const set = async (path, value) => {
    const validator = validatorMap.get(path);
    if (validator instanceof Function) {
      value = validator(value);
      while (value instanceof Promise) value = await value;
    }
    if ($.type(_.get(CONFIG_DEFAULT, path)) === 'object') path += '._VALUE_';
    _.set(CONFIG, path, value);
  };

  const onload = [];

  const load = async () => {
    let value = await GM.getValue('config');
    if (!_.isPlainObject(value)) {
      value = {};
    }
    _.assignIn(CONFIG, value);
    await BLRHH.Util.callEachAndWait(onload, BLRHH.Config, BLRHH);
  };

  const save = async () => {
    await GM.setValue('config', CONFIG);
  };

  const reset = async (path = '') => {
    let config = CONFIG_DEFAULT;
    if (path) {
      _.set(CONFIG, path, _.get(CONFIG_DEFAULT, path));
      config = CONFIG;
    } else {
      _.assignIn(CONFIG, CONFIG_DEFAULT);
    }
    await GM.setValue('config', config);
  };

  const upgrade = (path = '') => {
    let ret = 0;
    if (!path) {
      for (const key in CONFIG_DEFAULT) {
        ret += upgrade(key);
      }
      return ret;
    }
    const defaultValue = _.get(CONFIG_DEFAULT, path);
    const value = _.get(CONFIG, path);
    const type = $.type(defaultValue);
    if ($.type(value) !== type) {
      _.set(CONFIG, path, defaultValue);
      ret = 1;
    }
    if (type === 'object') {
      for (const key in defaultValue) {
        if (key.startsWith('_')) continue;
        ret += upgrade(path + '.' + key);
      }
    }
    return ret;
  };

  const loadToContext = (path = '') => {
    if (!path) {
      for (const key in CONFIG_DEFAULT) {
        loadToContext(key);
      }
      return;
    }
    const inputElement = DOMMap.get(path);
    const defaultValue = _.get(CONFIG_DEFAULT, path);
    const value = _.get(CONFIG, path) ?? defaultValue;
    switch ($.type(defaultValue)) {
      case 'number':
      case 'string':
        inputElement.val(value);
        break;
      case 'array':
        inputElement.val(value.join(','));
        break;
      case 'boolean':
        inputElement.prop('checked', value);
        break;
      case 'object':
        inputElement.prop('checked', value._VALUE_);
        innerOnClickMap.get(inputElement)?.call(inputElement); // eslint-disable-line no-unused-expressions
        for (const key in defaultValue) {
          if (key.startsWith('_')) continue;
          loadToContext(path + '.' + key);
        }
        break;
    }
  };

  const saveFromContext = async (path = '') => {
    if (!path) {
      for (const key in CONFIG_DEFAULT) {
        await saveFromContext(key);
      }
      return;
    }
    const inputElement = DOMMap.get(path);
    const defaultValue = _.get(CONFIG_DEFAULT, path);
    let value;
    switch ($.type(defaultValue)) {
      case 'string':
        value = inputElement.val() ?? defaultValue;
        break;
      case 'number':
        value = parseFloat(inputElement.val());
        if (_.isNaN(value)) value = defaultValue;
        break;
      case 'boolean':
        value = inputElement.is(':checked') ?? defaultValue;
        break;
      case 'array':
        value = inputElement.val().replace?.(/(\s|\u00A0)+/, '');
        if (value === '') value = [];
        else value = value.split(',');
        break;
      case 'object':
        value = inputElement.is(':checked') ?? defaultValue;
        for (const key in defaultValue) {
          if (key.startsWith('_')) continue;
          await saveFromContext(path + '.' + key);
        }
        break;
    }
    await set(path, value);
  };

  const addItem = (path, name, defaultValue, options) => {
    _.set(CONFIG_DEFAULT, path, defaultValue);
    const { help, onclick, placeholder, validator } = options ?? {};
    nameMap.set(path, name);
    helpMap.set(path, help);
    onclickMap.set(path, onclick);
    placeholderMap.set(path, placeholder);
    validatorMap.set(path, validator);
  };

  const addObjectItem = (path, name, enable, options) => {
    _.set(CONFIG_DEFAULT, path, { _VALUE_: enable });
    const { help, onclick } = options ?? {};
    nameMap.set(path, name);
    helpMap.set(path, help);
    onclickMap.set(path, onclick);
  };

  BLRHH.onpostinit.push(async () => {
    await load();
    if (upgrade()) {
      await save();
      BLRHH.Logger.warn(NAME, '设置项发生更新，请检查你的设置以确保符合你的要求');
      await load();
    }
    const btnResetClick = async () => {
      const dialog = new BLRHH.Dialog('真的要恢复默认设置吗?', '提示');
      dialog.addButton('确定', dialog.close(true));
      dialog.addButton('取消', dialog.close(false), 1);
      if (await dialog.show()) {
        await reset();
        window.location.reload(true);
      }
    };
    const btnClick = async () => {
      const div = await generate();
      await load();
      loadToContext();
      const dialog = new BLRHH.Dialog(div, '设置');
      dialog.addButton('确定', () => dialog.close(true));
      dialog.addButton('恢复默认设置', btnResetClick, 1);
      dialog.addButton('取消', () => dialog.close(false), 1);
      if (await dialog.show()) {
        await saveFromContext();
        await save();
        BLRHH.Logger.success(NAME, '已保存');
        await load();
      }
    };
    BLRHH.Page.addTopItem('设置', null, btnClick);
    /* eslint-disable no-unused-expressions */
    GM.registerMenuCommand?.('设置', btnClick);
    GM.registerMenuCommand?.('恢复默认设置', btnResetClick);
    /* eslint-enable no-unused-expressions */
  });

  BLRHH.Config = {
    onload,
    get,
    set,
    load,
    save,
    reset,
    upgrade,
    addItem,
    addObjectItem
  };

  BLRHH.debug('Module Loaded: Config', BLRHH.Config);

  return BLRHH.Config;
}
