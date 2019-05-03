const upload = require('qcloud-cos-upload');
 
upload({
  log: false,
  overwrite: true,
  cdn: true,
  AppId: '1258131272',
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
  Bucket: 'js-1258131272',
  Region: 'ap-beijing',
  FilePath: './BilibiliAPI.js',
  Key: 'BilibiliAPI.js'
}).then(rs => {
    console.info(rs.uploadData);
});