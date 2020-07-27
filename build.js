const fs = require('fs');

const metaRequireRegExp = /\/\/\s+@require\s+(\S+)\s*/g;
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
    const replaceList = [];
    let result;
    while ((result = metaRequireRegExp.exec(metadata))) {
      const metaRequire = result[0];
      if (result[1].includes('greasyfork')) continue;
      if (result[1] === 'https://cdn.jsdelivr.net/gh/SeaLoong/BLUL/dist/require.js') {
        replaceList.push([result[1], 'https://greasyfork.org/scripts/407791-blul/code/BLUL.js']);
        continue;
      }
      if (!(result = new URL(result[1]).pathname.match(srcRegExp))) continue;
      insertData.push(bundleRequireMeta('./' + result[0]));
      replaceList.push([metaRequire, '']);
    }
    for (const r of replaceList) {
      metadata = metadata.replace(new RegExp(r[0], 'g'), r[1] || '');
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

fs.writeFileSync('./dist/installer.greasyfork.user.js', bundleRequireMeta('./src/installer.user.js'));
