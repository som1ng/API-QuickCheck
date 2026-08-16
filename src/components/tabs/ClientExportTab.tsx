import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import {
  loadAllDocs,
  interpolateDocVariables,
  slugifyHeading,
  MarkdownDoc,
} from '../../content/docsEngine';
import {
  ChevronRight,
  ChevronDown,
  Copy,
  Search,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
} from 'lucide-react';

export const ClientExportTab: React.FC = () => {
  const { state } = useApp();
  const { config } = state;

  // Load all docs via Vite glob auto-loader
  const { docs: allDocs, categories: categoryGroups } = useMemo(() => loadAllDocs(), []);

  // Active Doc Selection (default to first doc)
  const [activeSlug, setActiveSlug] = useState<string>(() => {
    return allDocs.length > 0 ? allDocs[0].slug : 'about';
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalCopied, setGlobalCopied] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Resizable sidebar state (200px ~ 420px, default 220px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('api_quickcheck_docs_sidebar_width');
    return saved ? Math.max(200, Math.min(420, parseInt(saved, 10))) : 220;
  });
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Resizable sidebar mouse event handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(420, e.clientX));
      setSidebarWidth(newWidth);
      localStorage.setItem('api_quickcheck_docs_sidebar_width', newWidth.toString());
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Current active doc
  const currentDoc: MarkdownDoc = useMemo(() => {
    const found = allDocs.find((d) => d.slug === activeSlug);
    return found || allDocs[0];
  }, [allDocs, activeSlug]);

  // Context interpolated markdown content
  const interpolatedContent = useMemo(() => {
    if (!currentDoc) return '';
    return interpolateDocVariables(currentDoc.content, {
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      apiKey: config.apiKey || 'sk-your-api-key-here',
      model: config.selectedModel || 'claude-3-7-sonnet-20250219',
    });
  }, [currentDoc, config.baseUrl, config.apiKey, config.selectedModel]);

  // Filtered categories based on search
  const filteredCategoryGroups = useMemo(() => {
    if (!searchQuery.trim()) return categoryGroups;
    const q = searchQuery.toLowerCase().trim();
    return categoryGroups
      .map((cat) => {
        const matchedDocs = cat.docs.filter(
          (d) =>
            d.frontmatter.title.toLowerCase().includes(q) ||
            d.slug.toLowerCase().includes(q) ||
            d.content.toLowerCase().includes(q) ||
            cat.title.toLowerCase().includes(q)
        );
        return {
          ...cat,
          docs: matchedDocs,
        };
      })
      .filter((cat) => cat.docs.length > 0);
  }, [categoryGroups, searchQuery]);

  // Prev / Next pagination
  const currentDocIndex = allDocs.findIndex((d) => d.slug === currentDoc?.slug);
  const prevDoc = currentDocIndex > 0 ? allDocs[currentDocIndex - 1] : null;
  const nextDoc =
    currentDocIndex >= 0 && currentDocIndex < allDocs.length - 1
      ? allDocs[currentDocIndex + 1]
      : null;

  const navigateToDoc = (slug: string) => {
    setActiveSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToHeading = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      const yOffset = -70;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const cleanBaseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');

  const handleCopyGlobalConfig = async () => {
    const jsonConfig = JSON.stringify(
      {
        baseUrl: cleanBaseUrl,
        apiKey: config.apiKey || 'sk-your-api-key-here',
        selectedModel: config.selectedModel || 'claude-3-7-sonnet-20250219',
        platformId: config.platformId,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
    try {
      await navigator.clipboard.writeText(jsonConfig);
      setGlobalCopied(true);
      setTimeout(() => setGlobalCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!currentDoc) {
    return <div className="p-12 text-slate-400 font-mono text-xs">暂无可用文档</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#0d0d0c]">
      
      {/* Full-width 3-Column Developer Layout */}
      <div className="flex-1 flex w-full relative">
        
        {/* ========================================== */}
        {/* 1. Left Sidebar: Minimalist, Flush Left    */}
        {/* ========================================== */}
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className="shrink-0 sticky top-0 h-[calc(100vh-52px)] border-r border-white/10 bg-[#0d0d0c] flex flex-col z-20 select-none"
        >
          {/* Minimal Search Input */}
          <div className="p-3 border-b border-white/5">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="w-full h-8 rounded bg-[#141413] border border-white/10 pl-8 pr-14 text-xs text-white placeholder-slate-400 focus:border-[#e8895d] focus:outline-none transition font-sans"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-white px-1 pointer-events-auto"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 bg-[#1a1918] px-1.5 py-0.5 rounded border border-white/10 leading-none select-none">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Category Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {filteredCategoryGroups.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[14px] font-sans font-bold text-white hover:text-[#e8895d] transition rounded"
                  >
                    <span className="truncate tracking-tight">{group.title}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {/* Document Links */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pt-0.5">
                      {group.docs.map((doc) => {
                        const isActive = currentDoc.slug === doc.slug;
                        return (
                          <button
                            key={doc.slug}
                            onClick={() => navigateToDoc(doc.slug)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[13px] font-sans transition text-left ${
                              isActive
                                ? 'bg-white/10 text-white font-semibold'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate">{doc.frontmatter.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Bottom Active Relay Status */}
          <div className="p-3 border-t border-white/5 bg-[#0d0d0c] space-y-1 text-[11px] font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] tracking-wider">当前接口</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />
            </div>
            <div className="text-slate-300 text-xs truncate select-all" title={cleanBaseUrl}>
              {cleanBaseUrl}
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* 2. Resizable Divider                       */}
        {/* ========================================== */}
        <div
          onMouseDown={startResizing}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-[#e8895d] transition-all cursor-col-resize z-30 shrink-0 select-none relative group -ml-0.5"
          title="拖拽调整侧边栏宽度"
        >
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-8 -ml-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div className="w-0.5 h-4 bg-white rounded-full" />
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. Center Column: Main Article Body        */}
        {/* ========================================== */}
        <main className="flex-1 min-w-0 flex justify-center py-10 px-6 sm:px-10 lg:px-14 overflow-y-auto">
          
          <div className="w-full max-w-3xl space-y-8 min-w-0">
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-sans">
              <span
                className="hover:text-white cursor-pointer"
                onClick={() => navigateToDoc(allDocs[0].slug)}
              >
                文档
              </span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-slate-300">{currentDoc.frontmatter.categoryTitle}</span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white font-medium">{currentDoc.frontmatter.title}</span>
            </div>

            {/* Document Header */}
            <div className="space-y-3 pb-6 border-b border-white/10">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans">
                {currentDoc.frontmatter.title}
              </h1>

              {currentDoc.frontmatter.subtitle && (
                <p className="text-[15px] text-slate-300 leading-relaxed font-sans pt-1">
                  {currentDoc.frontmatter.subtitle}
                </p>
              )}
            </div>

            {/* Markdown Body Renderer */}
            <article className="prose prose-invert max-w-none text-slate-200 font-sans text-[15px] leading-[1.8]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2
                        id={id}
                        className="text-xl font-bold text-white tracking-tight pt-8 pb-2 border-b border-white/10 mt-8 mb-4 font-sans"
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3
                        id={id}
                        className="text-base font-bold text-white pt-4 mt-6 mb-2 font-sans"
                      >
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="my-3.5 text-slate-200 leading-[1.8]">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 text-[15px] text-slate-200 pl-2 my-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 text-[15px] text-slate-200 pl-2 my-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed text-slate-200">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="rounded-md border-l-2 border-[#e8895d] bg-white/[0.03] pl-4 pr-3 py-2.5 text-[14px] text-slate-300 my-5 not-italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 w-full overflow-x-auto rounded-xl border border-white/10 bg-[#121211] shadow-sm">
                      <table className="w-full text-left text-sm border-collapse font-sans">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-white/[0.04] border-b border-white/10 text-slate-100 font-semibold font-sans">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-white/5 bg-transparent font-sans">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="py-3 px-4 text-sm font-semibold text-slate-100 text-left font-sans">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="py-3.5 px-4 text-sm text-slate-200 border-b border-white/5 leading-relaxed font-sans">{children}</td>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-white/10 border border-white/10 px-1.5 py-0.5 text-xs font-mono text-[#e8895d]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="my-5">
                        <CodeBlock
                          code={String(children).replace(/\n$/, '')}
                          language={match ? match[1] : 'text'}
                          showLineNumbers
                        />
                      </div>
                    );
                  },
                }}
              >
                {interpolatedContent}
              </ReactMarkdown>
            </article>

            {/* Bottom Prev / Next Navigation Cards */}
            <div className="pt-10 border-t border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prevDoc ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(prevDoc.slug)}
                    className="flex flex-col items-start p-4 rounded-lg border border-white/10 bg-[#121211] hover:border-[#e8895d]/50 hover:bg-[#161614] transition text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ArrowLeft className="h-3 w-3" />
                      <span>上一篇</span>
                    </div>
                    <div className="mt-1 font-sans text-xs text-white font-medium truncate w-full">
                      {prevDoc.frontmatter.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextDoc ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(nextDoc.slug)}
                    className="flex flex-col items-end p-4 rounded-lg border border-white/10 bg-[#121211] hover:border-[#e8895d]/50 hover:bg-[#161614] transition text-right"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>下一篇</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <div className="mt-1 font-sans text-xs text-white font-medium truncate w-full">
                      {nextDoc.frontmatter.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Back to Top */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-4 font-mono">
                <div>
                  <span className="text-slate-300">{currentDoc.frontmatter.title}</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-[#e8895d] hover:underline"
                >
                  回到顶部 ↑
                </button>
              </div>
            </div>

          </div>

        </main>

        {/* ========================================== */}
        {/* 4. Far Right Column: TOC "本页内容"        */}
        {/* ========================================== */}
        <aside className="hidden xl:flex w-52 shrink-0 py-10 pr-6 pl-4 flex-col sticky top-0 h-[calc(100vh-52px)] overflow-y-auto border-l border-white/5 select-none">
          <div className="space-y-3 sticky top-4">
            <div className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-[#e8895d]" />
              <span>本页内容</span>
            </div>

            {currentDoc.headings.length === 0 ? (
              <div className="text-xs text-slate-500 font-sans">暂无子标题</div>
            ) : (
              <nav className="space-y-1 text-[13px] font-sans">
                {currentDoc.headings.map((heading, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(heading.id)}
                    className={`w-full text-left py-1 text-slate-400 hover:text-white transition block truncate leading-snug ${
                      heading.level === 3 ? 'pl-2 text-xs text-slate-500' : ''
                    }`}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            )}

            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleCopyGlobalConfig}
                className="w-full flex items-center justify-center gap-1.5 rounded border border-white/10 bg-[#141413] py-1 text-xs text-slate-300 hover:text-white hover:border-[#e8895d] transition font-mono"
              >
                <Copy className="h-3 w-3" />
                <span>{globalCopied ? '已复制' : '复制配置'}</span>
              </button>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};
