import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Head from 'next/head';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = '教师课时管理系统' }: LayoutProps) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  useEffect(() => {
    // 只在客户端执行，避免服务端渲染问题
    if (typeof window !== 'undefined') {
      if (!loading && !session && router.pathname !== '/auth/login') {
        router.push('/auth/login');
      }
    }
  }, [session, loading, router]);

  // 路由变化时关闭菜单
  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  // 如果是登录页面，直接渲染子内容
  if (router.pathname === '/auth/login') {
    return <>{children}</>;
  }

  // 如果正在加载会话状态，显示加载中
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl">加载中...</div>
      </div>
    );
  }

  // 如果未登录且不是登录页，显示空白（会被重定向）
  if (!session && router.pathname !== '/auth/login') {
    return null;
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="教师课时管理系统" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="flex min-h-screen flex-col">
        <header className="bg-blue-500 shadow-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <span className="text-xl font-bold text-white">教师课时管理系统</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {session?.user?.username || ''}
                </span>
                <Link href="/api/auth/signout" className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
                  退出登录
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 移动端汉堡菜单按钮 */}
        <div className="border-b bg-white shadow-sm md:hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12 items-center justify-between">
              <button 
                onClick={toggleMenu} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="菜单"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <span className="text-sm font-medium">{router.pathname === '/' ? '课时登记' : 
                            router.pathname === '/records' ? '课时列表' : 
                            router.pathname === '/stats' ? '统计分析' : 
                            router.pathname === '/courses' ? '课程管理' : 
                            router.pathname === '/import-export' ? '导入导出' : 
                            router.pathname === '/admin/users' ? '用户管理' : 
                            '当前页面'}</span>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {menuOpen && (
          <div className="fixed top-28 left-0 right-0 z-50 border-b bg-white shadow-md md:hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col py-2">
                <Link href="/" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                  课时登记
                </Link>
                <Link href="/records" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                  课时列表
                </Link>
                <Link href="/stats" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                  统计分析
                </Link>
                <Link href="/courses" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                  课程管理
                </Link>
                <Link href="/import-export" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                  导入导出
                </Link>
                {session?.user?.username === 'admin' && (
                  <Link href="/admin/users" className="block py-2 text-base text-gray-500 hover:text-gray-900">
                    用户管理
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 桌面端导航 */}
        <nav className="hidden border-b bg-white shadow-sm md:block">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-12">
              <Link href="/" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                课时登记
              </Link>
              <Link href="/records" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                课时列表
              </Link>
              <Link href="/stats" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                统计分析
              </Link>
              <Link href="/courses" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                课程管理
              </Link>
              <Link href="/import-export" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                导入导出
              </Link>
              {session?.user?.username === 'admin' && (
                <Link href="/admin/users" className="inline-flex items-center border-b-2 border-transparent px-4 pt-1 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-gray-700">
                  用户管理
                </Link>
              )}
            </div>
          </div>
        </nav>

        <main className="flex-1 bg-gray-50 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>

        <footer className="bg-white py-4 text-center text-sm text-gray-500">
          <div>© {new Date().getFullYear()} 教师课时管理系统</div>
        </footer>
      </div>
    </>
  );
} 