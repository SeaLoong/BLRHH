const config = {
  hideToast: false
};
export default async function (importModule, BLRHH, GM) {
  await importModule('toastr');
  await GM.addStyle(await GM.getResourceText('toastr.css'));

  const toastr = window.toastr;
  window.toastr = undefined;
  toastr.options = {
    closeButton: false,
    debug: false,
    newestOnTop: true,
    progressBar: false,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    showDuration: '200',
    hideDuration: '200',
    timeOut: '6000',
    extendedTimeOut: '2000',
    showEasing: 'swing',
    hideEasing: 'swing',
    showMethod: 'slideDown',
    hideMethod: 'slideUp'
  };

  function toast (msg, type = 'success') {
    try {
      if (config.hideToast) return;
      if (this !== BLRHH.Logger) {
        const logger = BLRHH.Logger ?? console;
        logger[type === 'success' ? 'log' : type].call(BLRHH.Toast, logger === console ? msg.replace('<br>', ' ') : msg);
      }
      toastr[type === 'warn' ? 'warning' : type].call(this, msg);
    } catch (error) {
      console.error(`[${BLRHH.NAME}]`, error);
    }
  }

  function success (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'success');
  }

  function info (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'info');
  }

  function warn (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'warn');
  }

  function error (...msgs) {
    return toast.call(this, msgs.join('<br>'), 'error');
  }

  BLRHH.onpreinit.push(() => {
    BLRHH.Config.addItem('hideToast', '隐藏浮动提示', config.hideToast, { help: '浮动提示就是会在右上角显示的那个框框' });

    BLRHH.Config.onload.push(() => {
      config.hideToast = BLRHH.Config.get('hideToast');
    });
  });

  BLRHH.Toast = {
    success,
    info,
    warn,
    error
  };

  BLRHH.debug('Module Loaded: Toast', BLRHH.Toast);

  return BLRHH.Toast;
}
