import React, { useState } from 'react';
import Layout from '@/components/Layout';

export default function ImportExportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 导出数据
  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      setError('请选择起始和结束日期');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // 创建一个URL，包含查询参数
      const exportUrl = `/api/export?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      
      // 直接打开导出链接，让浏览器处理下载
      window.open(exportUrl, '_blank');
      
      // 设置成功信息
      setSuccess('导出请求已发送，请检查下载');
    } catch (error: any) {
      console.error('导出失败', error);
      setError(error.message || '导出失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout title="导入导出 - 教师课时管理系统">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">数据导入导出</h1>
        
        <div className="mb-8 rounded-md bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">导出数据</h2>
          
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
          
          <form onSubmit={handleExport} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  起始日期
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  结束日期
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? '导出中...' : '导出为CSV'}
              </button>
            </div>
          </form>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>注意：导出数据将包括所选日期范围内的所有课时记录。</p>
            <p className="mt-1">如果导出的CSV文件中文显示乱码，请在Excel中打开时选择UTF-8编码格式。</p>
          </div>
        </div>
        
        <div className="rounded-md bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">功能说明</h2>
          
          <div className="prose prose-sm max-w-none text-gray-600">
            <p>
              <strong>导出功能</strong>：可以将指定日期范围内的课时记录导出为CSV文件，方便您进行备份或在Excel等软件中进行进一步分析。
            </p>
            <p className="mt-2">
              <strong>Excel打开CSV文件指南</strong>：
            </p>
            <ol className="mt-1 list-decimal pl-4">
              <li>打开Excel，选择"数据"选项卡</li>
              <li>点击"从文本/CSV"</li>
              <li>选择下载的CSV文件</li>
              <li>在导入向导中，确保文件原始格式设置为"UTF-8"</li>
              <li>完成导入</li>
            </ol>
            <p className="mt-2">
              <strong>导入功能</strong>：目前尚未实现。后续版本将支持从CSV文件导入课时记录。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 