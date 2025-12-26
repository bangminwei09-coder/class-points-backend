# 班级积分管理系统 - 后端 API

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
PORT=3000
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=随机生成的密钥
FRONTEND_URL=https://your-frontend.vercel.app
```

### 3. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

---

## 📦 部署到 Railway（免费）

### 步骤：

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择你的仓库

3. **配置环境变量**
   - 在 Railway 项目设置中添加环境变量：
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `FRONTEND_URL`
     - `NODE_ENV=production`

4. **部署**
   - Railway 会自动检测 Node.js 项目并部署
   - 获取部署地址：`https://your-app.railway.app`

---

## 🗄️ MongoDB Atlas 配置（免费 512MB）

### 步骤：

1. **注册 MongoDB Atlas**
   - 访问 https://www.mongodb.com/cloud/atlas
   - 创建免费账号

2. **创建集群**
   - 选择 "Shared" (免费)
   - 选择离你最近的区域（如 AWS Singapore）
   - 点击 "Create Cluster"

3. **配置数据库访问**
   - Database Access → Add New Database User
   - 创建用户名和密码（记住！）
   - 权限选择 "Read and write to any database"

4. **配置网络访问**
   - Network Access → Add IP Address
   - 选择 "Allow Access from Anywhere" (0.0.0.0/0)
   - 或添加 Railway 的 IP 地址

5. **获取连接字符串**
   - Clusters → Connect → Connect your application
   - 复制连接字符串
   - 替换 `<password>` 为你的密码
   - 示例：`mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/class-points?retryWrites=true&w=majority`

---

## 📡 API 接口文档

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "teacher1",
  "password": "123456",
  "className": "三年级1班",
  "email": "teacher@example.com"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher1",
  "password": "123456"
}
```

响应：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "username": "teacher1",
      "className": "三年级1班",
      "role": "teacher"
    }
  }
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### 学生接口

#### 获取所有学生
```http
GET /api/students
Authorization: Bearer <token>
```

#### 创建学生
```http
POST /api/students
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "张三",
  "studentNo": "001",
  "groupId": "507f1f77bcf86cd799439011",
  "avatar": "data:image/png;base64,..."
}
```

#### 调整积分
```http
POST /api/students/:id/points
Authorization: Bearer <token>
Content-Type: application/json

{
  "points": 5,
  "reason": "课堂表现优秀",
  "type": "add"
}
```

#### 批量调整积分
```http
POST /api/students/batch/points
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentIds": ["id1", "id2", "id3"],
  "points": 3,
  "reason": "小组合作",
  "type": "add"
}
```

---

### 小组接口

#### 获取所有小组
```http
GET /api/groups
Authorization: Bearer <token>
```

#### 创建小组
```http
POST /api/groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "第一小组",
  "description": "学习小组"
}
```

---

### 规则接口

#### 获取所有规则
```http
GET /api/rules
Authorization: Bearer <token>
```

#### 创建规则
```http
POST /api/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "课堂发言",
  "points": 5,
  "description": "积极回答问题"
}
```

---

### 商城接口

#### 获取所有商品
```http
GET /api/shop
Authorization: Bearer <token>
```

#### 创建商品
```http
POST /api/shop
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "铅笔",
  "description": "2B铅笔",
  "pointsCost": 10,
  "stock": 50,
  "imageUrl": "https://..."
}
```

---

### 数据接口

#### 导出所有数据
```http
GET /api/data/export
Authorization: Bearer <token>
```

#### 导入数据
```http
POST /api/data/import
Authorization: Bearer <token>
Content-Type: application/json

{
  "students": [...],
  "groups": [...],
  "rules": [...],
  "shopItems": [...],
  "replaceExisting": false
}
```

#### 获取统计数据
```http
GET /api/data/statistics
Authorization: Bearer <token>
```

---

## 🔒 安全特性

- ✅ JWT 认证
- ✅ 密码 bcrypt 加密
- ✅ 请求频率限制
- ✅ CORS 跨域保护
- ✅ Helmet 安全头部
- ✅ 数据验证
- ✅ 用户数据隔离

---

## 📊 数据库结构

### Users 集合
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (加密),
  className: String,
  email: String,
  role: String,
  isActive: Boolean,
  createdAt: Date
}
```

### Students 集合
```javascript
{
  _id: ObjectId,
  userId: ObjectId (关联 User),
  name: String,
  studentNo: String,
  points: Number,
  groupId: ObjectId,
  avatar: String,
  history: [{
    type: String,
    points: Number,
    reason: String,
    timestamp: Date
  }],
  createdAt: Date
}
```

---

## 🐛 常见问题

### Q: MongoDB 连接失败？
A: 检查：
1. 连接字符串是否正确
2. 密码是否包含特殊字符（需要 URL 编码）
3. IP 白名单是否配置
4. 网络是否正常

### Q: JWT 认证失败？
A: 检查：
1. Token 是否在请求头中
2. Token 格式：`Authorization: Bearer <token>`
3. Token 是否过期
4. JWT_SECRET 是否一致

### Q: 部署后无法访问？
A: 检查：
1. 环境变量是否配置
2. 端口是否正确
3. CORS 配置是否包含前端地址

---

## 📞 技术支持

如有问题，请提交 Issue 或联系开发者。

---

**最后更新：** 2025-12-26
