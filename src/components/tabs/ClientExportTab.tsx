import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useApp } from '../../context/AppContext';
import { CodeBlock } from '../common/CodeBlock';
import { MermaidBlock } from '../common/MermaidBlock';
import {
  loadAllDocs,
  interpolateDocVariables,
  slugifyHeading,
  MarkdownDoc,
} from '../../content/docsEngine';
import {
  ChevronRight,
  ChevronDown,
  Search,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  RefreshCw,
} from 'lucide-react';
import { fetchLatestFrontierModels } from '../../engine/baselines/modelSyncService';

const getNodeText = (node: any): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (node && typeof node === 'object' && node.props && node.props.children) {
    return getNodeText(node.props.children);
  }
  return '';
};

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
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Left sidebar sliding indicator refs and position state (like top header navbar)
  const sidebarNavRef = useRef<HTMLDivElement>(null);
  const docItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [sidebarPill, setSidebarPill] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    top: 0,
    left: 12,
    width: 0,
    height: 34,
    opacity: 0,
  });

  // Dynamic overrides for baseline doc when manually synced in-browser
  const [syncedDocContent, setSyncedDocContent] = useState<string | null>(() => {
    try {
      return localStorage.getItem('aqc_cached_frontier_models_doc');
    } catch {
      return null;
    }
  });
  const [isSyncingModels, setIsSyncingModels] = useState<boolean>(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

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

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Current active doc with safe fallback
  const currentDoc: MarkdownDoc = useMemo(() => {
    const found = allDocs.find((d) => d.slug === activeSlug);
    if (found) return found;
    if (allDocs.length > 0) return allDocs[0];
    return {
      slug: 'about',
      filePath: './docs/01-intro/about.md',
      frontmatter: {
        title: '关于 API-QuickCheck',
        category: 'intro',
        categoryTitle: '简介',
        categoryTag: '简介',
        subtitle: '面向现代 AI 中转站的真伪鉴别与性能基准',
        order: 1,
      },
      content: '# 关于 API-QuickCheck\n\n欢迎使用 API-QuickCheck 文档中心。',
      headings: [],
    };
  }, [allDocs, activeSlug]);

  const updateSidebarPill = useCallback(() => {
    const activeEl = docItemRefs.current[activeSlug];
    const container = sidebarNavRef.current;
    if (activeEl && container) {
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
      const relativeLeft = activeRect.left - containerRect.left + container.scrollLeft;
      setSidebarPill({
        top: relativeTop,
        left: relativeLeft,
        width: activeRect.width,
        height: activeRect.height || 34,
        opacity: 1,
      });
    } else {
      setSidebarPill((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeSlug]);

  useEffect(() => {
    updateSidebarPill();
    const raf = requestAnimationFrame(updateSidebarPill);
    const timer = setTimeout(updateSidebarPill, 40);
    window.addEventListener('resize', updateSidebarPill);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', updateSidebarPill);
    };
  }, [updateSidebarPill, collapsedCategories, searchQuery]);

  const isBaselineDoc = useMemo(() => {
    return (
      currentDoc.slug.includes('frontier-model-baseline') ||
      currentDoc.frontmatter.title.includes('前沿模型基线')
    );
  }, [currentDoc]);

  const handleManualSyncModels = async () => {
    setIsSyncingModels(true);
    setSyncStatusMessage(null);
    try {
      const result = await fetchLatestFrontierModels();
      setSyncedDocContent(result.rawMarkdown);
      try {
        localStorage.setItem('aqc_cached_frontier_models_doc', result.rawMarkdown);
      } catch {
        /* ignore */
      }
      setSyncStatusMessage(`已同步 ${result.totalModels} 个前沿模型 (${result.updatedAt})`);
      setTimeout(() => setSyncStatusMessage(null), 4000);
    } catch (err: unknown) {
      alert(`同步失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncingModels(false);
    }
  };

  // Context interpolated markdown content
  const interpolatedContent = useMemo(() => {
    if (!currentDoc) return '';
    const rawContent = (isBaselineDoc && syncedDocContent) ? syncedDocContent : currentDoc.content;
    return interpolateDocVariables(rawContent, {
      baseUrl: config.baseUrl || 'https://api.openai.com/v1',
      apiKey: config.apiKey || 'sk-your-api-key-here',
      model: config.selectedModel || 'claude-3-7-sonnet-20250219',
    });
  }, [currentDoc, isBaselineDoc, syncedDocContent, config.baseUrl, config.apiKey, config.selectedModel]);

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
  };

  const scrollToHeading = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      const yOffset = -70;
      const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  if (!currentDoc) {
    return <div className="p-12 text-slate-400 font-mono text-xs">暂无可用文档</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#141413]">
      
      {/* Full-width 3-Column Developer Layout */}
      <div className="flex-1 flex w-full relative">
        
        {/* ========================================== */}
        {/* 1. Left Sidebar: Fixed at top-[52px]       */}
        {/* ========================================== */}
        <aside className="w-64 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] border-r border-[#2e2b27] bg-[#181715] flex flex-col z-20 select-none">
          {/* Minimal Search Input */}
          <div className="p-3 border-b border-[#2e2b27]">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6c6a64] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文档..."
                className="w-full h-8 rounded bg-[#141413] border border-[#2e2b27] pl-8 pr-14 text-xs text-[#faf9f5] placeholder-[#6c6a64] focus:border-[#cc785c] focus:outline-none transition font-sans"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#a09d96] hover:text-[#faf9f5] px-1 pointer-events-auto"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-[10px] font-mono text-[#a09d96] bg-[#252320] px-1.5 py-0.5 rounded border border-[#2e2b27] leading-none select-none">
                    Ctrl K
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Category Groups with Sliding Capsule Indicator */}
          <div
            ref={sidebarNavRef}
            className="flex-1 overflow-y-auto px-3 py-4 space-y-4 relative"
          >
            {/* Silky Sliding Active Pill Indicator (Hardware Transform translate3d) */}
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 rounded-lg bg-[#252320] border-l-[3px] border-[#cc785c] border-r border-t border-b border-[#36332e] shadow-[0_2px_12px_rgba(0,0,0,0.5)] pointer-events-none transition-all duration-200 ease-out z-0"
              style={{
                transform: `translate3d(${sidebarPill.left}px, ${sidebarPill.top}px, 0)`,
                width: `${sidebarPill.width}px`,
                height: `${sidebarPill.height}px`,
                opacity: sidebarPill.opacity,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Amber active glow marker */}
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#cc785c] shadow-[0_0_6px_#cc785c]" />
            </span>

            {filteredCategoryGroups.map((group) => {
              const isCollapsed = Boolean(collapsedCategories[group.id]);

              return (
                <div key={group.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[13px] font-sans font-semibold text-[#faf9f5] hover:text-[#cc785c] transition rounded cursor-pointer select-none"
                  >
                    <span className="truncate tracking-tight">{group.title}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-[#a09d96] transition-transform duration-200 ${
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
                            ref={(el) => { docItemRefs.current[doc.slug] = el; }}
                            type="button"
                            onClick={() => navigateToDoc(doc.slug)}
                            className={`w-full relative z-10 flex items-center justify-between px-3 h-[34px] rounded-lg text-[13px] font-sans text-left transition-colors duration-200 cursor-pointer ${
                              isActive
                                ? 'text-[#faf9f5] font-semibold'
                                : 'text-[#a09d96] hover:text-[#faf9f5] hover:bg-[#1f1e1b]/40'
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
        </aside>

        {/* ========================================== */}
        {/* 2. Center Column: Main Article Body        */}
        {/* ========================================== */}
        <main className="flex-1 min-w-0 flex justify-center py-10 px-8 sm:px-12 lg:px-16 bg-[#141413]">
          
          {/* Silky Keyed Slide-Fade-In Animation on Article Switching */}
          <div
            key={currentDoc.slug}
            className="w-full max-w-4xl space-y-8 min-w-0 doc-transition-enter"
          >
            
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#a09d96] font-sans">
              <span
                className="hover:text-[#faf9f5] cursor-pointer"
                onClick={() => navigateToDoc(allDocs[0].slug)}
              >
                文档
              </span>
              <ChevronRight className="h-3 w-3 text-[#6c6a64]" />
              <span className="text-[#a09d96]">{currentDoc.frontmatter.categoryTitle}</span>
              <ChevronRight className="h-3 w-3 text-[#6c6a64]" />
              <span className="text-[#faf9f5] font-medium">{currentDoc.frontmatter.title}</span>
            </div>

            {/* Document Header with Top-Right Manual Sync Action */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#2e2b27]">
              <div className="space-y-2 flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#faf9f5] tracking-tight font-sans">
                  {currentDoc.frontmatter.title}
                </h1>

                {currentDoc.frontmatter.subtitle && (
                  <p className="text-[15px] text-[#a09d96] leading-relaxed font-sans pt-1">
                    {currentDoc.frontmatter.subtitle}
                  </p>
                )}
              </div>

              {/* Manual Sync Button for Frontier Baseline Document */}
              {isBaselineDoc && (
                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={handleManualSyncModels}
                    disabled={isSyncingModels}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#252320] hover:bg-[#2e2b27] border border-[#2e2b27] hover:border-[#cc785c]/60 text-xs font-semibold text-[#faf9f5] transition smooth-btn shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#cc785c] ${isSyncingModels ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    <span>{isSyncingModels ? '正在从权威源同步...' : '手动更新最新基线'}</span>
                  </button>
                  {syncStatusMessage && (
                    <span className="text-[11px] font-mono text-[#5db872] animate-in fade-in">
                      ✓ {syncStatusMessage}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Markdown Body Renderer */}
            <article className="prose prose-invert max-w-none text-[#d5d1c8] font-sans text-[15px] leading-[1.8]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  h2: ({ children }) => {
                    const text = getNodeText(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2
                        id={id}
                        className="text-xl font-bold text-[#faf9f5] tracking-tight pt-8 pb-2 border-b border-[#2e2b27] mt-8 mb-4 font-sans"
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = getNodeText(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3
                        id={id}
                        className="text-base font-bold text-[#faf9f5] pt-4 mt-6 mb-2 font-sans"
                      >
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="my-3.5 text-[#d5d1c8] leading-[1.8]">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 text-[15px] text-[#d5d1c8] pl-2 my-4">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 text-[15px] text-[#d5d1c8] pl-2 my-4">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed text-[#d5d1c8]">{children}</li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="rounded-md border-l-2 border-[#cc785c] bg-[#1f1e1b] pl-4 pr-3 py-2.5 text-[14px] text-[#d5d1c8] my-5 not-italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 w-full overflow-x-auto rounded-xl border border-[#2e2b27] bg-[#181715] shadow-sm">
                      <table className="w-full text-left text-sm border-collapse font-sans">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[#252320] border-b border-[#2e2b27] text-[#faf9f5] font-semibold font-sans">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-[#2e2b27]/60 bg-transparent font-sans">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-[#1f1e1b] transition-colors">{children}</tr>
                  ),
                  th: ({ children }) => (
                    <th className="py-3 px-4 text-sm font-semibold text-[#faf9f5] text-left font-sans">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="py-3.5 px-4 text-sm text-[#d5d1c8] border-b border-[#2e2b27]/40 leading-relaxed font-sans">{children}</td>
                  ),
                  img: ({ src, alt, ...props }) => (
                    <img
                      src={src}
                      alt={alt || '架构图'}
                      className="my-8 mx-auto rounded-xl border border-[#2e2b27] shadow-2xl block max-w-full"
                      {...props}
                    />
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-[#252320] border border-[#2e2b27] px-1.5 py-0.5 text-xs font-mono text-[#cc785c]"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    if (match && match[1] === 'mermaid') {
                      return <MermaidBlock chart={String(children).replace(/\n$/, '')} />;
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
            <div className="pt-10 border-t border-[#2e2b27] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {prevDoc ? (
                  <button
                    type="button"
                    onClick={() => navigateToDoc(prevDoc.slug)}
                    className="flex flex-col items-start p-4 rounded-lg border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c]/60 hover:bg-[#252320] transition text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-[#a09d96]">
                      <ArrowLeft className="h-3 w-3" />
                      <span>上一篇</span>
                    </div>
                    <div className="mt-1 font-sans text-xs text-[#faf9f5] font-medium truncate w-full">
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
                    className="flex flex-col items-end p-4 rounded-lg border border-[#2e2b27] bg-[#181715] hover:border-[#cc785c]/60 hover:bg-[#252320] transition text-right cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-[#a09d96]">
                      <span>下一篇</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <div className="mt-1 font-sans text-xs text-[#faf9f5] font-medium truncate w-full">
                      {nextDoc.frontmatter.title}
                    </div>
                  </button>
                ) : (
                  <div />
                )}
              </div>

              {/* Back to Top */}
              <div className="flex items-center justify-between text-xs text-[#a09d96] pt-4 font-mono">
                <div>
                  <span className="text-[#faf9f5]">{currentDoc.frontmatter.title}</span>
                </div>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-[#cc785c] hover:underline cursor-pointer"
                >
                  回到顶部 ↑
                </button>
              </div>
            </div>

          </div>

        </main>

        {/* ========================================== */}
        {/* 3. Far Right Column: TOC (Fixed Spacing)   */}
        {/* ========================================== */}
        <aside className="hidden xl:flex w-64 shrink-0 pt-10 pb-10 pr-8 pl-5 flex-col sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto border-l border-[#2e2b27] select-none bg-[#181715]/40">
          <div className="space-y-3.5">
            <div className="text-[15px] font-sans font-bold text-[#faf9f5] flex items-center gap-2 tracking-tight">
              <AlignLeft className="w-4 h-4 text-[#cc785c]" />
              <span>本页目录</span>
            </div>

            {currentDoc.headings.length === 0 ? (
              <div className="text-xs text-[#6c6a64] font-sans">暂无子标题</div>
            ) : (
              <nav className="space-y-1 text-[13px] font-sans">
                {currentDoc.headings.map((heading, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToHeading(heading.id)}
                    className={`w-full text-left py-1 text-[#a09d96] hover:text-[#faf9f5] transition block truncate leading-snug cursor-pointer ${
                      heading.level === 3 ? 'pl-3 text-xs text-[#6c6a64] hover:text-[#a09d96]' : 'text-[13px]'
                    }`}
                  >
                    {heading.text}
                  </button>
                ))}
              </nav>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
};

