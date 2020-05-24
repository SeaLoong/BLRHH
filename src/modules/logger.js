export default async function (importModule, BLRHH, GM) {
  const cssLogger = `${BLRHH.NAME}-logger`;
  const cssLoggerItem = `${BLRHH.NAME}-logger-item`;
  const cssLoggerDateTime = `${BLRHH.NAME}-logger-datetime`;
  await GM.addStyle(`
  .${cssLogger} { background-color: #f9f9f9; border-radius: 12px; }
  .${cssLoggerItem} { margin: 8px; padding: 8px; border: 1px solid transparent; border-radius: 6px; vertical-align: middle; line-height: 1.5; text-align: center; word-break: break-all; }
  .${cssLoggerItem}.success { border-color: #47d279; background-color: #ecfaf1; }
  .${cssLoggerItem}.info { border-color: #48bbf8; background-color: #daf1fd; }
  .${cssLoggerItem}.warn { border-color: #ffb243; border-width: 2px; background-color: #fcf8db; }
  .${cssLoggerItem}.error { border-color: #ff6464; border-width: 2px; background-color: #ffe0e0; }
  .${cssLoggerDateTime} { display: block; }
  `);

  let divLogger;

  const dateTimeFormat = new Intl.DateTimeFormat('zh', { dateStyle: 'short', timeStyle: 'long', hour12: false });

  const logs = [];
  let keepScroll = true;

  let maxLog = 1000;
  let showDateTime = true;
  let outputConsole = false;

  function log (msg, type = 'success') {
    try {
      while (logs.length >= maxLog) {
        logs.shift().remove();
      }
      const element = $(`<div class="${cssLoggerItem} ${type}"></div>`);
      let dateTime;
      if (showDateTime) {
        dateTime = dateTimeFormat.format(Date.now());
        element.append($(`<span class="${cssLoggerDateTime}">${dateTime}</span>`));
      }
      element.append(msg);
      logs.push(element);
      divLogger.append(element);
      if (keepScroll) {
        // 滚动到最底部
        divLogger.scrollTop(divLogger.prop('scrollHeight') - divLogger.prop('clientHeight'));
      }
      if (this !== BLRHH.Toast && (type === 'error' || type === 'warn')) {
        BLRHH.Toast[type].call(BLRHH.Logger, msg);
      }
      if (outputConsole || type === 'error' || type === 'warn') {
        msg = msg.replace('<br>', ' ');
        console[type === 'success' ? 'log' : type].call(this, dateTime ? `[${BLRHH.NAME}][${dateTime}]${msg}` : `[${dateTime}]${msg}`);
      }
    } catch (error) {
      console.error(`[${BLRHH.NAME}]`, error);
    }
  }

  function success (...msgs) {
    return log.call(this, msgs.join('<br>'), 'success');
  }

  function info (...msgs) {
    return log.call(this, msgs.join('<br>'), 'info');
  }

  function warn (...msgs) {
    return log.call(this, msgs.join('<br>'), 'warn');
  }

  function error (...msgs) {
    return log.call(this, msgs.join('<br>'), 'error');
  }

  BLRHH.onpreinit.push(() => {
    BLRHH.Page.addTopItem('日志', function (select) {
      if (select) {
        divLogger.show();
      } else {
        divLogger.hide();
        keepScroll = true;
      }
    });

    divLogger = BLRHH.Page.addContentItem();
    divLogger.addClass(cssLogger);
    divLogger.scroll(function () {
      // 滚动条接近底部
      keepScroll = (divLogger.scrollTop() + divLogger.prop('clientHeight') + 30 >= divLogger.prop('scrollHeight'));
    });

    BLRHH.Config.addObjectItem('logger', '日志设置', false);
    BLRHH.Config.addItem('logger.showDateTime', '显示日期时间', showDateTime);
    BLRHH.Config.addItem('logger.maxLog', '日志上限', maxLog, '最多显示多少条日志，数值过大可能会导致性能问题');
    BLRHH.Config.addItem('logger.outputConsole', '同时输出到控制台', outputConsole);

    BLRHH.Config.onload.push(() => {
      showDateTime = BLRHH.Config.get('logger.showDateTime');
      maxLog = BLRHH.Config.get('logger.maxLog');
      outputConsole = BLRHH.Config.get('logger.outputConsole');
    });
  });

  BLRHH.Logger = {
    log,
    success,
    info,
    warn,
    error
  };

  BLRHH.debug('Module Loaded: Logger', BLRHH.Logger);

  return BLRHH.Logger;
}
