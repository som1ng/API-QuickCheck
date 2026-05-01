const fs = require('fs');

const newReturnBlock = `  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-y-auto">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3 shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">
              API-QuickCheck
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-full border border-blue-100">v1.0</span>
            <a href="https://github.com/som1ng/API-QuickCheck" target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-24 pb-12 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
        
        {/* Header Text */}
        <div className="text-center mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">快速验证密钥并一键生成 Agent 配置</h1>
          <p className="text-gray-500 font-medium text-sm">无需后端，纯浏览器端运行，安全可靠不走漏 Key。</p>
        </div>

        {/* Card 1: Platform & Key Setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* Platform Selector */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">测试平台</label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white border border-gray-200 text-gray-900 rounded-lg py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                value={platformId}
                onChange={handlePlatformChange}
              >
                {PLATFORMS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Settings2 className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="mb-6">
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              <Settings2 className="w-4 h-4 mr-1" />
              {showAdvanced ? '收起高级设置' : '高级设置 (自定义 Base URL & 平台提示)'}
            </button>
            
            {showAdvanced && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-semibold text-gray-600 mb-2">接口地址 (Base URL)</label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-3 shadow-sm"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com"
                />
                
                <div className="flex items-center mb-4 mt-2">
                  <input
                    type="checkbox"
                    id="proxy-toggle"
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    checked={useProxy}
                    onChange={(e) => setUseProxy(e.target.checked)}
                  />
                  <label htmlFor="proxy-toggle" className="ml-2 text-sm font-medium text-gray-600 cursor-pointer select-none">
                    使用 CORS 代理转发请求 (支持绕过严格跨域限制)
                  </label>
                </div>
                {/* @ts-ignore */}
                {currentPlatform.helpText && (
                  <div className="flex items-start bg-blue-50 border border-blue-100 rounded-md p-3">
                    <Info className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      {/* @ts-ignore */}
                      {currentPlatform.helpText}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400 font-mono shadow-sm"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={currentPlatform.placeholder}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleTest}
            disabled={status === 'loading'}
            className="w-full relative overflow-hidden rounded-lg font-bold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-700 py-3.5 flex items-center justify-center"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                测试中...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" fill="currentColor" />
                开始测试
              </>
            )}
          </button>
        </div>

        {/* Results Area */}
        {status !== 'idle' && status !== 'loading' && (
          <div className={\`p-5 rounded-xl border shadow-sm animate-in zoom-in-95 duration-200 \${
            status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            status === 'error_cors' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-red-50 border-red-200 text-red-800'
          }\`}>
            <div className="flex items-start">
              {status === 'success' && <CheckCircle2 className="w-6 h-6 mr-3 flex-shrink-0 text-emerald-500" />}
              {(status === 'error_key' || status === 'error_quota' || status === 'error_other') && <XCircle className="w-6 h-6 mr-3 flex-shrink-0 text-red-500" />}
              {status === 'error_cors' && <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0 text-amber-500" />}
              
              <div className="w-full">
                <h3 className="font-bold mb-1 flex items-center justify-between text-base">
                  <span>
                    {status === 'success' ? '测试通过！' :
                     status === 'error_cors' ? '跨域拦截 / 网络不通' : '测试失败'}
                  </span>
                  {status === 'success' && delay !== null && (
                    <span className="text-xs font-mono opacity-90 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                      {delay}ms
                    </span>
                  )}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed mb-1">
                  {status === 'success' ? \`你的 Key 可以正常使用。\` : errorMessage}
                </p>
                {status === 'success' && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex-1 bg-white p-3 rounded-md border border-emerald-100 flex items-center shadow-sm">
                      <Zap className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-600 font-medium">API 状态：<span className="text-emerald-600 font-bold ml-1">健康可用</span></span>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-md border border-blue-100 flex items-center shadow-sm">
                      <Database className="w-4 h-4 text-blue-500 mr-2 flex-shrink-0" />
                      <span className="text-xs text-gray-600 font-medium">当前额度：<span className="text-blue-600 font-bold ml-1">充沛 (未耗尽)</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Model Probe & Agent Guide */}
        {status === 'success' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Models Area */}
            {availableModels !== null && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                  <Box className="w-5 h-5 mr-2 text-blue-500" />
                  可用模型探测 {availableModels.length > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({availableModels.length} 个)</span>}
                </h4>
                {availableModels.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {availableModels.map(m => (
                      <span key={m} className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 rounded-md border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-700 flex items-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0 text-amber-500" />
                    无法获取模型列表，请手动尝试在 Agent 中填写模型 ID
                  </p>
                )}
              </div>
            )}

            {/* Agent Guide */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 flex items-center text-base">
                  <Terminal className="w-5 h-5 mr-2 text-blue-600" />
                  Agent 一键接入指南
                </h3>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto custom-scrollbar px-2">
                {['Claude Code', 'OpenClaw', 'Cline / Roo Code'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={\`px-4 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap \${
                      activeTab === tab 
                        ? 'text-blue-600 border-blue-600 bg-white' 
                        : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100/50'
                    }\`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {customBaseUrl !== currentPlatform.defaultBaseUrl && (
                  <div className="mb-6 flex items-start bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed font-medium">
                      <span className="font-bold">⚠️ 检测到您使用的是非官方 API</span>，请务必在 Agent 设置中开启「自定义 Endpoint」功能（或修改 Base URL），否则将无法使用。
                    </p>
                  </div>
                )}

                {activeTab === 'Claude Code' && (
                  <div className="relative group animate-in fade-in duration-300">
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm animate-in slide-in-from-top-2">
                        <h4 className="text-sm font-bold text-blue-800 flex items-center mb-2">
                          <Box className="w-5 h-5 mr-2 flex-shrink-0" />
                          统一本地网关模式（基于 LiteLLM）
                        </h4>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          为了保证跨平台模型协议的绝对兼容性，避免复杂的手动 JSON 配置。我们采用 LiteLLM 作为本地网关，无论测试什么平台，只需按以下三步【无脑复制】即可完美驱动 Claude Code。
                        </p>
                      </div>

                      {/* Step 1 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第一步</span> 环境大扫除（防劫持排雷）</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：清理可能被第三方工具篡改的隐藏配置或环境变量。</p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? \`unset ANTHROPIC_AUTH_TOKEN\\nexport NO_PROXY="127.0.0.1,localhost,0.0.0.0"\` 
                              : \`Remove-Item Env:\\\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue\\n$env:NO_PROXY="127.0.0.1,localhost,0.0.0.0"\`} />
                          </div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">unset</span> ANTHROPIC_AUTH_TOKEN{'\\n'}
                                <span className="text-purple-400">export</span> NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            ) : (
                              <code>
                                <span className="text-gray-500"># Windows</span>{'\\n'}
                                <span className="text-emerald-400">Remove-Item</span> Env:\\ANTHROPIC_AUTH_TOKEN -ErrorAction SilentlyContinue{'\\n'}
                                <span className="text-purple-400">$env:</span>NO_PROXY=<span className="text-amber-300">"127.0.0.1,localhost,0.0.0.0"</span>
                              </code>
                            )}
                          </pre>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第二步</span> 启动万能翻译官 (LiteLLM)</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：让代理工具在后台帮你将协议翻译成 Claude 能懂的语言。<span className="text-amber-600 font-bold">请勿关闭此窗口！</span></p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10"><CopyButton text={shellType === 'bash' 
                            ? \`export \${litellmEnvKey}="\${apiKey}"\\npip install --upgrade "litellm[proxy]"\\nlitellm --model \${litellmDefaultModel} --api_base \${customBaseUrl.replace(/\\/$/, '')} --drop_params\` 
                            : \`$env:\${litellmEnvKey}="\${apiKey}"\\npip install --upgrade "litellm[proxy]"\\nlitellm --model \${litellmDefaultModel} --api_base \${customBaseUrl.replace(/\\/$/, '')} --drop_params\`} /></div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">export</span> {litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\\n'}
                                <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\\n'}
                                <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\\/$/, '')}</span> --drop_params
                              </code>
                            ) : (
                              <code>
                                <span className="text-purple-400">$env:</span>{litellmEnvKey}=<span className="text-amber-300">"{apiKey}"</span>{'\\n'}
                                <span className="text-purple-400">pip</span> install --upgrade <span className="text-amber-300">"litellm[proxy]"</span>{'\\n'}
                                <span className="text-purple-400">litellm</span> --model <span className="text-emerald-300">{litellmDefaultModel}</span> --api_base <span className="text-emerald-300">{customBaseUrl.replace(/\\/$/, '')}</span> --drop_params
                              </code>
                            )}
                          </pre>
                        </div>
                        
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                          <p className="text-xs text-amber-800 leading-relaxed space-y-1">
                            <span className="font-bold flex items-center"><Info className="w-3.5 h-3.5 mr-1" />常见排错：</span>
                            <span className="block">1. <span className="font-semibold text-amber-900">为什么加 --drop_params？</span> Claude 会发送特定的参数 (如 thinking)，DeepSeek 等模型不认识会报错 400，该标志能自动过滤多余参数。</span>
                            <span className="block">2. <span className="font-semibold text-amber-900">提示 No such option: --api_key？</span> 新版 LiteLLM 已弃用该启动参数，请务必先执行步骤一设置环境变量。</span>
                            <span className="block">3. <span className="font-semibold text-amber-900">报错 ModuleNotFoundError?</span> 请确保执行的是 <code>pip install --upgrade "litellm[proxy]"</code>，proxy 插件包含服务器所需的完整依赖。</span>
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-5">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center"><span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded mr-2 text-xs">第三步</span> 启动 Claude Code</h5>
                        <p className="text-xs text-gray-500 mb-3">说明：保持 LiteLLM 运行，打开一个<span className="text-emerald-600 font-bold">【全新】</span>的终端窗口，粘贴以下命令。</p>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={() => setShellType('bash')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'bash' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>Bash / Zsh</button>
                          <button onClick={() => setShellType('ps')} className={\`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors \${shellType === 'ps' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}\`}>PowerShell</button>
                        </div>
                        <div className="relative">
                          <div className="absolute right-2 top-2 z-10">
                            <CopyButton text={shellType === 'bash' 
                              ? \`export ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\\nexport ANTHROPIC_API_KEY="sk-litellm"\\nclaude\`
                              : \`$env:ANTHROPIC_BASE_URL="http://0.0.0.0:4000"\\n$env:ANTHROPIC_API_KEY="sk-litellm"\\nclaude\`
                            } />
                          </div>
                          <pre className="bg-gray-900 p-4 rounded-lg text-xs font-mono text-gray-200 border border-gray-800 overflow-x-auto custom-scrollbar">
                            {shellType === 'bash' ? (
                              <code>
                                <span className="text-purple-400">export</span> ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://0.0.0.0:4000"</span>{'\\n'}
                                <span className="text-purple-400">export</span> ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\\n'}
                                <span className="text-emerald-400">claude</span>
                              </code>
                            ) : (
                              <code>
                                <span className="text-purple-400">$env:</span>ANTHROPIC_BASE_URL=<span className="text-amber-300">"http://0.0.0.0:4000"</span>{'\\n'}
                                <span className="text-purple-400">$env:</span>ANTHROPIC_API_KEY=<span className="text-amber-300">"sk-litellm"</span>{'\\n'}
                                <span className="text-emerald-400">claude</span>
                              </code>
                            )}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* Official Docs Bridge */}
                    <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in duration-500">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                        <Box className="w-4 h-4 mr-2 text-blue-500" />
                        实时参考 (Official Docs Bridge)
                      </h4>
                      <p className="text-xs text-gray-500 mb-3">代码可能会随版本更新，如遇报错，请第一时间查看官方最新手册：</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <a href="https://docs.litellm.ai/docs/proxy/quick_start" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                          <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700 block mb-1">LiteLLM Proxy</span>
                          <span className="text-xs text-gray-500">官方配置指南</span>
                        </a>
                        <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                          <span className="text-sm font-semibold text-purple-600 group-hover:text-purple-700 block mb-1">Claude Code</span>
                          <span className="text-xs text-gray-500">官方环境手册</span>
                        </a>
                        <a href="https://api-docs.deepseek.com/" target="_blank" rel="noopener noreferrer" className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-colors group">
                          <span className="text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 block mb-1">DeepSeek API</span>
                          <span className="text-xs text-gray-500">官方参数说明</span>
                        </a>
                      </div>
                    </div>

                    {/* Error Log Analyzer */}
                    <div className="mt-8 border-t border-gray-100 pt-6 animate-in fade-in duration-500">
                      <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                        <Terminal className="w-4 h-4 mr-2 text-amber-500" />
                        报错自诊断 (Error Log Analyzer)
                      </h4>
                      <textarea
                        value={errorLog}
                        onChange={(e) => setErrorLog(e.target.value)}
                        placeholder="在此粘贴您的终端报错日志..."
                        className="w-full h-24 bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs font-mono text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar mb-3 placeholder:text-gray-600 transition-all shadow-inner"
                      />
                      {diagnosis && (
                        <div className={\`p-4 rounded-lg border shadow-sm \${
                          diagnosis.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                          diagnosis.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                          'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }\`}>
                          <p className="text-xs font-medium leading-relaxed">{diagnosis.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'OpenClaw' && (
                  <div className="relative group animate-in fade-in duration-300">
                    <div className="absolute right-3 top-3 z-10">
                      <CopyButton text={\`{\\n  "api_key": "\${apiKey}",\\n  "base_url": "\${customBaseUrl}"\\n}\`} />
                    </div>
                    <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 overflow-hidden relative shadow-inner">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <pre className="text-sm font-mono text-gray-200 overflow-x-auto pb-2 custom-scrollbar">
                        <code>
                          {'{'}{'\\n'}
                          {'  '}<span className="text-blue-400">"api_key"</span>: <span className="text-amber-300">"{apiKey}"</span>,{'\\n'}
                          {'  '}<span className="text-blue-400">"base_url"</span>: <span className="text-amber-300">"{customBaseUrl}"</span>{'\\n'}
                          {'}'}
                        </code>
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1.5" />
                      将以上配置片段合并到您的 config.json 对应模型提供商配置中。
                    </p>
                  </div>
                )}

                {activeTab === 'Cline / Roo Code' && (
                  <div className="animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                      <table className="w-full text-sm text-left">
                        <tbody className="divide-y divide-gray-100">
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium w-32 border-r border-gray-100">Provider</td>
                            <td className="py-3.5 px-5 text-gray-900 font-semibold flex items-center justify-between">
                              <span>
                                {currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : 
                                 currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'}
                              </span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={currentPlatform.id === 'anthropic' || currentPlatform.id === 'claude' ? 'Anthropic' : currentPlatform.id === 'gemini' ? 'Google Gemini' : 'OpenAI Compatible'} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">Base URL</td>
                            <td className="py-3.5 px-5 text-amber-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span className="truncate max-w-[200px] sm:max-w-xs">{customBaseUrl}</span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={customBaseUrl} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">API Key</td>
                            <td className="py-3.5 px-5 text-emerald-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span>{apiKey.substring(0, 8)}...</span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={apiKey} />
                              </div>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 transition-colors group">
                            <td className="py-3.5 px-5 text-gray-600 font-medium border-r border-gray-100">建议模型</td>
                            <td className="py-3.5 px-5 text-blue-600 font-mono text-xs flex justify-between items-center bg-gray-50/50">
                              <span className="truncate max-w-[200px] sm:max-w-xs">
                                {availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / claude-3-5-sonnet'}
                              </span>
                              <div className="scale-90 opacity-0 group-hover:opacity-100 transition-opacity">
                                <CopyButton text={availableModels && availableModels.length > 0 ? availableModels[0] : 'gpt-4o / claude-3-5-sonnet'} />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center">
                      <Info className="w-3.5 h-3.5 mr-1.5" />
                      在 VSCode 扩展设置中，依次填入上述表格内容。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-8 text-center border-t border-gray-200 mt-auto bg-white">
        <p className="text-gray-400 text-sm flex items-center justify-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>本工具纯前端运行，绝不收集或上传任何 API Key。只为开源与热爱而生。</span>
        </p>
      </footer>
    </div>
  );
}
\`;

const oldContent = fs.readFileSync('e:/AI_workspace/Active_Projects/API-QuickCheck/src/App.tsx', 'utf-8');
const startIndex = oldContent.indexOf('  return (');
if (startIndex !== -1) {
    const finalContent = oldContent.substring(0, startIndex) + newReturnBlock;
    fs.writeFileSync('e:/AI_workspace/Active_Projects/API-QuickCheck/src/App.tsx', finalContent);
    console.log('Update successful');
} else {
    console.log('Update failed, index not found');
}
