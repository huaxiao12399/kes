import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';

interface User {
  _id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  username: string;
  password: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();
  
  // 检查用户是否是管理员
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.username !== 'admin') {
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [session, status, router]);
  
  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('/api/admin/users');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '获取用户失败');
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (error: any) {
      console.error('获取用户失败', error);
      setError(error.message || '获取用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (session && session.user?.username === 'admin') {
      fetchUsers();
    }
  }, [session]);
  
  // 添加用户
  const handleAddUser = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '创建用户失败');
      }
      
      const result = await res.json();
      setSuccess(result.message);
      reset();
      setIsAdding(false);
      fetchUsers();
    } catch (error: any) {
      console.error('创建用户失败', error);
      setError(error.message || '创建用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 更新用户
  const handleUpdateUser = async (data: FormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // 如果密码为空，则不更新密码
      const payload: any = { username: data.username };
      if (data.password) {
        payload.password = data.password;
      }
      
      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '更新用户失败');
      }
      
      const result = await res.json();
      setSuccess(result.message);
      reset();
      setIsEditing(false);
      setEditingUserId('');
      fetchUsers();
    } catch (error: any) {
      console.error('更新用户失败', error);
      setError(error.message || '更新用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 删除用户
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '删除用户失败');
      }
      
      const result = await res.json();
      setSuccess(result.message);
      setShowConfirmDelete(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      console.error('删除用户失败', error);
      setError(error.message || '删除用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 确认删除
  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setShowConfirmDelete(true);
  };
  
  // 开始编辑用户
  const startEditUser = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user._id);
    reset({ username: user.username, password: '' });
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  if (status === 'loading' || (status === 'authenticated' && session?.user?.username !== 'admin')) {
    return (
      <Layout title="用户管理 - 教师课时管理系统">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }
  
  if (status === 'unauthenticated') {
    return null; // 这里将重定向到登录页面
  }
  
  return (
    <Layout title="用户管理 - 教师课时管理系统">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">用户管理</h1>
        
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
        
        {/* 添加按钮 */}
        {!isAdding && !isEditing && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                reset({ username: '', password: '' });
              }}
              className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              添加用户
            </button>
          </div>
        )}
        
        {/* 添加用户表单 */}
        {isAdding && (
          <div className="mb-6 rounded-md bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">添加新用户</h2>
            
            <form onSubmit={handleSubmit(handleAddUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <input
                  type="text"
                  {...register('username', { required: '请输入用户名' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <input
                  type="password"
                  {...register('password', { required: '请输入密码' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '保存'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    reset();
                  }}
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 编辑用户表单 */}
        {isEditing && (
          <div className="mb-6 rounded-md bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">编辑用户</h2>
            
            <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <input
                  type="text"
                  {...register('username', { required: '请输入用户名' })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  新密码 (留空则不修改)
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  autoComplete="new-password"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? '提交中...' : '保存'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditingUserId('');
                    reset();
                  }}
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 用户列表 */}
        <div className="rounded-md bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">用户列表</h2>
          
          {loading && !isAdding && !isEditing ? (
            <div className="py-6 text-center">加载中...</div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-gray-500">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      用户名
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      创建时间
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      更新时间
                    </th>
                    <th
                      scope="col"
                      className="px-2 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="overflow-hidden text-ellipsis whitespace-nowrap px-2 py-1.5 text-xs text-gray-500">
                        {formatDate(user.updatedAt)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-1.5 text-right text-xs">
                        <button
                          onClick={() => startEditUser(user)}
                          className="mr-2 text-blue-600 hover:text-blue-900"
                          disabled={isAdding || isEditing}
                        >
                          编辑
                        </button>
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => confirmDelete(user)}
                            className="text-red-600 hover:text-red-900"
                            disabled={isAdding || isEditing}
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* 删除确认弹窗 */}
        {showConfirmDelete && userToDelete && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
                &#8203;
              </span>
              
              <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">确认删除</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          你确定要删除用户 "{userToDelete.username}" 吗？此操作不可撤销。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {loading ? '删除中...' : '删除'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmDelete(false);
                      setUserToDelete(null);
                    }}
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 