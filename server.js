const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// 导出app供云函数使用
module.exports = app;

// ==================== 中间件配置 ====================

// 安全头部
app.use(helmet());

// CORS 跨域配置
const allowedOrigins = [
    'https://class-points-frontend.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
    origin: function(origin, callback) {
        // 允许没有 origin 的请求（比如移动应用或 Postman）
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(null, true); // 暂时允许所有来源，方便调试
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON 解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求频率限制（防止暴力攻击）
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 最多100个请求
    message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 登录接口特殊限制
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 15分钟内最多5次登录尝试
    message: '登录尝试次数过多，请15分钟后再试'
});

// ==================== 数据库连接 ====================

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB 连接成功'))
.catch(err => {
    console.error('❌ MongoDB 连接失败:', err);
    process.exit(1);
});

// ==================== 路由导入 ====================

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const groupRoutes = require('./routes/groups');
const ruleRoutes = require('./routes/rules');
const shopRoutes = require('./routes/shop');
const dataRoutes = require('./routes/data');

// ==================== 路由注册 ====================

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/data', dataRoutes);

// ==================== 健康检查 ====================

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==================== 404 处理 ====================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// ==================== 错误处理 ====================

app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || '服务器内部错误',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==================== 启动服务器 ====================

// 只在非云函数环境下启动服务器
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 服务器运行在端口 ${PORT}`);
        console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 前端地址: ${process.env.FRONTEND_URL || '未配置'}`);
    });
}

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    mongoose.connection.close();
    process.exit(0);
});
