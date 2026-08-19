import React, { useState, useEffect } from 'react';
import { AuditReportV4 } from '../../types/audit';
import {
  AuditHistoryItem,
  getAuditHistory,
  deleteAuditHistoryItem,
  clearAuditHistory,
  exportAuditReportToJson,
} from '../../engine/audit/auditHistory';
import {
  History,
  X,
  Trash2,
  Download,
  RotateCcw,
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: AuditReportV4) => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectReport,
}) => {
  const [historyList, setHistoryList] = useState<AuditHistoryItem[]>([]);

  const reloadHistory = () => {
    setHistoryList(getAuditHistory());
  };

  useEffect(() => {
    if (isOpen) {
      reloadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAuditHistoryItem(id);
    reloadHistory();
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清空所有历史检测记录吗？此操作不可撤销。')) {
      clearAuditHistory();
      reloadHistory();
    }
  };

  const handleExport = (report: AuditReportV4, e: React.MouseEvent) => {
    e.stopPropagation();
    exportAuditReportToJson(report);
  };

  const handleSelect = (report: AuditReportV4) => {
    onSelectReport(report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div
        className="w-full max-w-2xl bg-[#1b1a18] border border-[#2e2b27] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#2e2b27] bg-[#141413] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg sm:text-xl font-bold text-[#faf9f5]">历史检测记录</h3>
                <span className="px-2 py-0.5 rounded-md bg-[#252320] border border-[#3e3b35] text-xs font-semibold text-slate-200">
                  {historyList.length} 条
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                本地保存的协议基线审计快照，点击任意记录即可立即回溯全量图表
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {historyList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3e3b35] bg-[#22201d] hover:bg-[#2e2b27] text-xs font-medium text-slate-200 transition cursor-pointer shadow-sm hover:text-[#fda4af]"
                title="清空全部历史记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">清空全部</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-[#faf9f5] hover:bg-[#2e2b27] transition cursor-pointer"
              title="关闭窗口"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 bg-[#181715] flex-1">
          {historyList.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#22201d] border border-[#2e2b27] flex items-center justify-center mx-auto text-slate-500">
                <History className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-300">暂无历史检测记录</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                执行「基线协议审计」后，系统会自动在此处留档完整的测试证据与遥测图表。
              </p>
            </div>
          ) : (
            historyList.map((item) => {
              const isPass = item.score >= 80;
              const isDowngraded = item.conclusion === 'suspect_downgraded';

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.report)}
                  className="p-4 sm:p-5 rounded-xl border border-[#2e2b27] bg-[#141413] hover:bg-[#1f1e1b] hover:border-[#3e3b35] transition-all duration-200 cursor-pointer shadow-md group relative space-y-3"
                >
                  {/* Top Meta Line */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#cc785c]/15 text-[#cc785c] border border-[#cc785c]/30 text-xs font-semibold uppercase">
                        {item.provider}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Score Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase border shadow-sm ${
                          isPass
                            ? 'bg-[#5db872]/15 text-[#5db872] border-[#5db872]/30'
                            : isDowngraded
                            ? 'bg-[#c64545]/15 text-[#fda4af] border-[#c64545]/30'
                            : 'bg-[#e8a55a]/15 text-[#e8a55a] border-[#e8a55a]/30'
                        }`}
                      >
                        {isPass ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#5db872]" />
                        ) : isDowngraded ? (
                          <XCircle className="w-3.5 h-3.5 text-[#c64545]" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#e8a55a]" />
                        )}
                        <span>保真度 {item.score}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Middle Main Info */}
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-[#faf9f5] group-hover:text-[#cc785c] transition-colors">
                      {item.model}
                    </h4>
                    <p className="text-xs text-slate-300 font-sans truncate mt-0.5">
                      {item.baseUrl}
                    </p>
                  </div>

                  {/* Bottom Stats & Action Buttons */}
                  <div className="pt-2 border-t border-[#252320] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-xs font-sans text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#cc785c]" />
                        <span>通过: <strong className="text-[#faf9f5]">{item.passCount}/{item.totalCount}</strong></span>
                      </span>
                      {item.p50LatencyMs && (
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#e8a55a]" />
                          <span>P50: <strong className="text-slate-100">{item.p50LatencyMs} ms</strong></span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleExport(item.report, e)}
                        className="p-1.5 rounded-lg border border-[#3e3b35] bg-[#22201d] hover:bg-[#2e2b27] text-slate-300 hover:text-[#faf9f5] transition cursor-pointer shadow-sm"
                        title="导出为此条目的 JSON 报表"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg border border-[#3e3b35] bg-[#22201d] hover:bg-[#2e2b27] text-slate-400 hover:text-[#fda4af] transition cursor-pointer shadow-sm"
                        title="删除该条历史记录"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.report)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#b5654b] text-xs font-semibold text-[#faf9f5] transition cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>载入报告</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
