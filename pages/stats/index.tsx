import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// 注册Chart.js组件
ChartJS.register(ArcElement, Tooltip, Legend, Title);

// 生成随机颜色
const generateColors = (count: number) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 200) + 55;
    const g = Math.floor(Math.random() * 200) + 55;
    const b = Math.floor(Math.random() * 200) + 55;
    colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
  }
  return colors;
};

interface CourseData {
  _id: string;
  courseName: string;
  totalHours: number;
  count: number;
}

interface GradeData {
  grade: string;
  totalHours: number;
  count: number;
}

interface StatsData {
  totalHours: number;
  allTimeHours: number;
  courseStats: CourseData[];
  gradeStats: GradeData[];
  allTimeCourseStats: CourseData[];
  allTimeGradeStats: GradeData[];
}

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // 获取统计数据
  const fetchStats = async (selectedMonth: string) => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`/api/stats?month=${selectedMonth}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '获取统计数据失败');
      }
      
      const data = await res.json();
      setStats(data);
    } catch (error: any) {
      console.error('获取统计数据失败', error);
      setError(error.message || '获取统计数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchStats(month);
  }, [month]);
  
  // 格式化数字为保留一位小数
  const formatNumber = (num: number) => {
    return num.toFixed(1);
  };
  
  // 生成过去12个月的选项
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      options.push({ value, label });
    }
    
    return options;
  };
  
  const monthOptions = generateMonthOptions();
  
  // 在饼图数据中，处理课程名称使其支持换行
  const processLabels = (labels: string[]) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    return labels.map(label => {
      if (!label) return label;
      
      // 移动设备上处理超过6个字符的名称，每6个字符添加一个换行符
      if (isMobile && label.length > 6) {
        let result = '';
        for (let i = 0; i < label.length; i++) {
          result += label[i];
          if ((i + 1) % 6 === 0 && i < label.length - 1) {
            result += '\n';
          }
        }
        return result;
      } 
      // 大屏幕上处理超过10个字符的名称，每10个字符添加一个换行符
      else if (!isMobile && label.length > 10) {
        let result = '';
        for (let i = 0; i < label.length; i++) {
          result += label[i];
          if ((i + 1) % 10 === 0 && i < label.length - 1) {
            result += '\n';
          }
        }
        return result;
      }
      
      return label;
    });
  };

  // 图表配置
  const pieOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15, // 减小图例颜色框的宽度
          padding: 10, // 增加图例项之间的间距
          font: {
            size: 11 // 减小字体大小
          },
          // 移除会导致问题的generateLabels自定义函数
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toFixed(1)}课时 (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  // 响应式的图表配置，根据屏幕宽度调整
  const getResponsivePieOptions = () => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    return {
      ...pieOptions,
      plugins: {
        ...pieOptions.plugins,
        legend: {
          ...pieOptions.plugins.legend,
          position: isMobile ? 'bottom' as const : 'right' as const
        }
      }
    };
  };

  // 为图表准备数据，处理长标签的简单方法
  const preparePieChartData = (data: CourseData[] | GradeData[], 
                               labelField: 'courseName' | 'grade', 
                               valueField: 'totalHours') => {
    if (!data || data.length === 0) {
      return {
        labels: ['暂无数据'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e0e0e0'],
        }]
      };
    }

    // 创建正常的标签，不进行换行处理
    const labels = data.map(item => labelField === 'courseName' 
      ? (item as CourseData).courseName
      : (item as GradeData).grade);
    
    return {
      labels,
      datasets: [{
        data: data.map(item => item[valueField]),
        backgroundColor: generateColors(data.length),
        borderWidth: 1
      }]
    };
  };

  // 修改各个图表数据函数，使用新的数据准备方法
  const getMonthlyCourseChartData = () => {
    return preparePieChartData(stats?.courseStats || [], 'courseName', 'totalHours');
  };

  const getMonthlyGradeChartData = () => {
    return preparePieChartData(stats?.gradeStats || [], 'grade', 'totalHours');
  };

  const getAllTimeCourseChartData = () => {
    return preparePieChartData(stats?.allTimeCourseStats || [], 'courseName', 'totalHours');
  };

  const getAllTimeGradeChartData = () => {
    return preparePieChartData(stats?.allTimeGradeStats || [], 'grade', 'totalHours');
  };

  return (
    <Layout title="统计分析 - 教师课时管理系统">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">统计分析</h1>
        
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2 text-sm font-medium text-gray-700">选择月份:</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="py-6 text-center">加载中...</div>
        ) : stats ? (
          <div className="space-y-8">
            {/* 全部数据统计 */}
            <div className="rounded-md bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">全部时间统计</h2>
              <div className="rounded-md bg-blue-50 p-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatNumber(stats.allTimeHours)}
                  </p>
                  <p className="mt-1 text-gray-600">累计总课时</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 全部课程分布 */}
                <div className="bg-white p-4 rounded-md shadow">
                  <h3 className="text-lg font-medium mb-2 text-center">课程分布</h3>
                  <div className="h-64">
                    <Pie data={getAllTimeCourseChartData()} options={getResponsivePieOptions()} />
                  </div>
                </div>

                {/* 全部年级分布 */}
                <div className="bg-white p-4 rounded-md shadow">
                  <h3 className="text-lg font-medium mb-2 text-center">年级分布</h3>
                  <div className="h-64">
                    <Pie data={getAllTimeGradeChartData()} options={getResponsivePieOptions()} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 月度数据统计 */}
            <div className="rounded-md bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">
                {month.split('-')[0]}年{month.split('-')[1]}月统计
              </h2>
              <div className="rounded-md bg-green-50 p-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumber(stats.totalHours)}
                  </p>
                  <p className="mt-1 text-gray-600">本月总课时</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 月度课程分布 */}
                <div className="bg-white p-4 rounded-md shadow">
                  <h3 className="text-lg font-medium mb-2 text-center">课程分布</h3>
                  <div className="h-64">
                    <Pie data={getMonthlyCourseChartData()} options={getResponsivePieOptions()} />
                  </div>
                </div>

                {/* 月度年级分布 */}
                <div className="bg-white p-4 rounded-md shadow">
                  <h3 className="text-lg font-medium mb-2 text-center">年级分布</h3>
                  <div className="h-64">
                    <Pie data={getMonthlyGradeChartData()} options={getResponsivePieOptions()} />
                  </div>
                </div>
              </div>
            </div>
            
            {/* 表格数据 */}
            <div className="rounded-md bg-white p-6 shadow-md">
              <h2 className="mb-4 text-xl font-semibold">月度详细数据</h2>
              
              {stats.courseStats.length === 0 ? (
                <p className="text-center text-gray-500">本月暂无课程记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          课程名称
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          课时总数
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          记录数
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                        >
                          占比
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {stats.courseStats.map((course) => (
                        <tr key={course._id} className="hover:bg-gray-50">
                          <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                            {course.courseName}
                          </td>
                          <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                            {formatNumber(course.totalHours)}
                          </td>
                          <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                            {course.count}
                          </td>
                          <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                            {stats.totalHours > 0
                              ? `${((course.totalHours / stats.totalHours) * 100).toFixed(1)}%`
                              : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
} 
