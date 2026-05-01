const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Terminal, Box, Check } from 'lucide-react';",
  "import { Settings2, Play, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap, Loader2, Info, Copy, Terminal, Box, Check, Database } from 'lucide-react';"
);

const new_quota = `                  <p className="text-sm opacity-90 leading-relaxed mb-1">
                    {status === 'success' ? \`你的 Key 可以正常使用。\` : errorMessage}
                  </p>
                  {status === 'success' && (
                    <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex-1 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex items-center shadow-inner">
                        <Zap className="w-4 h-4 text-emerald-400 mr-2 flex-shrink-0" />
                        <span className="text-xs text-emerald-500/90 font-medium">API 状态：<span className="text-emerald-400 font-bold ml-1">健康可用</span></span>
                      </div>
                      <div className="flex-1 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 flex items-center shadow-inner">
                        <Database className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0" />
                        <span className="text-xs text-blue-500/90 font-medium">当前额度：<span className="text-blue-400 font-bold ml-1">充沛 (未耗尽)</span></span>
                      </div>
                    </div>
                  )}
                </div>`;

code = code.replace(/<p className=\"text-sm opacity-90 leading-relaxed mb-1\">[\s\S]*?{status === 'success' \? `你的 Key 可以正常使用。` : errorMessage}[\s\S]*?<\/p>[\s\S]*?<\/div>/, new_quota);

const claudeRegex = /\{activeTab === 'Claude Code' && \([\s\S]*?(<\/>\s*\)\})/;
const match = code.match(claudeRegex);
if (match) {
  const newClaudeBlock = `{activeTab === 'Claude Code' && (
                    <div className="relative group animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 shadow-lg animate-in slide-in-from-top-2">
                          <h4 className="text-sm font-bold text-blue-400 flex items-center mb-2">
                            <Box className="w-5 h-5 mr-2 flex-shrink-0" />
                            统一本地网关模式（基于 LiteLLM）
                          </h4>
                          <p className="text-xs text-blue-300/90 leading-relaxed">
                            为了保证跨平台模型协议的绝对兼容性，避免复杂的手动 JSON 配置。我们采用 LiteLLM 作为本地网关，无论测试什么平台，只需按以下三步【无脑复制】即可完美驱动 Claude Code。
                          </p>
                        </div>

                        {/* Step 1 */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                          <h5 className="text-sm font-semibold text-slate-200 mb-2 flex items-center"><span className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded mr-2 text-xs">第一步</span> 环境大扫除（防劫持排雷）</h5>
                          <p className="text-xs text-slate-400 mb-3">说明：清理可能被第三方工具篡改的隐藏配置或环境变量。</p>
                          
                          <div className="flex gap-2 mb-2">
                            <button onClick={() => setShellType('bash')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'bash' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>Bash / Zsh</button>
                            <button onClick={() => setShellType('ps')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'ps' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>PowerShell</button>
                          </div>
                          <div className="relative">
                            <div className="absolute right-2 top-2 z-10">
                              <CopyButton text={shellType === 'bash' 
                                ? \`unset ANTHROPIC_AUTH_TOKEN\\nexport NO_PROXY="127.0.0.1,localhost,0.0.0.0"\` 
                                : \`Remove-Item Env:\\\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"\`} />
                            </div>
                            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
                              {shellType === 'bash' ? (
                                <code>
                                  <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\\n'}
                                  <span className="text-purple-400">export</span> NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                                </code>
                              ) : (
                                <code>
                                  <span className="text-slate-500"># Windows</span>{'\\n'}
                                  <span className="text-emerald-400">Remove-Item</span> Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\\n'}
                                  <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                                </code>
                              )}
                            </pre>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                          <h5 className="text-sm font-semibold text-slate-200 mb-2 flex items-center"><span className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded mr-2 text-xs">第二步</span> 启动万能翻译官 (LiteLLM)</h5>
                          <p className="text-xs text-slate-400 mb-3">说明：让代理工具在后台帮你将协议翻译成 Claude 能懂的语言。<span className="text-amber-400 font-bold">请勿关闭此窗口！</span></p>
                          
                          <div className="flex gap-2 mb-2">
                            <button onClick={() => setShellType('bash')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'bash' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>Bash / Zsh</button>
                            <button onClick={() => setShellType('ps')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'ps' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>PowerShell</button>
                          </div>
                          <div className="relative">
                            <div className="absolute right-2 top-2 z-10"><CopyButton text={shellType === 'bash' 
                              ? \`export \${litellmEnvKey}="\${apiKey}"\\nlitellm --model \${litellmDefaultModel} --api_base \${customBaseUrl.replace(/\\/$/, '')} --drop_params\` 
                              : \`$env:\${litellmEnvKey}="\${apiKey}"\\nlitellm --model \${litellmDefaultModel} --api_base \${customBaseUrl.replace(/\\/$/, '')} --drop_params\`} /></div>
                            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
                              {shellType === 'bash' ? (
                                <code>
                                  <span className="text-purple-400">export</span> {litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\\n'}
                                  <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\\/$/, '')}</span> --drop_params
                                </code>
                              ) : (
                                <code>
                                  <span className="text-purple-400">$env:</span>{litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\\n'}
                                  <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\\/$/, '')}</span> --drop_params
                                </code>
                              )}
                            </pre>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-4">
                          <h5 className="text-sm font-semibold text-slate-200 mb-2 flex items-center"><span className="bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded mr-2 text-xs">第三步</span> 启动 Claude Code</h5>
                          <p className="text-xs text-slate-400 mb-3">说明：打开一个<span className="text-emerald-400 font-bold">【全新】</span>的终端窗口，粘贴以下命令。</p>
                          
                          <div className="flex gap-2 mb-2">
                            <button onClick={() => setShellType('bash')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'bash' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>Bash / Zsh</button>
                            <button onClick={() => setShellType('ps')} className={\`px-2 py-1 text-[10px] rounded transition-colors \${shellType === 'ps' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}\`}>PowerShell</button>
                          </div>
                          <div className="relative">
                            <div className="absolute right-2 top-2 z-10">
                              <CopyButton text={shellType === 'bash' 
                                ? \`export ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\\nexport ANTHROPIC_API_KEY="sk-litellm"\\nclaude\`
                                : \`$env:ANTHROPIC_BASE_URL="http://127.0.0.1:4000"\\n$env:ANTHROPIC_API_KEY="sk-litellm"\\nclaude\`
                              } />
                            </div>
                            <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 overflow-x-auto custom-scrollbar">
                              {shellType === 'bash' ? (
                                <code>
                                  <span className="text-purple-400">export</span> ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\\n'}
                                  <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\\n'}
                                  <span className="text-emerald-400">claude</span>
                                </code>
                              ) : (
                                <code>
                                  <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://127.0.0.1:4000"</span>{'\\n'}
                                  <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\\n'}
                                  <span className="text-emerald-400">claude</span>
                                </code>
                              )}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  `;
  code = code.replace(claudeRegex, newClaudeBlock);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
  console.log('Success');
} else {
  console.log('Failed Regex');
}
