import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useForm } from 'react-hook-form';

interface CourseData {
  _id: string;
  name: string;
  grade: string;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      grade: '',
    }
  });

  // 获取所有课程
  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('获取课程失败', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // 提交表单
  const onSubmit = async (data: { name: string; grade: string }) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const url = editingCourse ? `/api/courses/${editingCourse._id}` : '/api/courses';
      const method = editingCourse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const responseData = await res.json();
        setSuccess(editingCourse ? '课程更新成功' : '课程添加成功');
        reset({ name: '', grade: '' });
        setEditingCourse(null);
        fetchCourses();
      } else {
        const errorData = await res.json();
        setError(errorData.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败', error);
      setError('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 编辑课程
  const handleEdit = (course: CourseData) => {
    setEditingCourse(course);
    setValue('name', course.name);
    setValue('grade', course.grade);
    setError('');
    setSuccess('');
  };

  // 删除课程
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此课程吗？相关的课时记录也将被删除。')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('课程删除成功');
        fetchCourses();
      } else {
        const errorData = await res.json();
        setError(errorData.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败', error);
      setError('删除失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setEditingCourse(null);
    reset({ name: '', grade: '' });
    setError('');
    setSuccess('');
  };

  return (
    <Layout title="课程管理 - 教师课时管理系统">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">课程管理</h1>

        <div className="mb-8 rounded-md bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">
            {editingCourse ? '编辑课程' : '添加新课程'}
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                课程名称
              </label>
              <input
                {...register('name', { required: '请输入课程名称' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                年级
              </label>
              <input
                {...register('grade', { required: '请输入年级' })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              {errors.grade && (
                <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '处理中...' : editingCourse ? '更新' : '添加'}
              </button>

              {editingCourse && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  取消
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-md bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">课程列表</h2>

          {courses.length === 0 ? (
            <p className="text-gray-500">暂无课程，请添加</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      课程名称
                    </th>
                    <th scope="col" className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      年级
                    </th>
                    <th scope="col" className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                        {course.name}
                      </td>
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-900">
                        {course.grade}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right text-xs font-medium">
                        <button
                          onClick={() => handleEdit(course)}
                          className="mr-2 text-blue-600 hover:text-blue-800"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(course._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 