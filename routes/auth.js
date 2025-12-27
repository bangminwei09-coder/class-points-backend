const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// 生成 JWT Token
const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    return jwt.sign(
        { userId },
        secret,
        { expiresIn }
    );
};

// ==================== 注册 ====================
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('用户名长度为3-30个字符'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符'),
    body('className').trim().notEmpty().withMessage('班级名称不能为空')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { username, password, className, email, phone } = req.body;

        // 检查用户名是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 创建新用户
        const user = new User({
            username,
            password,
            className,
            email,
            phone
        });

        await user.save();

        // 生成 token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    className: user.className,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '注册失败，请稍后重试'
        });
    }
});

// ==================== 登录 ====================
router.post('/login', [
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空')
], async (req, res) => {
    try {
        // 验证输入
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 验证密码
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 检查账号状态
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: '账号已被禁用，请联系管理员'
            });
        }

        // 更新最后登录时间
        user.lastLogin = new Date();
        await user.save();

        // 生成 token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    className: user.className,
                    role: user.role,
                    email: user.email
                }
            }
        });
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '登录失败，请稍后重试'
        });
    }
});

// ==================== 获取当前用户信息 ====================
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    className: req.user.className,
                    role: req.user.role,
                    email: req.user.email,
                    phone: req.user.phone,
                    createdAt: req.user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取用户信息失败'
        });
    }
});

// ==================== 修改密码 ====================
router.put('/change-password', authenticate, [
    body('oldPassword').notEmpty().withMessage('旧密码不能为空'),
    body('newPassword').isLength({ min: 6 }).withMessage('新密码至少6个字符')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { oldPassword, newPassword } = req.body;

        // 验证旧密码
        const isPasswordValid = await req.user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '旧密码错误'
            });
        }

        // 更新密码
        req.user.password = newPassword;
        await req.user.save();

        res.json({
            success: true,
            message: '密码修改成功'
        });
    } catch (error) {
        console.error('修改密码错误:', error);
        res.status(500).json({
            success: false,
            message: '修改密码失败'
        });
    }
});

// ==================== 更新用户信息 ====================
router.put('/profile', authenticate, [
    body('className').optional().trim().notEmpty().withMessage('班级名称不能为空'),
    body('email').optional().isEmail().withMessage('邮箱格式不正确')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { className, email, phone } = req.body;

        if (className) req.user.className = className;
        if (email) req.user.email = email;
        if (phone !== undefined) req.user.phone = phone;

        await req.user.save();

        res.json({
            success: true,
            message: '信息更新成功',
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    className: req.user.className,
                    email: req.user.email,
                    phone: req.user.phone
                }
            }
        });
    } catch (error) {
        console.error('更新用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '更新信息失败'
        });
    }
});

module.exports = router;
