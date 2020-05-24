export function getGlobalScope () {
  /* eslint-disable no-undef, no-constant-condition */
  if (typeof Window !== 'undefined') return 'Window';
  if (typeof DedicatedWorkerGlobalScope !== 'undefined') return 'Worker';
  if (typeof SharedWorkerGlobalScope !== 'undefined') return 'SharedWorker';
  if (typeof ServiceWorkerGlobalScope !== 'undefined') return 'ServiceWorker';
  return null;
  /* eslint-enable no-undef, no-constant-condition */
}

export function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function codeToURL (code) {
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

export function getCookie (sKey) {
  return decodeURIComponent(document.cookie.replace(new RegExp('(?:(?:^|.*;)\\s*' + encodeURIComponent(sKey).replace(/[-.+*]/g, '\\$&') + '\\s*\\=\\s*([^;]*).*$)|^.*$'), '$1')) || null;
}

export function compareVersion (version1, version2) {
  const v1Arr = version1.split('.');
  const v2Arr = version2.split('.');
  const n = Math.min(v1Arr.length, v2Arr.length);
  for (let i = 0; i < n; i++) {
    const m = Math.min(v1Arr[i].length, v2Arr[i].length);
    for (let j = 0; j < m; j++) {
      const c1 = v1Arr[i].charCodeAt(j);
      const c2 = v2Arr[i].charCodeAt(j);
      if (c1 !== c2) return c1 - c2;
    }
    if (v1Arr[i].length !== v2Arr[i].length) return v1Arr[i].length - v2Arr[i].length;
  }
  return v1Arr.length - v2Arr.length;
}

export function isToday (ts) {
  const d = new Date();
  const offset = d.getTimezoneOffset() + 480;
  d.setMinutes(d.getMinutes() + offset);
  const t = new Date(ts);
  t.setMinutes(t.getMinutes() + offset);
  t.setHours(0, 0, 0, 0);
  return (d - t < 86400e3);
}

const callTomorrowMap = new Map();

export function callTomorrow (f) {
  if (callTomorrowMap.has(f)) return callTomorrowMap.get(f).promise;
  const t = new Date();
  const offset = t.getTimezoneOffset() + 480;
  t.setMinutes(t.getMinutes() + offset);
  t.setDate(t.getDate() + 1);
  t.setHours(0, 1, 0, 0);
  t.setMinutes(t.getMinutes() - offset);
  const obj = {};
  const promise = new Promise(resolve => {
    const timeout = setTimeout(() => {
      callTomorrowMap.delete(f);
      resolve(f.call());
    }, t - Date.now());
    obj.timeout = timeout;
    obj.resolve = resolve;
  });
  obj.promise = promise;
  callTomorrowMap.set(f, obj);
  return promise;
}

export function removeCallTomorrow (f) {
  if (!callTomorrowMap.has(f)) return;
  const { timeout, resolve } = callTomorrowMap.get(f);
  callTomorrowMap.delete(f);
  clearTimeout(timeout);
  resolve.call();
}

export async function callEachAndWait (funcArray, thisArg, ...args) {
  for (const f of funcArray) {
    await f.apply(thisArg, args);
  }
}

export async function callUntilTrue (f, interval = 50, thisArg, ...args) {
  while (true) {
    const r = await f.apply(thisArg, args);
    if (r) return r;
    await sleep(interval);
  }
}

const retryTimeMap = new Map();
const retryMap = new Map();

export function retry (f) {
  if (retryMap.has(f)) return retryMap.get(f).promise;
  const ms = retryTimeMap.get(f) ?? 5e3;
  const obj = {};
  const promise = new Promise(resolve => {
    const timeout = setTimeout(() => {
      retryMap.delete(f);
      resolve(f.call());
    }, ms);
    obj.timeout = timeout;
    obj.resolve = resolve;
  });
  obj.promise = promise;
  retryMap.set(f, obj);
  retryTimeMap.set(f, Math.min(ms * 2, 3600e3));
  return promise;
}

export function removeRetry (f) {
  if (!retryMap.has(f)) return;
  const { timeout, resolve } = retryMap.get(f);
  retryMap.delete(f);
  retryTimeMap.delete(f);
  clearTimeout(timeout);
  resolve.call();
}

export default {
  getGlobalScope,
  sleep,
  codeToURL,
  getCookie,
  compareVersion,
  isToday,
  callTomorrow,
  callEachAndWait,
  callUntilTrue,
  retry,
  removeRetry
};
