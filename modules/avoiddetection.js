const NAME = '避免检测';
const config = {
  avoidDetection: true,
  interval: 5
};
export default async function (importModule, BLUL, GM) {
  function mouseMove () {
    if (!config.avoidDetection) return;
    BLUL.debug('AvoidDetection.mouseMove');
    document.dispatchEvent(new MouseEvent('mousemove', {
      screenX: Math.floor(Math.random() * screen.availWidth),
      screenY: Math.floor(Math.random() * screen.availHeight),
      clientX: Math.floor(Math.random() * window.innerWidth),
      clientY: Math.floor(Math.random() * window.innerHeight),
      ctrlKey: Math.random() > 0.8,
      shiftKey: Math.random() > 0.8,
      altKey: Math.random() > 0.9,
      metaKey: false,
      button: 0,
      buttons: 0,
      relatedTarget: null,
      region: null,
      detail: 0,
      view: window,
      sourceCapabilities: window.InputDeviceCapabilities ? new window.InputDeviceCapabilities({ fireTouchEvents: false }) : null,
      bubbles: true,
      cancelable: true,
      composed: true
    }));
    setTimeout(mouseMove, config.interval * 60e3);
  }
  function run () {
    if (!config.avoidDetection) return;
    BLUL.debug('AvoidDetection.run');
    BLUL.removeAllListener('visibilitychange');
    mouseMove();
  }

  BLUL.oninit(() => {
    BLUL.Config.addItem('avoidDetection', NAME, config.avoidDetection, { tag: 'input', help: '定时触发网页鼠标事件，以避免挂机检测', attribute: { type: 'checkbox' } });
    BLUL.Config.addItem('avoidDetection.interval', '触发间隔', config.interval, { tag: 'input', attribute: { type: 'number', placeholder: '默认为5', min: 1, max: 20 } });

    BLUL.Config.onload(() => {
      config.avoidDetection = BLUL.Config.get('avoidDetection');
      config.interval = BLUL.Config.get('avoidDetection.interval');
    });
  });
  BLUL.onrun(run);

  BLUL.AvoidDetection = {
    run
  };

  BLUL.debug('Module Loaded: AvoidDetection', BLUL.AvoidDetection);
}
