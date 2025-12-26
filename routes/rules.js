const express = require('express');
const router = express.Router();
const Rule = require('../models/Rule');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取所有规则
router.get('/', async (req, res) => {
    try {
        const rules = await Rule.find({ userId: req.userId }).sort({ points: -1 });
        res.json({ success: true, data: rules });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取规则列表失败' });
    }
});

// 创建规则
router.post('/', async (req, res) => {
    try {
        const { name, points, description } = req.body;
        const rule = new Rule({ userId: req.userId, name, points, description });
        await rule.save();
        res.status(201).json({ success: true, message: '规则创建成功', data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: '创建规则失败' });
    }
});

// 更新规则
router.put('/:id', async (req, res) => {
    try {
        const { name, points, description } = req.body;
        const rule = await Rule.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, points, description },
            { new: true }
        );
        if (!rule) return res.status(404).json({ success: false, message: '规则不存在' });
        res.json({ success: true, message: '规则更新成功', data: rule });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新规则失败' });
    }
});

// 删除规则
router.delete('/:id', async (req, res) => {
    try {
        const rule = await Rule.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!rule) return res.status(404).json({ success: false, message: '规则不存在' });
        res.json({ success: true, message: '规则删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除规则失败' });
    }
});

module.exports = router;
