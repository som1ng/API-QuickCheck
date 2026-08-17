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
      className="my-8 p-6 bg-[#181715] rounded-xl border border-[#2e2b27] flex justify-center items-center overflow-x-auto shadow-sm select-none"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};
