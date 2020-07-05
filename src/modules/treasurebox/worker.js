const NAME = 'TreasureBox-Worker';
export default async function (importModule, BLUL, GM) {
  await importModule('tfjs');
  /* globals tf */

  let model;

  function RGBA2Gray (imageData) {
    const { width, height, data } = imageData;
    const n = width * height;
    const grayScaleData = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) {
      const r = data[4 * i];
      const g = data[4 * i + 1];
      const b = data[4 * i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      grayScaleData[i] = gray;
    }
    return { width, height, data: grayScaleData };
  }

  function binarization (grayScaleImageData, threshold = 200) {
    const { width, height, data } = grayScaleImageData;
    const n = data.length;
    const binarizationData = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) {
      binarizationData[i] = data[i] > threshold ? 255 : 0;
    }
    return { width, height, data: binarizationData };
  }

  function filter (binarizationImageData) {
    const { width, height, data } = binarizationImageData;
    const n = data.length;
    const filteredData = new Uint8ClampedArray(n);
    const maxFilter3x3 = (i) => {
      let m = data[i];
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          const j = i + x + y * width;
          if (j < 0 || j >= n) continue;
          m = Math.max(m, data[j]);
        }
      }
      return m;
    };
    for (let i = 0; i < n; i++) {
      filteredData[i] = maxFilter3x3(i);
    }
    return { width, height, data: filteredData };
  }

  function normalization (array) {
    let n = array.length;
    const arr = new Float32Array(n);
    while (n--) {
      arr[n] = array[n] / 255.0;
    }
    return arr;
  }

  const TEXT_LENGTH = 4;
  const CHAR_SET_LEN = 12;

  function array2Str (arr) {
    while (arr.length === 1) arr = arr[0];
    let str = '';
    const n = TEXT_LENGTH * CHAR_SET_LEN;
    for (let i = 0; i < n; i += CHAR_SET_LEN) {
      let m = arr[i];
      let mk = 0;
      for (let k = 0; k < CHAR_SET_LEN; k++) {
        if (arr[i + k] > m) {
          m = arr[i + k];
          mk = k;
        }
      }
      if (mk < 10) str += String.fromCharCode(mk + 48);
      else if (mk === 10) str += '+';
      else if (mk === 11) str += '-';
    }
    return str;
  }

  let modelUrl;

  async function loadModel (url) {
    if (modelUrl === url) return;
    console.info(`[${NAME}] loading model`, url);
    model = await tf.loadLayersModel(url);
    tf.tidy(() => {
      model.predict(tf.zeros([1, 40, 120, 1]));
    });
    console.info(`[${NAME}] model loaded.`);
    modelUrl = url;
  }

  function predict (imageData) {
    const arr = normalization(filter(binarization(RGBA2Gray(imageData))).data);
    return tf.tidy(() => {
      return array2Str(model.predict(tf.tensor(arr, [1, 40, 120, 1])).arraySync());
    });
  }

  console.info(`[${NAME}] ready.`);

  return {
    NAME,
    loadModel,
    predict
  };
}
