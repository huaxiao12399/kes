import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import Course from '@/lib/models/Course';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: '请先登录' });
  }

  await dbConnect();

  // 获取所有课程
  if (req.method === 'GET') {
    try {
      const courses = await Course.find({}).sort({ name: 1 });
      return res.status(200).json(courses);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '获取课程失败' });
    }
  }

  // 创建新课程
  if (req.method === 'POST') {
    try {
      const { name, grade } = req.body;

      if (!name || !grade) {
        return res.status(400).json({ message: '课程名称和年级是必填项' });
      }

      // 检查是否已存在同名课程
      const existingCourse = await Course.findOne({ name, grade });
      if (existingCourse) {
        return res.status(400).json({ message: '该课程已存在' });
      }

      const course = await Course.create({ name, grade });
      return res.status(201).json(course);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '创建课程失败' });
    }
  }

  // 其他请求方法不支持
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 