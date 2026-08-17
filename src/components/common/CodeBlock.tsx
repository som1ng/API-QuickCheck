import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'bash',
  title,
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const displayTitle = title || (language ? `${language}` : 'code');

  return (
    <div className="relative my-4 overflow-hidden rounded-lg border border-[#2e2b27] bg-[#141413]">
      {/* Sleek Terminal Header */}
      <div className="flex items-center justify-between border-b border-[#2e2b27] px-4 py-2 bg-[#181715]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#cc785c]" />
          <span className="text-xs font-mono text-[#a09d96] font-medium tracking-wide">
            {displayTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono uppercase text-[#6c6a64]">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs font-mono text-[#a09d96] hover:text-[#faf9f5] transition py-0.5 px-1.5 rounded hover:bg-[#252320]"
            title="复制命令"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-[#5db872]" />
                <span className="text-[#5db872] text-[11px]">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span className="text-[11px]">复制</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-[13px] text-[#faf9f5] leading-relaxed">
          {showLineNumbers ? (
            code.split('\n').map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-[#6c6a64] text-xs font-mono">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="table-cell">{line}</span>
              </div>
            ))
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
};
