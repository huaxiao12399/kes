import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import Course from '@/lib/models/Course';
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
    return res.status(400).json({ message: '无效的课程ID' });
  }

  // 获取特定课程
  if (req.method === 'GET') {
    try {
      const course = await Course.findById(id);
      
      if (!course) {
        return res.status(404).json({ message: '课程不存在' });
      }
      
      return res.status(200).json(course);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '获取课程失败' });
    }
  }

  // 更新课程
  if (req.method === 'PUT') {
    try {
      const { name, grade } = req.body;
      
      if (!name || !grade) {
        return res.status(400).json({ message: '课程名称和年级是必填项' });
      }
      
      // 检查是否已存在其他同名课程
      const existingCourse = await Course.findOne({
        name,
        grade,
        _id: { $ne: id }
      });
      
      if (existingCourse) {
        return res.status(400).json({ message: '该课程名已存在' });
      }
      
      const updatedCourse = await Course.findByIdAndUpdate(
        id,
        { name, grade },
        { new: true, runValidators: true }
      );
      
      if (!updatedCourse) {
        return res.status(404).json({ message: '课程不存在' });
      }
      
      // 同时更新所有相关的课时记录中的课程名和年级
      await LessonRecord.updateMany(
        { courseId: id },
        { courseName: name, grade: grade }
      );
      
      return res.status(200).json(updatedCourse);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '更新课程失败' });
    }
  }

  // 删除课程
  if (req.method === 'DELETE') {
    try {
      // 检查是否有关联的课时记录
      const recordCount = await LessonRecord.countDocuments({ courseId: id });
      
      if (recordCount > 0) {
        return res.status(400).json({ 
          message: `该课程下有${recordCount}条课时记录，无法删除。请先删除相关课时记录。` 
        });
      }
      
      const deletedCourse = await Course.findByIdAndDelete(id);
      
      if (!deletedCourse) {
        return res.status(404).json({ message: '课程不存在' });
      }
      
      return res.status(200).json({ message: '课程已成功删除' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || '删除课程失败' });
    }
  }

  // 其他请求方法不支持
  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ message: `方法 ${req.method} 不被允许` });
} 