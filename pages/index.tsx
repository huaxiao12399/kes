import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

interface CourseOption {
  _id: string;
  name: string;
  grade: string;
}

interface FormData {
  courseId: string;
  date: string;
  time: string;
  hours: number;
  notes: string;
}

export default function Home() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [maxDate, setMaxDate] = useState(''); // 存储当前日期作为最大可选日期
  const router = useRouter();
  const { data: session } = useSession();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      hours: 1,
      notes: '',
    }
  });

  // 获取所有课程
  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
        
        // 如果有课程，默认选择第一个
        if (data.length > 0) {
          setValue('courseId', data[0]._id);
        }
      }
    } catch (error) {
      console.error('获取课程失败', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchCourses();
      
      // 设置默认日期为今天
      const today = new Date().toISOString().split('T')[0];
      setValue('date', today);
      setMaxDate(today); // 设置最大可选日期为今天
      
      // 设置默认时间为当前时间
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setValue('time', `${hours}:${minutes}`);
    }
  }, [session, setValue]);

  // 表单提交
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      // 获取选中课程的信息
      const selectedCourse = courses.find(c => c._id === data.courseId);
      
      if (!selectedCourse) {
        alert('请选择课程');
        return;
      }
      
      // 验证日期不能晚于今天
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 设置时间为当天的开始
      
      if (selectedDate > today) {
        alert('上课日期不能晚于今天');
        setLoading(false);
        return;
      }
      
      // 合并日期和时间
      const dateTime = `${data.date}T${data.time}:00`;
      
      const record = {
        courseId: data.courseId,
        date: dateTime, // 使用合并后的日期和时间
        hours: data.hours,
        notes: data.notes,
        courseName: selectedCourse.name,
        grade: selectedCourse.grade,
      };
      
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });
      
      if (res.ok) {
        setSuccess(true);
        reset({
          courseId: data.courseId,
          date: data.date,
          time: data.time,
          hours: 1,
          notes: '',
        });
        
        // 3秒后隐藏成功消息
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await res.json();
        alert(`提交失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('提交记录失败', error);
      alert('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const selectedCourseId = watch('courseId');
  const selectedCourse = courses.find(c => c._id === selectedCourseId);

  return (
    <Layout title="课时记录 - 教师课时管理系统">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">添加课时记录</h1>
        
        {courses.length === 0 ? (
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="text-sm text-yellow-700">
                <p>还没有课程，请先添加课程。</p>
                <button 
                  className="mt-2 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                  onClick={() => router.push('/courses')}
                >
                  前往课程管理
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {success && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  记录添加成功！
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                课程
              </label>
              <select
                {...register('courseId', { required: '请选择课程' })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name} ({course.grade})
                  </option>
                ))}
              </select>
              {errors.courseId && (
                <p className="mt-1 text-sm text-red-600">{errors.courseId.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  上课日期
                </label>
                <input
                  type="date"
                  max={maxDate} // 设置最大可选日期为今天
                  {...register('date', { 
                    required: '请选择日期',
                    validate: {
                      notInFuture: value => {
                        const selectedDate = new Date(value);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return selectedDate <= today || '上课日期不能晚于今天';
                      }
                    }
                  })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  上课时间
                </label>
                <input
                  type="time"
                  {...register('time', { required: '请选择时间' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.time && (
                  <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                课时数量
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                {...register('hours', { 
                  required: '请输入课时数量',
                  min: { value: 0.5, message: '最小课时为0.5' },
                  valueAsNumber: true
                })}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              {errors.hours && (
                <p className="mt-1 text-sm text-red-600">{errors.hours.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="可选"
              ></textarea>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '提交中...' : '保存记录'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
} 