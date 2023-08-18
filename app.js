const path = require('path');
const fs = require('fs');
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  // 使用 app 对象
  app.beforeStart(async () => {
    if (!fs.existsSync(path.join(app.config.baseDir, '/public/original'))) {
      fs.mkdirSync(path.join(app.config.baseDir, '/public/original'));
    }
    if (!fs.existsSync(path.join(app.config.baseDir, '/public/thumbnail'))) {
      fs.mkdirSync(path.join(app.config.baseDir, '/public/thumbnail'));
    }
  });
};
