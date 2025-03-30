import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import LessonRecord from '@/lib/models/LessonRecord';
import Course from '@/lib/models/Course';
import mongoose from 'mongoose';
import moment from 'moment-timezone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: '请先登录' });
  }

  await dbConnect();

  // 获取课时记录列表
  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
      
      const query: any = {};
      
      // 搜索条件
      if (search) {
        query.$or = [
          { courseName: { $regex: search, $options: 'i' } },
          { grade: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ];
      }
      
      // 日期范围筛选
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = moment.tz(startDate as string, 'Asia/Shanghai').toDate();
        if (endDate) query.date.$lte = moment.tz(endDate as string, 'Asia/Shanghai').endOf('day').toDate();
      }
      
      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      
      // 获取总记录数
      const total = await LessonRecord.countDocuments(query);
      
      // 获取分页数据
      const records = await LessonRecord.find(query)
        .sort({ date: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
      
      return res.status(200).json({
        records,
        totalPages: Math.ceil(total / limitNumber),
        currentPage: pageNumber,
        total
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '获取课时记录失败' });
    }
  }

  // 创建新课时记录
  if (req.method === 'POST') {
    try {
      const { courseId, date, hours, notes, courseName, grade } = req.body;
      
      if (!courseId || !date || !hours) {
        return res.status(400).json({ message: '课程、日期和课时数量是必填项' });
      }
      
      // 验证课程ID
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({ message: '无效的课程ID' });
      }
      
      // 检查课程是否存在
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(400).json({ message: '课程不存在' });
      }
      
      // 使用moment-timezone处理日期，确保使用北京时间
      const beijingDate = moment.tz(date, 'Asia/Shanghai').toDate();
      
      const record = await LessonRecord.create({
        courseId,
        courseName: courseName || course.name,
        grade: grade || course.grade,
        date: beijingDate,
        hours: parseFloat(hours as any),
        notes: notes || ''
      });
      
      return res.status(201).json(record);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '创建课时记录失败' });
    }
  }

  // 其他请求方法不支持
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 