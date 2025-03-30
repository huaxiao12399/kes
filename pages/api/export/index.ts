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
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: '请提供起始和结束日期' });
    }

    // 将起始日期设置为当天的开始时间（北京时间 00:00:00）
    const start = moment.tz(startDate as string, 'YYYY-MM-DD', 'Asia/Shanghai').startOf('day').toDate();
    // 将结束日期设置为当天的结束时间（北京时间 23:59:59.999）
    const end = moment.tz(endDate as string, 'YYYY-MM-DD', 'Asia/Shanghai').endOf('day').toDate();

    // 查询指定日期范围的课时记录
    const records = await LessonRecord.find({
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: 1 });

    // 添加UTF-8 BOM标记，解决Excel打开CSV文件时中文乱码问题
    const BOM = '\uFEFF';
    // 生成CSV内容
    let csvContent = BOM + '课程名称,年级,日期,课时数量,备注\n';

    records.forEach(record => {
      // 确保日期格式化正确 - 使用moment格式化为北京时间
      const date = moment(record.date).tz('Asia/Shanghai').format('YYYY-MM-DD');
      
      // 确保数据中的逗号和换行符被适当处理
      const courseName = record.courseName ? `"${record.courseName.replace(/"/g, '""')}"` : '""';
      const grade = record.grade ? `"${record.grade.replace(/"/g, '""')}"` : '""';
      const notes = record.notes ? `"${record.notes.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';
      const hours = record.hours || 0;

      csvContent += `${courseName},${grade},${date},${hours},${notes}\n`;
    });

    // 设置响应头，确保正确的编码和文件类型
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=lesson_records_${startDate}_to_${endDate}.csv`);

    // 发送响应
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('导出失败:', error);
    return res.status(500).json({ message: error.message || '导出失败' });
  }
} 
