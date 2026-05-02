import { Info } from 'lucide-react';
import { PLATFORMS } from '../config/platforms';

const CATEGORY_ORDER = ['海外巨头', '海外聚合与加速', '国内大厂', '国内新锐'] as const;

export default function PlatformQuickReference() {
  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((category) => {
        const platforms = Object.values(PLATFORMS).filter((platform) => platform.category === category);
        if (platforms.length === 0) return null;

        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{category}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-2">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className="rounded-lg border border-white/8 bg-black/30 px-4 py-3 hover:border-white/15 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-100">{platform.name}</span>
                    {platform.litellmConfig.requiresApiBase && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-2 py-0.5 text-[11px] font-bold text-orange-300 cursor-help"
                        title={platform.defaultBaseUrl}
                      >
                        <Info className="w-3 h-3" />
                        需附加配置 API_BASE
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                    <div>
                      环境变量：
                      <code className="ml-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-300">
                        {platform.litellmConfig.envVar}
                      </code>
                    </div>
                    <div>
                      模型前缀：
                      <code className="ml-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300">
                        {platform.litellmConfig.prefix}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
