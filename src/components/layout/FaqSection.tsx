import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: React.ReactNode;
}

const FAQ_BY_TAB: Record<string, FaqItem[]> = {
  // 1. Home: 中转站综合检测 (全方位真伪鉴别与协议审计指南)
  home: [
    {
      question: '点击「拉取模型列表」失败或报错常见原因有哪些？该如何排查与解决？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            拉取模型依赖中转站开放的 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1.5 py-0.5 rounded border border-[#2e2b27]">/v1/models</code> 标准端点。若遇到拉取异常，请对照以下 4 种常见场景排查：
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong className="text-amber-400 font-semibold">401 Unauthorized / 无效密钥</strong>：API Key 填写有误、密钥已过期、账户余额不足，或该 Key 在中转站后台未分配默认模型分组权限。
            </li>
            <li>
              <strong className="text-amber-400 font-semibold">404 Not Found / 端点未开放</strong>：部分自建轻量反代或专用网关未实现 <code className="text-slate-100 font-mono">/v1/models</code> 路由。<strong>此时无需依赖拉取，直接在输入框中手动键入模型 ID（如 <code className="text-slate-100 font-mono">gpt-4o</code>、<code className="text-slate-100 font-mono">claude-3-7-sonnet</code>、<code className="text-slate-100 font-mono">gemini-2.0-flash</code>）即可正常开始测试</strong>。
            </li>
            <li>
              <strong className="text-amber-400 font-semibold">CORS 跨域或浏览器安全策略拦截</strong>：纯前端直接向未配置 <code className="text-slate-100 font-mono">Access-Control-Allow-Origin: *</code> 的第三方私有站点发起跨域请求时可能被浏览器阻断，建议核对中转站 CORS 设置。
            </li>
            <li>
              <strong className="text-amber-400 font-semibold">502 Bad Gateway / 504 Timeout</strong>：中转站上游网络出现阻塞或网关过载，可稍等数秒后再次点击「重新拉取」。
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: '如何排查中转站是否存在偷换开源模型、逆向套壳或以次充好行为？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            通过比对大模型底层专有响应指纹与通信协议结构。正版官方模型在元数据结构、Token 计数规则、逻辑极限边界以及专有加密签名上具有唯一性；若中转站将请求转发至开源模型再行封装，其内在特征在多维交叉探针下会暴露出断层。
          </p>
          <p>
            系统通过 <strong className="text-amber-400 font-semibold">官方私钥签名验真 (Thinking Signature)</strong>、<strong className="text-amber-400 font-semibold">原生思维链 Delta 实时提取</strong>、<strong className="text-amber-400 font-semibold">知识库截止期探针</strong> 与 <strong className="text-amber-400 font-semibold">空间几何多维逻辑探针</strong> 进行全自动化交叉验证。
          </p>
        </div>
      ),
    },
    {
      question: '什么是官方签名验真 (Thinking Signature)？为什么中转站无法伪造它？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            官方厂商在旗舰推理大模型的思维链流式响应中引入了非对称加密签名体系（<code className="text-amber-300 font-mono font-medium bg-[#252320] px-1.5 py-0.5 rounded border border-[#2e2b27]">signature</code> 字段）。
          </p>
          <p>
            该签名由官方内部专属私钥对思维链内容进行密码学哈希签名。任何第三方中转站如果使用开源模型或逆向网页端进行套壳伪装，由于无法获取官方私钥，必然无法产出受官方公钥认可的合法签名，这是判定官方正品的最硬核证据之一。
          </p>
        </div>
      ),
    },
    {
      question: '保真指数评分区间是如何划分的？各分段代表什么具体风险？',
      answer: (
        <div className="space-y-2 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>保真指数评分体系定义如下：</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <span className="text-[#5db872] font-mono font-semibold">85 ~ 100 分 (高保真官方正品)</span>：加密签名、专有元数据与深层逻辑探针全部通过，延迟符合直连标准；
            </li>
            <li>
              <span className="text-[#e8a55a] font-mono font-semibold">50 ~ 84 分 (存在可疑项/协议漂移)</span>：缺少关键签名、思维链格式被中继截断、首字响应延迟严重偏高或 Token 计费字段不标准；
            </li>
            <li>
              <span className="text-[#c64545] font-mono font-semibold">0 ~ 49 分 (严重降级/逆向套壳)</span>：模型知识截止期或逻辑能力测试失败，存在严重的开源模型冒充、网页逆向或以次充好行为。
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: '为什么有的中转站返回 HTTP 200，但实际是网页逆向 (Web-to-API) 冒充？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            部分中转站使用自动化脚本模拟网页版账号，并将其包装为标准 REST API 售卖。这类接口表面上能够返回答案，但存在严重缺陷：
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>缺少官方原生流式 SSE 事件分块规范（例如缺少 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">message_start</code>、<code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">content_block_delta</code> 事件）；</li>
            <li>无法返回精准的 Token 计费元数据（<code className="text-slate-100 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">usage.prompt_tokens</code> 为虚拟伪造数值）；</li>
            <li>并发稍高时极易触发 Cloudflare 验证码或频发 504 Gateway Timeout 超时。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '什么是协议漂移 (Protocol Drift)？对智能编码与 Agent 工具有何影响？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            部分中转站为了简化后端网关逻辑，将专用模型协议暴力转译为通用 OpenAI 格式后再二次封装。这种非原生代理往往会导致：
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong className="text-slate-100 font-semibold">工具调用 (Tool Call) 丢参</strong>：Agent 无法正确解析函数参数 JSON，导致代码编写或文件修改进入死循环；</li>
            <li><strong className="text-slate-100 font-semibold">思维链断裂</strong>：思考过程与最终输出混杂在同一个文本流中，破坏代码助手的多轮对话状态机；</li>
            <li><strong className="text-slate-100 font-semibold">上下文缓存失效</strong>：无法透传 Prompt Cache 标记，导致 Agent 每轮对话都在重复全额计费。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '如何检测中转站是否偷偷注入了 System 提示词或启用了响应缓存劫持？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            系统内建了多项防污染与逆向探针：
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong className="text-slate-100 font-semibold">前置注入检测</strong>：发送隔离测试指令，探测中转站网关是否在用户请求前私自拼接了推广前缀、安全过滤规则或重定向指令；</li>
            <li><strong className="text-slate-100 font-semibold">动态熵值与去缓存探针</strong>：注入高熵随机数与零温度系数，若对端返回了高度一致的历史快照，则可判断中转站启用了高风险的语义缓存劫持。</li>
          </ul>
        </div>
      ),
    },
    {
      question: 'TTFT 与 TPS 延迟指标的行业参考范围是多少？',
      answer: (
        <div className="space-y-2 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            <strong className="text-slate-100 font-semibold">TTFT (Time To First Token) 首字延迟</strong>：
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li><span className="text-[#5db872] font-mono font-semibold">&lt; 600ms</span>：优秀直连响应，网关无排队；</li>
            <li><span className="text-[#e8a55a] font-mono font-semibold">600 ~ 1500ms</span>：正常中转链路开销；</li>
            <li><span className="text-[#c64545] font-mono font-semibold">&gt; 2000ms</span>：说明上游存在严重拥塞、账号池排队或使用了低速逆向通道。</li>
          </ul>
          <p className="pt-1">
            <strong className="text-slate-100 font-semibold">TPS (Tokens Per Second) 流式吞吐速率</strong>：主流旗舰模型通常在 40~90 tokens/s 区间，轻量型高并发模型可达 100~300+ tokens/s。
          </p>
        </div>
      ),
    },
    {
      question: '中转站动态降级检测的原理是什么？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            部分劣质中转站在遇到用户并发请求或高峰期算力不足时，会自动在网关层将高成本的顶级旗舰模型悄悄路由至低成本的小模型或廉价开源蒸馏模型。
          </p>
          <p>
            系统通过对特定推理边界题目的多轮瞬时探测，能够准确抓取在并发负载下模型输出指纹的漂移与降级迹象。
          </p>
        </div>
      ),
    },
  ],

  // 2. API KEY 批量检测
  quickping: [
    {
      question: '批量测活会消耗很多 API Key 额度或 Token 吗？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            <strong className="text-emerald-400 font-semibold">几乎零消耗</strong>。引擎采用了分层极轻量探针机制：
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong className="text-slate-100 font-semibold">第一层（优先）</strong>：向 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">/v1/models</code> 发起模型鉴权探针，消耗 <strong className="text-emerald-400 font-mono font-semibold">0 Tokens (完全免费)</strong>；
            </li>
            <li>
              <strong className="text-slate-100 font-semibold">第二层（回退）</strong>：若端点未开放模型列表，则自动回退至最小 Chat Completion 请求（Prompt 为 <code className="text-slate-100 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">"hi"</code> 配合 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">max_tokens: 1</code>），全过程仅消耗约 <strong className="text-emerald-400 font-mono font-semibold">1~2 tokens</strong>（单次成本低于 $0.000001），在准确穿透鉴权的同时最大化节省您的额度。
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: '输入格式支持哪些？如何从代码、JSON 或杂乱表格中直接提取 Key？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            无需手动整理格式。内置工业级智能文本清洗引擎，支持直接将混乱的文本、日志或表格直接粘贴或拖拽上传：
          </p>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>支持多行换行、逗号、分号分割；</li>
            <li>支持从带有 <code className="text-slate-100 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">sk-...</code> / <code className="text-slate-100 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">key:...</code> 前缀、JSON 键值对数组、CSV 导出表格某列中自动提取；</li>
            <li>自动去除首尾空白符与无效注释，并对批次内的<strong>重复 Key 进行自动隔离与计数</strong>。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '如何配置并发线程与防封延时，避免触发 429 限流或 WAF 封锁？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>在齿轮【参数配置】弹窗中提供了 3 档预设策略及自定义调节：</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li>
              <strong className="text-emerald-400 font-semibold">安全防封 (2 线程 + 250ms 延时)</strong>：针对公共中转站或带 Cloudflare WAF 的严苛节点，温和渐进，模拟人类请求节奏；
            </li>
            <li>
              <strong className="text-amber-400 font-semibold">标准平衡 (5 线程 + 50ms 延时)</strong>：默认推荐，兼顾检测速度与抗封穿透能力；
            </li>
            <li>
              <strong className="text-[#cc785c] font-semibold">极速清洗 (10~50 线程 + 0ms 延时)</strong>：针对自建独享节点或本地高并发网关，极速完成万级 Key 池清洗；
            </li>
            <li>
              系统内建 <strong className="text-slate-100 font-semibold">±25% 随机抖动 (Jitter Delay)</strong>，打破周期性机器请求特征，防止被对端网关识别为脚本攻击。
            </li>
          </ul>
        </div>
      ),
    },
    {
      question: '自动穿透嗅探余额/额度支持哪些中转面板与平台？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            开启【自动穿透嗅探余额/额度】后，系统在 Key 有效的前提下，自动向常见管理面板路由发起账单探针：
          </p>
          <p>
            支持覆盖 <strong className="text-slate-100 font-semibold">OneAPI、NewAPI、DoneAPI、V3Panel、VOAPI 及官方 Billing 订阅接口</strong>，自动解析并呈现剩余额度、已用额度及货币单位（如 <code className="text-emerald-400 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">$5.20</code> 或 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">500,000 点</code>）。
          </p>
        </div>
      ),
    },
    {
      question: '为什么有的中转站用 auto 测活失败，需要在参数中探测具体模型？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>
            部分中转站出于路由分流考虑，关闭了默认模型的重定向或未开通通用别名。
          </p>
          <p>
            此时只需打开【参数配置】弹窗，点击【探测可用模型】按钮，系统会即时获取该站点实际对您授权开放的模型清单（如当前服务商开放的任意可用模型 ID），点击任一可用模型即可精准完成测活。
          </p>
        </div>
      ),
    },
    {
      question: '检测结果支持导出哪些格式？如何导出仅存活的有效 Key？',
      answer: (
        <div className="space-y-2.5 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p>在检测完成后，点击右上角【导出报表】下拉菜单即可选择：</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong className="text-slate-100 font-semibold">导出纯 Key (.txt)</strong>：一键下载仅包含当前选定状态（如仅活跃/仅有效）的纯净换行 API Key 文本；</li>
            <li><strong className="text-slate-100 font-semibold">导出完整表格 (.csv)</strong>：包含序号、脱敏 Key、完整 Key、存活状态、延迟(ms)、余额明细与错误原因的完整表格（内嵌 UTF-8 BOM，Excel 打开不乱码）；</li>
            <li><strong className="text-slate-100 font-semibold">导出结构化报表 (.json)</strong>：导出包含检测时间戳、提供商元数据及完整测活指标的 JSON 报表。</li>
          </ul>
        </div>
      ),
    },
    {
      question: '我的 API Key 会被上传到后端服务器或第三方吗？',
      answer: (
        <div className="space-y-2 text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>100% 纯前端浏览器本地内存直连，绝不经过任何第三方服务器中转。</span>
          </p>
          <p>
            API-QuickCheck 采用无状态前端直连架构。所有网络请求均由您的浏览器直接发往所配置的目标 Base URL，无数据库、无中继、无收集。页面刷新或关闭后，浏览器内存中的密钥与检测数据将即刻彻底销毁。
          </p>
        </div>
      ),
    },
  ],

  // 3. 文档
  docs: [
    {
      question: '支持哪些主流 AI 客户端与 Agent 的配置导出？',
      answer: (
        <p className="text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          支持一键生成并复制适配主流 AI IDE、代码助手 CLI、跨平台客户端及标准环境变量模板。
        </p>
      ),
    },
    {
      question: '为什么部分客户端 Base URL 需带 /v1？',
      answer: (
        <p className="text-xs text-slate-200 leading-relaxed [transform:translateZ(0)] antialiased">
          不同工具客户端规范不同。例如部分开发工具需要以 <code className="text-amber-300 font-mono font-medium bg-[#252320] px-1 py-0.5 rounded border border-[#2e2b27]">/v1</code> 结尾，系统已自动按各大客户端最佳实践完成标准化适配。
        </p>
      ),
    },
  ],
};

