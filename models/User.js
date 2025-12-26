const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, '用户名不能为空'],
        unique: true,
        trim: true,
        minlength: [3, '用户名至少3个字符'],
        maxlength: [30, '用户名最多30个字符']
    },
    password: {
        type: String,
        required: [true, '密码不能为空'],
        minlength: [6, '密码至少6个字符']
    },
    className: {
        type: String,
        required: [true, '班级名称不能为空'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true // 允许多个 null 值
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['teacher', 'admin'],
        default: 'teacher'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// 保存前加密密码
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 转换为 JSON 时移除敏感信息
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
