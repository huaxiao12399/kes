/**
 * 创建初始管理员用户
 * 使用方法: node scripts/create-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('请在.env.local文件中设置MONGODB_URI');
  process.exit(1);
}

// 创建用户模型
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// 密码加密
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('已连接到MongoDB');

    // 检查是否已存在管理员
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (adminExists) {
      console.log('管理员用户已存在');
      process.exit(0);
    }

    // 创建管理员用户
    const admin = new User({
      username: 'admin',
      password: 'admin123', // 这个密码会被加密存储
    });

    await admin.save();
    console.log('管理员用户创建成功');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('请在登录后尽快更改默认密码');

  } catch (error) {
    console.error('创建管理员失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('已断开与MongoDB的连接');
  }
}

createAdmin(); 