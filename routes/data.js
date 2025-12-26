const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Group = require('../models/Group');
const Rule = require('../models/Rule');
const ShopItem = require('../models/ShopItem');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// ==================== 导出所有数据 ====================
router.get('/export', async (req, res) => {
    try {
        const [students, groups, rules, shopItems] = await Promise.all([
            Student.find({ userId: req.userId }),
            Group.find({ userId: req.userId }),
            Rule.find({ userId: req.userId }),
            ShopItem.find({ userId: req.userId })
        ]);

        res.json({
            success: true,
            data: {
                students,
                groups,
                rules,
                shopItems,
                exportDate: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('导出数据错误:', error);
        res.status(500).json({ success: false, message: '导出数据失败' });
    }
});

// ==================== 导入所有数据 ====================
router.post('/import', async (req, res) => {
    try {
        const { students, groups, rules, shopItems, replaceExisting } = req.body;

        // 如果选择替换现有数据，先删除
        if (replaceExisting) {
            await Promise.all([
                Student.deleteMany({ userId: req.userId }),
                Group.deleteMany({ userId: req.userId }),
                Rule.deleteMany({ userId: req.userId }),
                ShopItem.deleteMany({ userId: req.userId })
            ]);
        }

        // 导入新数据
        const importPromises = [];

        if (students && students.length > 0) {
            const studentsToImport = students.map(s => ({ ...s, userId: req.userId, _id: undefined }));
            importPromises.push(Student.insertMany(studentsToImport));
        }

        if (groups && groups.length > 0) {
            const groupsToImport = groups.map(g => ({ ...g, userId: req.userId, _id: undefined }));
            importPromises.push(Group.insertMany(groupsToImport));
        }

        if (rules && rules.length > 0) {
            const rulesToImport = rules.map(r => ({ ...r, userId: req.userId, _id: undefined }));
            importPromises.push(Rule.insertMany(rulesToImport));
        }

        if (shopItems && shopItems.length > 0) {
            const itemsToImport = shopItems.map(i => ({ ...i, userId: req.userId, _id: undefined }));
            importPromises.push(ShopItem.insertMany(itemsToImport));
        }

        await Promise.all(importPromises);

        res.json({
            success: true,
            message: '数据导入成功'
        });
    } catch (error) {
        console.error('导入数据错误:', error);
        res.status(500).json({ success: false, message: '导入数据失败' });
    }
});

// ==================== 获取统计数据 ====================
router.get('/statistics', async (req, res) => {
    try {
        const [studentCount, groupCount, ruleCount, shopItemCount] = await Promise.all([
            Student.countDocuments({ userId: req.userId }),
            Group.countDocuments({ userId: req.userId }),
            Rule.countDocuments({ userId: req.userId }),
            ShopItem.countDocuments({ userId: req.userId })
        ]);

        const students = await Student.find({ userId: req.userId });
        const totalPoints = students.reduce((sum, s) => sum + s.points, 0);
        const avgPoints = studentCount > 0 ? (totalPoints / studentCount).toFixed(2) : 0;

        res.json({
            success: true,
            data: {
                studentCount,
                groupCount,
                ruleCount,
                shopItemCount,
                totalPoints,
                avgPoints
            }
        });
    } catch (error) {
        console.error('获取统计数据错误:', error);
        res.status(500).json({ success: false, message: '获取统计数据失败' });
    }
});

module.exports = router;
