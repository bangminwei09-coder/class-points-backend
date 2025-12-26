const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const { authenticate } = require('../middleware/auth');

// 所有路由都需要认证
router.use(authenticate);

// ==================== 获取所有学生 ====================
router.get('/', async (req, res) => {
    try {
        const students = await Student.find({ userId: req.userId })
            .populate('groupId', 'name')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        console.error('获取学生列表错误:', error);
        res.status(500).json({
            success: false,
            message: '获取学生列表失败'
        });
    }
});

// ==================== 获取单个学生 ====================
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            userId: req.userId
        }).populate('groupId', 'name');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('获取学生信息错误:', error);
        res.status(500).json({
            success: false,
            message: '获取学生信息失败'
        });
    }
});

// ==================== 创建学生 ====================
router.post('/', [
    body('name').trim().notEmpty().withMessage('学生姓名不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { name, studentNo, groupId, avatar } = req.body;

        const student = new Student({
            userId: req.userId,
            name,
            studentNo,
            groupId,
            avatar,
            points: 0,
            badges: [],
            history: []
        });

        await student.save();

        res.status(201).json({
            success: true,
            message: '学生添加成功',
            data: student
        });
    } catch (error) {
        console.error('创建学生错误:', error);
        res.status(500).json({
            success: false,
            message: '添加学生失败'
        });
    }
});

// ==================== 批量创建学生 ====================
router.post('/batch', [
    body('students').isArray().withMessage('学生数据必须是数组'),
    body('students.*.name').trim().notEmpty().withMessage('学生姓名不能为空')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { students } = req.body;

        const studentsToCreate = students.map(s => ({
            userId: req.userId,
            name: s.name,
            studentNo: s.studentNo,
            groupId: s.groupId,
            avatar: s.avatar,
            points: s.points || 0,
            badges: s.badges || [],
            history: s.history || []
        }));

        const createdStudents = await Student.insertMany(studentsToCreate);

        res.status(201).json({
            success: true,
            message: `成功添加 ${createdStudents.length} 位学生`,
            data: createdStudents
        });
    } catch (error) {
        console.error('批量创建学生错误:', error);
        res.status(500).json({
            success: false,
            message: '批量添加学生失败'
        });
    }
});

// ==================== 更新学生信息 ====================
router.put('/:id', async (req, res) => {
    try {
        const { name, studentNo, groupId, avatar } = req.body;

        const student = await Student.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { name, studentNo, groupId, avatar },
            { new: true, runValidators: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        res.json({
            success: true,
            message: '学生信息更新成功',
            data: student
        });
    } catch (error) {
        console.error('更新学生信息错误:', error);
        res.status(500).json({
            success: false,
            message: '更新学生信息失败'
        });
    }
});

// ==================== 调整积分 ====================
router.post('/:id/points', [
    body('points').isInt().withMessage('积分必须是整数'),
    body('reason').trim().notEmpty().withMessage('原因不能为空'),
    body('type').isIn(['add', 'reduce', 'exchange']).withMessage('类型无效')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { points, reason, type } = req.body;

        const student = await Student.findOne({
            _id: req.params.id,
            userId: req.userId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 更新积分
        if (type === 'add') {
            student.points += points;
        } else if (type === 'reduce' || type === 'exchange') {
            student.points = Math.max(0, student.points - points);
        }

        // 添加历史记录
        student.history.unshift({
            type,
            points,
            reason,
            timestamp: new Date()
        });

        await student.save();

        res.json({
            success: true,
            message: '积分调整成功',
            data: student
        });
    } catch (error) {
        console.error('调整积分错误:', error);
        res.status(500).json({
            success: false,
            message: '调整积分失败'
        });
    }
});

// ==================== 批量调整积分 ====================
router.post('/batch/points', [
    body('studentIds').isArray().withMessage('学生ID必须是数组'),
    body('points').isInt().withMessage('积分必须是整数'),
    body('reason').trim().notEmpty().withMessage('原因不能为空'),
    body('type').isIn(['add', 'reduce']).withMessage('类型无效')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { studentIds, points, reason, type } = req.body;

        const students = await Student.find({
            _id: { $in: studentIds },
            userId: req.userId
        });

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: '未找到学生'
            });
        }

        // 批量更新
        const updatePromises = students.map(async (student) => {
            if (type === 'add') {
                student.points += points;
            } else if (type === 'reduce') {
                student.points = Math.max(0, student.points - points);
            }

            student.history.unshift({
                type,
                points,
                reason,
                timestamp: new Date()
            });

            return student.save();
        });

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: `成功为 ${students.length} 位学生调整积分`,
            data: students
        });
    } catch (error) {
        console.error('批量调整积分错误:', error);
        res.status(500).json({
            success: false,
            message: '批量调整积分失败'
        });
    }
});

// ==================== 删除学生 ====================
router.delete('/:id', async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        res.json({
            success: true,
            message: '学生删除成功'
        });
    } catch (error) {
        console.error('删除学生错误:', error);
        res.status(500).json({
            success: false,
            message: '删除学生失败'
        });
    }
});

// ==================== 批量删除学生 ====================
router.post('/batch/delete', [
    body('studentIds').isArray().withMessage('学生ID必须是数组')
], async (req, res) => {
    try {
        const { studentIds } = req.body;

        const result = await Student.deleteMany({
            _id: { $in: studentIds },
            userId: req.userId
        });

        res.json({
            success: true,
            message: `成功删除 ${result.deletedCount} 位学生`
        });
    } catch (error) {
        console.error('批量删除学生错误:', error);
        res.status(500).json({
            success: false,
            message: '批量删除学生失败'
        });
    }
});

module.exports = router;
