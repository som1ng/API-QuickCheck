import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// 1. OpenAI Classic Spiral Vortex Logo
export const OpenAILogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l2.46-1.42 2.46 1.42v2.84l-2.46 1.42-2.46-1.42z" />
  </svg>
);

// 2. Anthropic (Claude) Official Asterisk Geometric Logo
export const ClaudeLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M4.5 10.5C3.67 10.5 3 11.17 3 12s.67 1.5 1.5 1.5h3.18l-2.25 2.25c-.59.59-.59 1.54 0 2.12.59.59 1.54.59 2.12 0L9.8 15.62V18.8c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-3.18l2.25 2.25c.59.59 1.54.59 2.12 0 .59-.59.59-1.54 0-2.12L14.92 13.5h3.18c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-3.18l2.25-2.25c.59-.59.59-1.54 0-2.12-.59-.59-1.54-.59-2.12 0L12.8 8.38V5.2c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v3.18L7.55 6.13c-.59-.59-1.54-.59-2.12 0-.59.59-.59 1.54 0 2.12L7.68 10.5H4.5z" />
  </svg>
);

// 3. Google Gemini 4-Pointed Sparkle Logo
export const GeminiLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M12 2C12 7.52285 7.52285 12 2 12C7.52285 12 12 16.4772 12 22C12 16.4772 16.4772 12 22 12C16.4772 12 12 7.52285 12 2Z"
      fill="url(#gemini-gradient)"
    />
    <defs>
      <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4E82EE" />
        <stop offset="0.5" stopColor="#9B72CB" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. DeepSeek Blue Whale / Wave Official Logo
export const DeepSeekLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.5 12c-1.2-3.8-4.5-6.5-8.5-6.5C5.8 5.5 2 9.5 2 14.5c0 2.5 1.1 4.8 2.9 6.4.4.3.9.1 1-.4.2-.9.7-2.3 1.6-3.3 1.4-1.5 3.3-2.2 5.5-2.2 2.5 0 4.6 1.1 5.9 2.8.3.4.8.4 1.1.1 1.2-1.3 1.9-3.2 1.9-5.1 0-.3-.8-.5-2.4-.8zm-8.5 1c-1.4 0-2.5-1.1-2.5-2.5S9.6 8 11 8s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z" />
  </svg>
);

// 5. Groq Official Lightning 'G' Logo
export const GroqLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2l1-4H9.5l3.5-6.5v4.5h2z" />
  </svg>
);

// 6. Cerebras Neural Chip Cube Logo
export const CerebrasLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5zm0 12.5L4 10.5V17l8 5 8-5v-6.5l-8 4z" />
  </svg>
);

// 7. SiliconFlow (硅基流动) Fluid Wave Logo
export const SiliconFlowLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 3C7.03 3 3 7.03 3 12c0 2.8 1.28 5.3 3.3 6.96l1.45-1.45A6.94 6.94 0 0 1 5 12c0-3.87 3.13-7 7-7s7 3.13 7 7c0 2.1-.92 4-2.4 5.3l1.45 1.45C20.08 17.06 21 14.65 21 12c0-4.97-4.03-9-9-9zm0 4a5 5 0 0 0-5 5c0 1.54.7 2.92 1.8 3.84l1.43-1.43A3.01 3.01 0 0 1 9 12c0-1.66 1.34-3 3-3s3 1.34 3 3c0 .87-.37 1.66-.96 2.21l1.43 1.43A4.97 4.97 0 0 0 17 12a5 5 0 0 0-5-5z" />
  </svg>
);

// 8. OpenRouter Multi-Route Intersection Logo
export const OpenRouterLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-6 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm-6 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm12 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM7.5 7.5l3 3m3 0l3-3m-6 6l-3 3m6-3l3 3" />
  </svg>
);

// 9. Custom Relay Globe Server Vector Logo
export const CustomRelayLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Universal Provider Icon Dispatcher
export const ProviderIcon: React.FC<{ providerId: string; className?: string; size?: number }> = ({
  providerId,
  className = 'w-5 h-5',
  size = 20,
}) => {
  switch (providerId.toLowerCase()) {
    case 'openai':
      return <OpenAILogo className={`${className} text-[#faf9f5]`} size={size} />;
    case 'anthropic':
    case 'claude':
      return <ClaudeLogo className={`${className} text-[#cc785c]`} size={size} />;
    case 'gemini':
    case 'google':
      return <GeminiLogo className={className} size={size} />;
    case 'deepseek':
      return <DeepSeekLogo className={`${className} text-[#4e82ee]`} size={size} />;
    case 'groq':
      return <GroqLogo className={`${className} text-[#f55036]`} size={size} />;
    case 'cerebras':
      return <CerebrasLogo className={`${className} text-[#ff6320]`} size={size} />;
    case 'siliconflow':
      return <SiliconFlowLogo className={`${className} text-[#8b5cf6]`} size={size} />;
    case 'openrouter':
      return <OpenRouterLogo className={`${className} text-[#ec4899]`} size={size} />;
    default:
      return <CustomRelayLogo className={`${className} text-[#cc785c]`} size={size} />;
  }
};
