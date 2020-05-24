export default async function (importModule, BLRHH, GM) {
  const cssDialog = `${BLRHH.NAME}-dialog`;
  const cssDialogPosition = `${BLRHH.NAME}-dialog-position`;
  const cssDialogWidth = `${BLRHH.NAME}-dialog-width`;
  const cssDialogStyle = `${BLRHH.NAME}-dialog-style`;
  const cssDialogTitle = `${BLRHH.NAME}-dialog-title`;
  const cssDialogTitleText = `${BLRHH.NAME}-dialog-title-text`;
  const cssDialogContent = `${BLRHH.NAME}-dialog-title`;
  const cssDialogButtonClose = `${BLRHH.NAME}-dialog-button-close`;
  const cssDialogButton = `${BLRHH.NAME}-dialog-button`;
  const cssDialogButtonPrimary = `${BLRHH.NAME}-dialog-button-primary`;
  const cssDialogButtonGhost = `${BLRHH.NAME}-dialog-button-ghost`;
  await GM.addStyle(`
  .${cssDialog} { display: table; position: fixed; height: 100%; width: 100%; top: 0; left: 0; font-size: 12px; z-index: 10000; background-color: rgba(0,0,0,.5); }
  .${cssDialogPosition} { display: table-cell; vertical-align: middle; }
  .${cssDialogWidth} { margin: auto; width: fit-content; max-width: 70%; min-width: 30%; }
  .${cssDialogStyle} { position: relative; top: 50%; padding: 20px; border-radius: 5px; background-color: #fff; box-shadow: 0 0 5em 0.5em rgba(0,0,0,.2); word-wrap: break-word; word-break: break-word; animation: move-in-top cubic-bezier(.22,.58,.12,.98) .4s; font-size: 14px; }
  .${cssDialogTitle} { position: relative; padding-bottom: 5px; }
  .${cssDialogTitleText} { margin: 0; color: #23ade5; font-weight: 400; font-size: 18px; }
  .${cssDialogContent} { overflow: overlay; margin: 14px; }
  .${cssDialogButtonClose} { width: 26px; height: 26px; right: 12px; top: 12px; color: #999; line-height: 26px; transition: all .3s cubic-bezier(.22,.58,.12,.98); cursor: pointer; background-repeat: no-repeat; background-position: 50%; text-align: center; position: absolute; font-size: 18px; }
  .${cssDialogButtonClose}:hover { transform: rotate(180deg) scale(1.1); }
  .${cssDialogButton} { position: relative; box-sizing: border-box; line-height: 1; padding: 6px 12px; border: 0; cursor: pointer; outline: none; overflow: hidden; min-width: 104px; height: 32px; font-size: 14px; margin: 0 10px; }
  .${cssDialogButtonPrimary} { background-color: #23ade5; color: #fff; border-radius: 4px; }
  .${cssDialogButtonPrimary}:hover { background-color: #39b5e7; }
  .${cssDialogButtonGhost} { border: 1px solid #23ade5; background-color: #fff; color: #23ade5; border-radius: 4px; }
  .${cssDialogButtonGhost}:hover { border-color: #39b5e7; background-color: #39b5e7; color: #fff; }
  `);

  const dialogs = new Map();
  let curDialog = null;

  const create = (content, title = '提示', buttons = null) => {
    const dialog = $(`<div class="${cssDialog}"></div>`);
    const divPosition = $(`<div class="${cssDialogPosition}"></div>`);
    const divWidth = $(`<div class="${cssDialogWidth}"></div>`);
    const divStyle = $(`<div class="${cssDialogStyle}"></div>`);
    dialog.append(divPosition);
    divPosition.append(divWidth);
    divWidth.append(divStyle);

    const divTitle = $(`<div class="${cssDialogTitle}"><h2 class="${cssDialogTitleText}">${title}</h2></div>`);
    divStyle.append(divTitle);

    const divContent = $(`<div class="${cssDialogContent}"></div>`);
    divStyle.append(divContent);
    divContent.append(content);

    if (buttons) {
      const divButtons = $('<div style="text-align: center;"></div>');
      if (!(buttons instanceof Array)) buttons = [buttons];
      for (const button of buttons) {
        divButtons.append(button);
      }
      divStyle.append(divButtons);
    }

    const divClose = $(`<div class="${cssDialogButtonClose}">❌</div>`);
    divStyle.append(divClose);

    divClose.click(() => close());
    return dialog;
  };

  const createButton = (text, onclick, ghost = false) => {
    const style = ghost ? cssDialogButtonGhost : cssDialogButtonPrimary;
    const button = $(`<button class="${cssDialogButton} ${style}">${text}</button>`);
    button.click(onclick);
    return button;
  };

  const show = (dialog) => {
    if (!dialog || dialogs.has(dialog)) return;
    dialogs.set(dialog, curDialog);
    curDialog = dialog;
    $('body').append(dialog);
  };

  const close = (dialog) => {
    dialog = dialog ?? curDialog;
    if (dialog !== curDialog) return;
    curDialog = dialogs.get(dialog);
    dialogs.delete(dialog);
    dialog.remove();
  };

  BLRHH.Dialog = {
    create,
    createButton,
    show,
    close
  };

  BLRHH.debug('Module Loaded: Dialog', BLRHH.Dialog);

  return BLRHH.Dialog;
}
