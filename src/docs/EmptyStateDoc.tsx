import { Construction } from 'lucide-react';

export default function EmptyStateDoc() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-300 pt-32">
      <Construction className="w-20 h-20 text-slate-700 mb-6 opacity-50" />
      <h2 className="text-xl font-bold text-slate-300 mb-2">文档构建中</h2>
      <p className="text-slate-500 max-w-md">该模块文档正在疯狂施工中，敬请期待...</p>
    </div>
  );
}
