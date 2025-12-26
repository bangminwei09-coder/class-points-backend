const express = require('express');
const router = express.Router();
const ShopItem = require('../models/ShopItem');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取所有商品
router.get('/', async (req, res) => {
    try {
        const items = await ShopItem.find({ userId: req.userId, isActive: true }).sort({ pointsCost: 1 });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取商品列表失败' });
    }
});

// 创建商品
router.post('/', async (req, res) => {
    try {
        const { name, description, pointsCost, stock, imageUrl } = req.body;
        const item = new ShopItem({ userId: req.userId, name, description, pointsCost, stock, imageUrl });
        await item.save();
        res.status(201).json({ success: true, message: '商品创建成功', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: '创建商品失败' });
    }
});

// 更新商品
router.put('/:id', async (req, res) => {
    try {
        const { name, description, pointsCost, stock, imageUrl } = req.body;
        const item = await ShopItem.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, description, pointsCost, stock, imageUrl },
            { new: true }
        );
        if (!item) return res.status(404).json({ success: false, message: '商品不存在' });
        res.json({ success: true, message: '商品更新成功', data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新商品失败' });
    }
});

// 删除商品
router.delete('/:id', async (req, res) => {
    try {
        const item = await ShopItem.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!item) return res.status(404).json({ success: false, message: '商品不存在' });
        res.json({ success: true, message: '商品删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除商品失败' });
    }
});

module.exports = router;
