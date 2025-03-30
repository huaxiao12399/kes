import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  // 确保只有管理员可以访问
  if (!session || session.user?.username !== 'admin') {
    return res.status(401).json({ message: '未授权访问' });
  }

  const { id } = req.query;
  
  if (!id || !mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: '无效的用户ID' });
  }
  
  await dbConnect();
  
  // 删除用户
  if (req.method === 'DELETE') {
    try {
      // 阻止删除自己（管理员账户）
      const userToDelete = await User.findById(id);
      
      if (!userToDelete) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      if (userToDelete.username === 'admin') {
        return res.status(400).json({ message: '不能删除管理员账户' });
      }
      
      await User.findByIdAndDelete(id);
      return res.status(200).json({ message: '用户删除成功' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '删除用户失败' });
    }
  }
  
  // 更新用户
  if (req.method === 'PUT') {
    try {
      const { username, password } = req.body;
      
      const userToUpdate = await User.findById(id);
      
      if (!userToUpdate) {
        return res.status(404).json({ message: '用户不存在' });
      }
      
      // 如果修改的是用户名，检查新用户名是否已存在
      if (username && username !== userToUpdate.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ message: '用户名已存在' });
        }
      }
      
      // 准备更新数据
      const updateData: any = {};
      
      if (username) updateData.username = username;
      
      // 如果提供了新密码，进行加密
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }
      
      // 更新用户
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('username _id');
      
      return res.status(200).json({
        message: '用户更新成功',
        user: updatedUser
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '更新用户失败' });
    }
  }
  
  res.setHeader('Allow', ['DELETE', 'PUT']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 