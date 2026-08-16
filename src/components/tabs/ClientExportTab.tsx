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
  FileText,
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

  // Resizable sidebar state (220px ~ 480px)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    const saved = localStorage.getItem('api_quickcheck_docs_sidebar_width');
    return saved ? Math.max(220, Math.min(480, parseInt(saved, 10))) : 280;
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
      const newWidth = Math.max(220, Math.min(480, e.clientX));
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
      const yOffset = -80;
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
    return <div className="p-8 text-neutral-400">暂无可用文档</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#141413]">
      
      {/* Full-width 3-column Layout */}
      <div className="flex-1 flex w-full relative">
        
        {/* ========================================== */}
        {/* 1. Left Sidebar: Flush Left, Resizable     */}
        {/* ========================================== */}
        <aside
          style={{ width: `${sidebarWidth}px` }}
          className="shrink-0 sticky top-0 h-[calc(100vh-56px)] border-r border-[#2e2b27] bg-[#141413] flex flex-col z-20 select-none"
        >
          {/* Top Search */}
          <div className="p-3 border-b border-[#2e2b27] bg-[#181715]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="w-full rounded-md border border-[#2e2b27] bg-[#1f1e1b] py-1.5 pl-8 pr-14 text-xs text-[#faf9f5] placeholder-neutral-400 focus:border-[#cc785c] focus:outline-none transition font-sans"
              />
              <div className="absolute right-2 top-1.5 flex items-center">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-neutral-400 hover:text-white px-1"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-400 bg-[#252320] px-1.5 py-0.5 rounded border border-[#2e2b27]">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Category Tree (Auto-generated from Markdown Frontmatter) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {filteredCategoryGroups.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 hover:text-[#faf9f5] rounded transition"
                  >
                    <span className="truncate">{group.title}</span>
                    <ChevronDown
                      className={`h-3 w-3 text-neutral-400 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                  </button>

                  {/* Document Items in Category */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pl-1">
                      {group.docs.map((doc) => {
                        const isActive = currentDoc.slug === doc.slug;
                        return (
                          <button
                            key={doc.slug}
                            onClick={() => navigateToDoc(doc.slug)}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition text-left ${
                              isActive
                                ? 'bg-[#252320] text-[#faf9f5] font-semibold border-l-2 border-[#cc785c]'
                                : 'text-neutral-300 hover:text-[#faf9f5] hover:bg-[#181715]'
                            }`}
                          >
                            <span className="truncate">{doc.frontmatter.title}</span>
                            {doc.frontmatter.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                                  isActive
                                    ? 'bg-[#cc785c] text-white'
                                    : 'bg-[#1f1e1b] text-neutral-400 border border-[#2e2b27]'
                                }`}
                              >
                                {doc.frontmatter.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Bottom Status */}
          <div className="p-3 border-t border-[#2e2b27] bg-[#181715] space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-neutral-400 font-medium">
              <span className="font-mono uppercase text-[10px]">Endpoint</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#5db872]" />
            </div>
            <div className="font-mono text-neutral-300 text-xs truncate select-all" title={cleanBaseUrl}>
              {cleanBaseUrl}
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* 2. Resizable Divider Handle (Drag to Resize) */}
        {/* ========================================== */}
        <div
          onMouseDown={startResizing}
          className="w-1 hover:w-1.5 bg-transparent hover:bg-[#cc785c] transition-all cursor-col-resize z-30 shrink-0 select-none relative group -ml-0.5"
          title="拖拽调整侧边栏宽度"
        >
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-3 h-8 -ml-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
            <div className="w-0.5 h-4 bg-[#faf9f5] rounded-full" />
          </div>
        </div>

        {/* ========================================== */}
        {/* 3. Center Column: Main Markdown Article    */}
        {/* ========================================== */}
        <div className="flex-1 min-w-0 flex justify-center py-8 px-6 lg:px-12 xl:px-16 overflow-y-auto">
          
          <div className="w-full max-w-4xl space-y-8 min-w-0">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 font-sans">
              <span
                className="hover:text-white cursor-pointer"
                onClick={() => navigateToDoc(allDocs[0].slug)}
              >
                文档
              </span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-neutral-300">{currentDoc.frontmatter.categoryTitle}</span>
              <ChevronRight className="h-3 w-3 text-[#2e2b27]" />
              <span className="text-[#faf9f5] font-semibold">{currentDoc.frontmatter.title}</span>
            </div>

            {/* Document Header */}
            <div className="space-y-3 pb-6 border-b border-[#2e2b27]">
              <div className="flex flex-wrap items-center gap-2">
                {currentDoc.frontmatter.badge && (
                  <span className="rounded border border-[#cc785c]/40 bg-[#cc785c]/10 px-2 py-0.5 text-xs font-mono font-medium text-[#cc785c]">
                    {currentDoc.frontmatter.badge}
                  </span>
                )}
                {currentDoc.frontmatter.protocol && (
                  <span className="rounded border border-[#2e2b27] bg-[#181715] px-2 py-0.5 text-xs font-mono text-neutral-300">
                    {currentDoc.frontmatter.protocol}
                  </span>
                )}
              </div>

              <h1 className="font-serif-display text-3xl md:text-4xl font-normal text-[#faf9f5] tracking-tight">
                {currentDoc.frontmatter.title}
              </h1>

              {currentDoc.frontmatter.subtitle && (
                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {currentDoc.frontmatter.subtitle}
                </p>
              )}
            </div>

            {/* Markdown Body Renderer */}
            <article className="prose prose-invert max-w-none space-y-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2
                        id={id}
                        className="text-base font-semibold text-[#faf9f5] uppercase tracking-wider font-mono pt-6 pb-2 border-b border-[#2e2b27] flex items-center gap-2"
                      >
                        <span className="text-[#cc785c]">#</span>
                        <span>{children}</span>
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3
                        id={id}
                        className="text-sm font-semibold text-[#faf9f5] font-sans pt-4"
                      >
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="text-sm text-neutral-300 leading-relaxed font-sans my-3">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-300 pl-2 font-sans my-3">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-neutral-300 pl-2 font-sans my-3">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="rounded-md border border-[#cc785c]/40 bg-[#1f1a17] p-3.5 text-xs text-neutral-300 font-sans my-4 not-italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-4 rounded-md border border-[#2e2b27]">
                      <table className="w-full text-left text-xs font-mono divide-y divide-[#2e2b27]">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[#181715] text-neutral-400 uppercase font-semibold">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-[#2e2b27] bg-[#141413]">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-[#181715]/60 transition">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 font-medium">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 text-neutral-300">{children}</td>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-[#1f1e1b] border border-[#2e2b27] px-1.5 py-0.5 text-xs font-mono text-[#cc785c]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="my-4">
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
            <div className="pt-8 border-t border-[#2e2b27] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prevDoc ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(prevDoc.slug)}
                    className="flex flex-col items-start p-3.5 rounded-md border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c] transition text-left"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>上一篇</span>
                    </div>
                    <div className="mt-1 font-semibold text-xs text-[#faf9f5] truncate w-full">
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
                    className="flex flex-col items-end p-3.5 rounded-md border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c] transition text-right"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <span>下一篇</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                    <div className="mt-1 font-semibold text-xs text-[#faf9f5] truncate w-full">
                      {nextDoc.frontmatter.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Back to Top */}
              <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 font-mono">
                <div>
                  当前: <span className="text-[#faf9f5]">{currentDoc.frontmatter.title}</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-[#cc785c] hover:underline"
                >
                  回到顶部 ↑
                </button>
              </div>
            </div>

          </div>

          {/* ========================================== */}
          {/* 4. Right Column: TOC "本页内容" (Sticky)   */}
          {/* ========================================== */}
          <div className="hidden xl:block w-52 ml-8 sticky top-6 h-fit space-y-3">
            <div className="rounded-md border border-[#2e2b27] bg-[#181715] p-3.5 space-y-2.5">
              <div className="text-xs font-mono uppercase font-semibold text-[#faf9f5] pb-2 border-b border-[#2e2b27] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#cc785c]" />
                <span>本页内容</span>
              </div>

              {currentDoc.headings.length === 0 ? (
                <div className="text-xs text-neutral-500 font-sans">暂无子标题</div>
              ) : (
                <nav className="space-y-1 text-xs font-sans">
                  {currentDoc.headings.map((heading, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`w-full text-left py-0.5 text-neutral-400 hover:text-white transition block truncate ${
                        heading.level === 3 ? 'pl-2 text-neutral-500' : ''
                      }`}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              )}

              <div className="pt-2 border-t border-[#2e2b27]">
                <button
                  onClick={handleCopyGlobalConfig}
                  className="w-full flex items-center justify-center gap-1.5 rounded border border-[#2e2b27] bg-[#1f1e1b] py-1 text-xs text-neutral-300 hover:text-white hover:border-[#cc785c] transition font-mono"
                >
                  <Copy className="h-3 w-3" />
                  <span>{globalCopied ? '已复制' : '复制配置 JSON'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
