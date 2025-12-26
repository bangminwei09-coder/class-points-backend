const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证 JWT Token
exports.authenticate = async (req, res, next) => {
    try {
        // 从请求头获取 token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '未提供认证令牌'
            });
        }

        // 验证 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 查找用户
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: '用户不存在或已被禁用'
            });
        }

        // 将用户信息附加到请求对象
        req.user = user;
        req.userId = user._id;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: '无效的认证令牌'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: '认证令牌已过期'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '认证失败'
        });
    }
};

// 验证管理员权限
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '需要管理员权限'
        });
    }
    next();
};
