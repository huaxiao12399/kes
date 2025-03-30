import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  // 确保只有管理员可以访问
  if (!session || session.user?.username !== 'admin') {
    return res.status(401).json({ message: '未授权访问' });
  }
  
  await dbConnect();
  
  // 获取所有用户
  if (req.method === 'GET') {
    try {
      const users = await User.find().select('username _id createdAt updatedAt');
      return res.status(200).json(users);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '获取用户列表失败' });
    }
  }
  
  // 创建新用户
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: '用户名和密码是必填项' });
      }
      
      // 检查用户是否已存在
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      
      // 创建新用户 (bcrypt加密在User模型的pre-save钩子中处理)
      const user = await User.create({ username, password });
      return res.status(201).json({ message: '用户创建成功', user: { id: user._id, username: user.username } });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '创建用户失败' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 