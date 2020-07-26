const fs = require('fs');

const metaRequireRegExp = /\/\/\s+@require\s+(\S+)\s*/;
const srcRegExp = /src\/\S+\.js$/;

const cacheMap = new Map();

function bundleRequireMeta (path) {
  if (cacheMap.has(path)) {
    console.log('bundling ' + path + ', already cached.');
    return cacheMap.get(path);
  }
  console.log('bundling ' + path + ', not cache.');
  let data = fs.readFileSync(path).toString();
  const metaRegExp = /\/\/\s+==UserScript==\s+[\S\s]*?\s+\/\/\s+==\/UserScript==/g;
  if (metaRegExp.test(data)) {
    let metadata = data.slice(0, metaRegExp.lastIndex);
    const remainData = data.slice(metaRegExp.lastIndex);
    const insertData = [];
    let result;
    while ((result = metaRequireRegExp.exec(metadata))) {
      const metaRequire = result[0];
      if (result[1] === 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/dist/require.js') {
        metadata = metadata.replace(new RegExp(metaRequire, 'g'), '');
      }
      if (!(result = new URL(result[1]).pathname.match(srcRegExp))) continue;
      insertData.push(bundleRequireMeta('./' + result[0]));
      metadata = metadata.replace(new RegExp(metaRequire, 'g'), '');
    }
    const nl = '\n'.repeat(2);
    data = metadata + nl + insertData.join(nl) + nl + remainData;
  }
  cacheMap.set(path, data);
  return data;
}

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

fs.writeFileSync('./dist/dist.js', bundleRequireMeta('./src/installer.user.js'));
