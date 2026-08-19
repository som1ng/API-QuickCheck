import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
  chart: string;
}

let mermaidInitialized = false;

function initMermaid() {
  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: 'dark',
      darkMode: true,
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      themeVariables: {
        darkMode: true,
        background: 'transparent',
        primaryColor: '#252320',
        primaryTextColor: '#faf9f5',
        primaryBorderColor: '#2e2b27',
        lineColor: '#cc785c',
        secondaryColor: '#181715',
        tertiaryColor: '#1f1e1b',
      },
    });
    mermaidInitialized = true;
  }
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    initMermaid();

    const renderChart = async () => {
      if (!chart.trim()) return;
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { svg } = await mermaid.render(uniqueId, chart);
        if (isMounted) {
          setSvgContent(svg);
          setHasError(false);
        }
      } catch (err) {
        console.warn('Mermaid rendering error:', err);
        // Clean up any error DOM elements injected by mermaid
        const el1 = document.getElementById(uniqueId);
        if (el1) el1.remove();
        const el2 = document.getElementById('d' + uniqueId);
        if (el2) el2.remove();
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (hasError) {
    return (
      <div className="my-8 p-6 bg-[#181715] rounded-xl border border-[#c64545]/30 text-xs font-mono text-[#a09d96] overflow-x-auto">
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`my-8 p-6 bg-[#181715] rounded-xl border border-[#2e2b27] flex justify-center items-center overflow-x-auto shadow-sm select-none min-h-[140px] transition-opacity duration-200 ${
        svgContent ? 'opacity-100' : 'opacity-40'
      }`}
      dangerouslySetInnerHTML={{ __html: svgContent || '<div class="text-xs text-[#a09d96] font-mono">加载架构图中...</div>' }}
    />
  );
};
