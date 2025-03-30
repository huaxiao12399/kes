import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import moment from 'moment-timezone';

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
        limit: '15',
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
    try {
      // 使用moment-timezone处理日期，确保显示为北京时间
      return moment(dateString).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm');
    } catch (error) {
      console.error('日期格式化错误', error);
      return dateString || '无效日期';
    }
  };
  
  return (
    <Layout title="课时列表 - 教师课时管理系统">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-xl font-bold">课时记录列表</h1>
        
        <div className="mb-3 rounded-md bg-white p-3 shadow-md">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700">搜索</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="课程名称"
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">起始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-1">
              <button
                type="submit"
                className="rounded-md bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              >
                搜索
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                  fetchRecords(1, '', '', '');
                }}
                className="rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-1"
              >
                重置
              </button>
            </div>
          </form>
        </div>
        
        {error && (
          <div className="mb-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
        
        <div className="rounded-md bg-white p-3 shadow-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs">
              共 <span className="font-medium">{totalRecords}</span> 条记录
            </span>
            <button
              onClick={() => router.push('/')}
              className="rounded-md bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
            >
              添加新记录
            </button>
          </div>
          
          {loading ? (
            <div className="py-3 text-center text-xs">加载中...</div>
          ) : records.length === 0 ? (
            <div className="py-3 text-center text-xs text-gray-500">暂无记录</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      <th className="px-2 py-2">课程名称</th>
                      <th className="px-2 py-2">日期</th>
                      <th className="px-2 py-2">课时</th>
                      <th className="px-2 py-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {records.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-gray-900 sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis max-w-[90px]">
                          <div className="break-words sm:truncate">
                            {record.courseName}
                          </div>
                        </td>
                        <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-gray-900">
                          {formatDate(record.date)}
                        </td>
                        <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-center text-gray-900">
                          {record.hours}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right font-medium">
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
                <div className="mt-3 flex items-center justify-center space-x-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 px-2 py-0.5 text-xs disabled:opacity-50"
                  >
                    上一页
                  </button>
                  
                  <span className="text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-300 px-2 py-0.5 text-xs disabled:opacity-50"
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
