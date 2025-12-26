const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// 获取所有小组
router.get('/', async (req, res) => {
    try {
        const groups = await Group.find({ userId: req.userId }).sort({ name: 1 });
        res.json({ success: true, data: groups });
    } catch (error) {
        res.status(500).json({ success: false, message: '获取小组列表失败' });
    }
});

// 创建小组
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = new Group({ userId: req.userId, name, description });
        await group.save();
        res.status(201).json({ success: true, message: '小组创建成功', data: group });
    } catch (error) {
        res.status(500).json({ success: false, message: '创建小组失败' });
    }
});

// 更新小组
router.put('/:id', async (req, res) => {
    try {
        const { name, description } = req.body;
        const group = await Group.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, description },
            { new: true }
        );
        if (!group) return res.status(404).json({ success: false, message: '小组不存在' });
        res.json({ success: true, message: '小组更新成功', data: group });
    } catch (error) {
        res.status(500).json({ success: false, message: '更新小组失败' });
    }
});

// 删除小组
router.delete('/:id', async (req, res) => {
    try {
        // 将该小组的学生设为未分组
        await Student.updateMany(
            { groupId: req.params.id, userId: req.userId },
            { $unset: { groupId: 1 } }
        );
        
        const group = await Group.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!group) return res.status(404).json({ success: false, message: '小组不存在' });
        res.json({ success: true, message: '小组删除成功' });
    } catch (error) {
        res.status(500).json({ success: false, message: '删除小组失败' });
    }
});

module.exports = router;
