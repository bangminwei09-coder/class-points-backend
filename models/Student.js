const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['add', 'reduce', 'exchange'],
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { _id: true });

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, '学生姓名不能为空'],
        trim: true
    },
    studentNo: {
        type: String,
        trim: true
    },
    points: {
        type: Number,
        default: 0,
        min: 0
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    avatar: {
        type: String // Base64 或 URL
    },
    badges: [{
        name: String,
        icon: String
    }],
    history: [historySchema],
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

// 复合索引：用户ID + 学生姓名（确保同一用户下学生姓名唯一）
studentSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Student', studentSchema);
