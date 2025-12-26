const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, '商品名称不能为空'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    pointsCost: {
        type: Number,
        required: [true, '积分价格不能为空'],
        min: [1, '积分价格至少为1']
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imageUrl: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
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

shopItemSchema.index({ userId: 1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);
