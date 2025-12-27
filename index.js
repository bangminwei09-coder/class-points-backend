// 腾讯云函数入口文件
const serverless = require('serverless-http');
const app = require('./server');

// 导出云函数处理器
module.exports.main_handler = serverless(app);
