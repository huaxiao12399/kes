import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';

interface LessonRecord {
  _id: string;
  courseName: string;
  grade: string;
  date: string;
  hours: number;
  notes: string;
}

interface RecordsResponse {
  records: LessonRecord[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const router = useRouter();

  const fetchRecords = async (page = 1, searchQuery = '', start = '', end = '') => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (start) {
        queryParams.append('startDate', start);
      }
      
      if (end) {
        queryParams.append('endDate', end);
      }
      
      const res = await fetch(`/api/records?${queryParams.toString()}`);
      
      if (res.ok) {
        const data: RecordsResponse = await res.json();
        setRecords(data.records);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
        setTotalRecords(data.total);
      } else {
        const errorData = await res.json();
        setError(errorData.message || '获取记录失败');
      }
    } catch (error) {
      console.error('获取记录失败', error);
      setError('获取记录失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRecords(currentPage, search, startDate, endDate);
  }, [currentPage]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords(1, search, startDate, endDate);
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此记录吗？')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        // 重新获取当前页面数据
        fetchRecords(currentPage, search, startDate, endDate);
      } else {
        const errorData = await res.json();
        alert(errorData.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败', error);
      alert('删除失败，请重试');
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Layout title="课时列表 - 教师课时管理系统">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-2xl font-bold">课时记录列表</h1>
        
        <div className="mb-6 rounded-md bg-white p-4 shadow-md">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">搜索</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="课程名称、年级或备注"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">起始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                搜索
              </button>
            </div>
            
            <div>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                  fetchRecords(1, '', '', '');
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                重置
              </button>
            </div>
          </form>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        
        <div className="rounded-md bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <span>
              共 <span className="font-medium">{totalRecords}</span> 条记录
            </span>
            <button
              onClick={() => router.push('/')}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              添加新记录
            </button>
          </div>
          
          {loading ? (
            <div className="py-6 text-center">加载中...</div>
          ) : records.length === 0 ? (
            <div className="py-6 text-center text-gray-500">暂无记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        课程名称
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        年级
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        日期
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        课时
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        备注
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {records.map((record) => (
                      <tr key={record._id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {record.courseName}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {record.grade}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {record.hours}
                        </td>
                        <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-900">
                          {record.notes || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(record._id)}
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
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    上一页
                  </button>
                  
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
} 