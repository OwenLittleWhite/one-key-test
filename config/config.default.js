/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};
  config.cors = {
    origin: '*',
  };


  config.security = {
    xframe: {
      enable: false,
    },
    csrf: {
      enable: false,
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1692262433599_6282';

  // add your middleware config here
  config.middleware = [];
  config.static = {
    prefix: '/public/',
    dir: [ path.join(appInfo.baseDir, 'public'), path.join(appInfo.baseDir, 'publicData') ], // 多静态文件入口
  };
  config.sequelize = {
    username: 'root',
    password: '123456',
    database: 'one_key_test',
    host: '127.0.0.1',
    dialect: 'mysql',
  };
  config.redis = {
    client: {
      host: '127.0.0.1',
      port: 6379,
      password: null,
      db: 6,
    },
  };
  config.cluster = {
    listen: {
      path: '',
      port: 8000,
      hostname: '0.0.0.0',
    },
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
