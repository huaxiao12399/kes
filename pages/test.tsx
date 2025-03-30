import React from 'react';
import Layout from '@/components/Layout';

export default function TestPage() {
  return (
    <Layout title="测试页面">
      <div>
        <h1 className="text-2xl font-bold">环境测试页面</h1>
        <p className="my-4">如果此页面能正常显示，说明TypeScript和环境配置正常。</p>
      </div>
    </Layout>
  );
} 