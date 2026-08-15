import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { runCapabilityProbes } from '../../engine/capability/probeRunner';
import { CapabilityMatrixResult } from '../../types/capability';
import { StatusBadge } from '../common/StatusBadge';
import { Cpu, Play, Loader2, Radio, Wrench, Eye, FileJson } from 'lucide-react';

export const CapabilityTab: React.FC = () => {
  const { config } = useApp().state;

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentProbe, setCurrentProbe] = useState<string>('');
  const [matrixResult, setMatrixResult] = useState<CapabilityMatrixResult | null>(null);

  const handleStartProbes = async () => {
    if (!config.baseUrl || !config.apiKey) {
      alert('请先在顶部配置中转站 Base URL 和 API Key');
      return;
    }

    setIsRunning(true);
    setCurrentProbe('正在初始化能力探针...');

    try {
      const res = await runCapabilityProbes(
        config.baseUrl,
        config.apiKey,
        config.selectedModel,
        (name) => setCurrentProbe(name)
      );
      setMatrixResult(res);
    } catch (err: unknown) {
      alert(`能力探针测试失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunning(false);
    }
  };

  const capabilities = matrixResult?.capabilities;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#5db8a6]/15 border border-[#5db8a6]/30 flex items-center justify-center text-[#5db8a6]">
                <Cpu className="w-5 h-5" />
              </div>
              <h2 className="font-serif-display text-2xl font-medium text-[#faf9f5] tracking-tight">
                高级特性与 Agent 兼容性探针
              </h2>
            </div>
            <p className="mt-1.5 text-sm text-[#9c9689] max-w-2xl leading-relaxed">
              自动化深度探测当前模型是否支持 SSE 流式传输、Tool Calling (函数调用)、Vision 多模态及 JSON Mode 结构化输出。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm font-mono text-[#9c9689] bg-[#23211e] px-4 py-2.5 rounded-lg border border-[#2e2b27]">
              目标: <span className="text-[#faf9f5] font-semibold">{config.selectedModel}</span>
            </div>

            <button
              onClick={handleStartProbes}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-lg bg-[#cc785c] hover:bg-[#d98266] active:bg-[#a9583e] px-5 py-2.5 text-sm font-medium text-[#faf9f5] shadow-sm transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  <span>探测中: {currentProbe}...</span>
                </>
              ) : (
                <>
                  <Play className="w-[18px] h-[18px] fill-[#faf9f5]" />
                  <span>开始能力测试</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Capability Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Streaming */}
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">SSE 流式传输 (Stream)</h4>
                  <p className="text-xs text-[#9c9689]">长连接实时流式 Chunk 接收支持</p>
                </div>
              </div>
              {capabilities?.stream ? (
                <StatusBadge status={capabilities.stream.status} />
              ) : (
                <span className="text-xs text-[#9c9689]">待测试</span>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe]">
              {capabilities?.stream?.details || '检测中转站网关是否放行 SSE 长连接，以及是否会被代理反代缓冲截断。'}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#9c9689] border-t border-[#2e2b27] pt-3">
            <span>响应延迟: {capabilities?.stream?.latencyMs ? `${capabilities.stream.latencyMs}ms` : '-'}</span>
            <span>打字机交互</span>
          </div>
        </div>

        {/* 2. Tool Calling */}
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#5db872]/10 text-[#5db872] border border-[#5db872]/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">Tool / Function Calling</h4>
                  <p className="text-xs text-[#9c9689]">Cline / Cursor / Claude Code 工具调用</p>
                </div>
              </div>
              {capabilities?.tools ? (
                <StatusBadge status={capabilities.tools.status} />
              ) : (
                <span className="text-xs text-[#9c9689]">待测试</span>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe]">
              {capabilities?.tools?.details || '发送标准 tools 参数测试包，检验网关是否会丢弃或破坏函数定义。'}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#9c9689] border-t border-[#2e2b27] pt-3">
            <span>响应延迟: {capabilities?.tools?.latencyMs ? `${capabilities.tools.latencyMs}ms` : '-'}</span>
            <span>Agent 终端与文件操作</span>
          </div>
        </div>

        {/* 3. Vision */}
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#5db8a6]/10 text-[#5db8a6] border border-[#5db8a6]/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">Vision 多模态视觉理解</h4>
                  <p className="text-xs text-[#9c9689]">Base64 / URL 图片理解与解析</p>
                </div>
              </div>
              {capabilities?.vision ? (
                <StatusBadge status={capabilities.vision.status} />
              ) : (
                <span className="text-xs text-[#9c9689]">待测试</span>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe]">
              {capabilities?.vision?.details || '发送 1x1 像素 Base64 测试图，检测模型及中转渠道的多模态输入能力。'}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#9c9689] border-t border-[#2e2b27] pt-3">
            <span>响应延迟: {capabilities?.vision?.latencyMs ? `${capabilities.vision.latencyMs}ms` : '-'}</span>
            <span>截图与多模态读取</span>
          </div>
        </div>

        {/* 4. JSON Mode */}
        <div className="rounded-xl border border-[#2e2b27] bg-[#1b1a18] p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#e8a55a]/10 text-[#e8a55a] border border-[#e8a55a]/20">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#faf9f5]">JSON Mode (结构化输出)</h4>
                  <p className="text-xs text-[#9c9689]">response_format: json_object 支持</p>
                </div>
              </div>
              {capabilities?.json ? (
                <StatusBadge status={capabilities.json.status} />
              ) : (
                <span className="text-xs text-[#9c9689]">待测试</span>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-[#23211e] border border-[#2e2b27] text-sm text-[#d4cebe]">
              {capabilities?.json?.details || '检测模型是否能按严格的 JSON 对象结构返回数据，防止解析崩溃。'}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-[#9c9689] border-t border-[#2e2b27] pt-3">
            <span>响应延迟: {capabilities?.json?.latencyMs ? `${capabilities.json.latencyMs}ms` : '-'}</span>
            <span>结构化数据提取</span>
          </div>
        </div>
      </div>
    </div>
  );
};
