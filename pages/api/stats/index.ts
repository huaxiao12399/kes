import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '@/lib/db';
import LessonRecord from '@/lib/models/LessonRecord';
import moment from 'moment-timezone';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: '请先登录' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  await dbConnect();

  try {
    const { month = moment().tz('Asia/Shanghai').format('YYYY-MM') } = req.query;

    // 解析月份参数 (格式: YYYY-MM)
    const [yearStr, monthStr] = (month as string).split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);

    // 使用moment-timezone构建日期范围，确保为北京时间
    const startDate = moment.tz(`${yearStr}-${monthStr}-01`, 'Asia/Shanghai').startOf('day').toDate();
    const endDate = moment.tz(`${yearStr}-${monthStr}-01`, 'Asia/Shanghai').endOf('month').toDate();
    
    // 获取所有时间的课时记录
    const allRecords = await LessonRecord.find({});
    
    // 获取月度课时记录
    const monthlyRecords = await LessonRecord.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    // 计算总课时
    const totalHours = monthlyRecords.reduce((sum, record) => sum + record.hours, 0);
    const allTimeHours = allRecords.reduce((sum, record) => sum + record.hours, 0);

    // 按课程统计月度数据
    const courseStatsMap = new Map();
    monthlyRecords.forEach(record => {
      const key = `${record.courseId}-${record.courseName}`;
      if (!courseStatsMap.has(key)) {
        courseStatsMap.set(key, {
          _id: record.courseId,
          courseName: record.courseName,
          totalHours: 0,
          count: 0,
        });
      }
      const stats = courseStatsMap.get(key);
      stats.totalHours += record.hours;
      stats.count += 1;
    });

    // 按年级统计月度数据
    const gradeStatsMap = new Map();
    monthlyRecords.forEach(record => {
      const grade = record.grade;
      if (!gradeStatsMap.has(grade)) {
        gradeStatsMap.set(grade, {
          grade,
          totalHours: 0,
          count: 0,
        });
      }
      const stats = gradeStatsMap.get(grade);
      stats.totalHours += record.hours;
      stats.count += 1;
    });

    // 按课程统计全部数据
    const allTimeCourseStatsMap = new Map();
    allRecords.forEach(record => {
      const key = `${record.courseId}-${record.courseName}`;
      if (!allTimeCourseStatsMap.has(key)) {
        allTimeCourseStatsMap.set(key, {
          _id: record.courseId,
          courseName: record.courseName,
          totalHours: 0,
          count: 0,
        });
      }
      const stats = allTimeCourseStatsMap.get(key);
      stats.totalHours += record.hours;
      stats.count += 1;
    });

    // 按年级统计全部数据
    const allTimeGradeStatsMap = new Map();
    allRecords.forEach(record => {
      const grade = record.grade;
      if (!allTimeGradeStatsMap.has(grade)) {
        allTimeGradeStatsMap.set(grade, {
          grade,
          totalHours: 0,
          count: 0,
        });
      }
      const stats = allTimeGradeStatsMap.get(grade);
      stats.totalHours += record.hours;
      stats.count += 1;
    });

    const courseStats = Array.from(courseStatsMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);
    
    const gradeStats = Array.from(gradeStatsMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);
    
    const allTimeCourseStats = Array.from(allTimeCourseStatsMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);
    
    const allTimeGradeStats = Array.from(allTimeGradeStatsMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);

    return res.status(200).json({
      totalHours,
      allTimeHours,
      courseStats,
      gradeStats,
      allTimeCourseStats,
      allTimeGradeStats
    });
  } catch (error: any) {
    console.error('统计数据生成失败:', error);
    return res.status(500).json({ message: error.message || '统计数据生成失败' });
  }
} 