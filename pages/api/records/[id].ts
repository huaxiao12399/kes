import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import LessonRecord from '@/lib/models/LessonRecord';
import mongoose from 'mongoose';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: '请先登录' });
  }

  await dbConnect();

  const { id } = req.query;
  
  // 验证ID格式
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ message: '无效的记录ID' });
  }

  // 获取特定记录
  if (req.method === 'GET') {
    try {
      const record = await LessonRecord.findById(id);
      
      if (!record) {
        return res.status(404).json({ message: '记录不存在' });
      }
      
      return res.status(200).json(record);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '获取记录失败' });
    }
  }

  // 删除记录
  if (req.method === 'DELETE') {
    try {
      const deletedRecord = await LessonRecord.findByIdAndDelete(id);
      
      if (!deletedRecord) {
        return res.status(404).json({ message: '记录不存在' });
      }
      
      return res.status(200).json({ message: '记录已成功删除' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '删除记录失败' });
    }
  }

  // 其他请求方法不支持
  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 