export const FaqSection: React.FC = () => {
  const { state } = useApp();
  const { activeTab } = state;

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  let currentKey = 'home';
  if (activeTab === 'quickping') currentKey = 'quickping';
  else if (activeTab === 'docs' || activeTab === 'export') currentKey = 'docs';

  const currentFaqList = FAQ_BY_TAB[currentKey] || FAQ_BY_TAB.home;

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 pt-6 border-t border-[#2e2b27] [transform:translateZ(0)] antialiased">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#252320] border border-[#2e2b27] flex items-center justify-center text-[#cc785c] shadow-inner">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif-display text-lg font-bold text-slate-100 tracking-tight">
              常见问题解答
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 font-medium">
              {currentKey === 'quickping'
                ? 'API Key 批量测活原理、防封配置、余额嗅探与安全规范'
                : '真伪鉴别标准、大模型反套壳机制与性能评测指南'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-neutral-400 font-medium hidden sm:inline-block">
          共 {currentFaqList.length} 条解答
        </span>
      </div>

      {/* Accordion List with Silky Smooth Downward CSS Grid Expansion */}
      <div className="space-y-2.5">
        {currentFaqList.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-xl border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                isOpen
                  ? 'border-[#cc785c]/60 bg-[#1c1b18] ring-1 ring-[#cc785c]/25 shadow-lg shadow-black/30'
                  : 'border-[#2e2b27] bg-[#141413] hover:border-[#3d3a34] hover:bg-[#181715]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors duration-200 select-none group"
              >
                <span
                  className={`text-sm font-semibold transition-colors duration-200 pr-4 ${
                    isOpen ? 'text-amber-400' : 'text-slate-100 group-hover:text-amber-400/90'
                  }`}
                >
                  {item.question}
                </span>

                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen ? 'bg-[#cc785c]/20 text-amber-400 rotate-180' : 'text-neutral-400 group-hover:text-slate-100'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {/* Downward Smooth Grid Height Transition (Zero upward jumping) */}
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-1 border-t border-[#2e2b27]/60 [transform:translateZ(0)] antialiased">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

