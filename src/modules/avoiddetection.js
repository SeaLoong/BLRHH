const NAME = '避免检测';
const config = {
  avoidDetection: true,
  interval: 5
};
export default async function (importModule, BLUL, GM) {
  function run () {
    if (!config.avoidDetection) return;
    BLUL.debug('AvoidDetection.run');
    window.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    setTimeout(run, config.interval * 60e3);
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
