onmessage = async (e) => {
  console.log('self', self);
  console.log('worker', e);
  postMessage(e.data);
  const ret = await import('http://localhost:8080/src/modules/util.js');
  console.log('worker ret', ret);
  console.log('WorkerGlobalScope:', ret.getGlobalScope());
};
