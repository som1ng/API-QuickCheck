import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

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

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#2e2b27] bg-[#141413] shadow-lg">
      {title && (
        <div className="flex items-center justify-between border-b border-[#2e2b27] px-4 py-2.5 bg-[#1b1a18]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#cc785c]" />
            <span className="text-xs font-mono text-[#d4cebe] font-medium">{title}</span>
          </div>
          <span className="text-[10px] font-mono uppercase text-[#9c9689]">{language}</span>
        </div>
      )}

      <div className="relative">
        <button
          onClick={handleCopy}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-[#2e2b27] bg-[#23211e] px-2.5 py-1.5 text-xs text-[#d4cebe] transition hover:bg-[#2b2926] hover:text-[#faf9f5] hover:border-[#cc785c]/40"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#5db872]" />
              <span className="text-[#5db872]">已复制</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>复制</span>
            </>
          )}
        </button>

        <pre className="overflow-x-auto p-4 font-mono text-xs text-[#faf9f5] leading-relaxed">
          {showLineNumbers ? (
            code.split('\n').map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-[#9c9689]/60">
                  {idx + 1}
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
