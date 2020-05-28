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

  class Dialog {
    constructor (content, title) {
      this.dialog = $(`<div class="${cssDialog}"></div>`);
      this.divPosition = $(`<div class="${cssDialogPosition}"></div>`);
      this.divWidth = $(`<div class="${cssDialogWidth}"></div>`);
      this.divStyle = $(`<div class="${cssDialogStyle}"></div>`);
      this.title = '提示';
      if (title) this.setTitle(title);
      this.contents = [];
      if (content) this.addContent(content);
      this.buttons = [];
    }

    setTitle (title) {
      if (!this.dialog) return;
      this.title = title ?? '提示';
      return this;
    }

    addContent (content) {
      if (!this.dialog) return;
      content = content ?? '';
      this.contents.push(content);
      return this;
    }

    removeContent (index) {
      if (!this.dialog) return;
      index = index ?? this.contents.length - 1;
      if (index >= 0) {
        this.contents.splice(index, 1);
      }
      return this;
    }

    addButton (text, onclick, style) {
      if (!this.dialog) return;
      let cssStyle;
      switch (style) {
        case 1:
          cssStyle = cssDialogButtonGhost;
          break;
        default:
          cssStyle = cssDialogButtonPrimary;
      }
      const button = $(`<button class="${cssDialogButton} ${cssStyle}">${text}</button>`);
      if (onclick instanceof Function) button.click(() => onclick.call(this));
      this.buttons.push(button);
      return this;
    }

    removeButton (index) {
      if (!this.dialog) return;
      index = index ?? this.buttons.length - 1;
      if (index >= 0) {
        this.buttons.splice(index, 1);
      }
      return this;
    }

    show () {
      if (!this.dialog) return;
      if (this.promise) return this.promise;

      this.dialog.append(this.divPosition);
      this.divPosition.append(this.divWidth);
      this.divWidth.append(this.divStyle);
      this.divStyle.append(this.divTitle);
      // 标题
      const divTitle = $(`<div class="${cssDialogTitle}"><h2 class="${cssDialogTitleText}">${this.title}</h2></div>`);
      this.divStyle.append(divTitle);
      // 内容
      const divContent = $(`<div class="${cssDialogContent}"></div>`);
      this.divStyle.append(divContent);
      for (const content of this.contents) {
        divContent.append(content);
      }
      // 按钮
      if (this.buttons.length > 0) {
        const divButtons = $('<div style="text-align: center;"></div>');
        this.divStyle.append(divButtons);
        for (const button of this.buttons) {
          divButtons.append(button);
        }
      }
      // 关闭按钮
      const divClose = $(`<div class="${cssDialogButtonClose}">❌</div>`);
      this.divStyle.append(divClose);
      divClose.click(() => this.close());

      $('body').append(this.dialog);

      this.promise = new Promise(resolve => (this.resolve = resolve));
      return this.promise;
    }

    close (...returnValues) {
      if (!this.dialog || !this.promise) return;
      this.dialog.remove();
      this.dialog = null;
      this.promise = null;
      return this.resolve.apply(this, returnValues);
    }
  }

  BLRHH.Dialog = Dialog;

  BLRHH.debug('Module Loaded: Dialog', BLRHH.Dialog);

  return BLRHH.Dialog;
}
