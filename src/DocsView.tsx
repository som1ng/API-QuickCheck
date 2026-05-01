import { useState } from 'react';
import { ChevronRight, Database, Folder, FileText, ChevronDown } from 'lucide-react';
import QuickStartDoc from './docs/QuickStartDoc';
import ClaudeCodeDoc from './docs/ClaudeCodeDoc';
import EmptyStateDoc from './docs/EmptyStateDoc';

export default function DocsView() {
  const [activeDoc, setActiveDoc] = useState('quick-start');
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['入门', '代理网关', 'Agent 接入']);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => 
      prev.includes(folder) 
        ? prev.filter(f => f !== folder) 
        : [...prev, folder]
    );
  };

  const renderContent = () => {
    switch (activeDoc) {
      case 'quick-start':
        return <QuickStartDoc />;
      case 'claude-code':
        return <ClaudeCodeDoc />;
      default:
        return <EmptyStateDoc />;
    }
  };

  const navItems = [
    {
      category: '入门',
      items: [
        { id: 'quick-start', label: '快速开始' },
        { id: 'core-concepts', label: '核心概念' },
      ],
    },
    {
      category: '代理网关',
      items: [
        { id: 'lite-llm', label: 'LiteLLM 配置' },
        { id: 'model-routing', label: '模型路由' },
      ],
    },
    {
      category: 'Agent 接入',
      items: [
        { id: 'claude-code', label: 'Claude Code' },
        { id: 'cursor', label: 'Cursor' },
        { id: 'openclaw', label: 'OpenClaw' },
      ],
    },
  ];

  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 border-r border-white/10 overflow-y-auto bg-transparent pb-10">
        <div className="p-4 border-b border-white/5 mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
            <Database className="w-3.5 h-3.5" />
            文档库
          </div>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((group, idx) => {
            const isExpanded = expandedFolders.includes(group.category);
            return (
              <div key={idx} className="space-y-0.5">
                <button
                  onClick={() => toggleFolder(group.category)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:bg-white/5 rounded-md transition-colors group"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 transition-transform" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500 transition-transform" />
                  )}
                  <Folder className={`w-4 h-4 ${isExpanded ? 'text-blue-400' : 'text-slate-500'} group-hover:text-blue-400 transition-colors`} />
                  <span className="font-medium tracking-tight">{group.category}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/5 space-y-0.5 mt-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveDoc(item.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-all group ${
                          activeDoc === item.id
                            ? 'bg-blue-500/10 text-blue-400 font-medium'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <FileText className={`w-3.5 h-3.5 ${activeDoc === item.id ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </div>
    </div>
  );
}
