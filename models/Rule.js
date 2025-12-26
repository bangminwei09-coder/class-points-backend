const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, '规则名称不能为空'],
        trim: true
    },
    points: {
        type: Number,
        required: [true, '分值不能为空']
    },
    description: {
        type: String,
        trim: true
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

ruleSchema.index({ userId: 1 });

module.exports = mongoose.model('Rule', ruleSchema);
