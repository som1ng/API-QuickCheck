import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// 1. OpenAI Official Classic Vortex Logo
export const OpenAILogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>OpenAI</title>
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4947 4.4947 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4022-.6863zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813v6.7227zm1.093-2.4571 2.603-1.4988 2.603 1.4988v3.0022l-2.603 1.4988-2.603-1.4988z" />
  </svg>
);

// 2. Anthropic (Claude) Official Terracotta Sunburst Logo
export const ClaudeLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>Claude / Anthropic</title>
    <path
      d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"
      fill="#D97757"
    />
  </svg>
);

// 3. Google Gemini Official Multicolor Sparkle Logo
export const GeminiLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Gemini / Google</title>
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="#3186FF"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-grad-green)"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-grad-red)"
    />
    <path
      d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
      fill="url(#gemini-grad-yellow)"
    />
    <defs>
      <linearGradient id="gemini-grad-green" x1="7" y1="15.5" x2="11" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#08B962" />
        <stop offset="1" stopColor="#08B962" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="gemini-grad-red" x1="8" y1="5.5" x2="11.5" y2="11" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F94543" />
        <stop offset="1" stopColor="#F94543" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="gemini-grad-yellow" x1="3.5" y1="13.5" x2="17.5" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FABC12" />
        <stop offset="0.46" stopColor="#FABC12" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. DeepSeek Official Blue Whale Logo
export const DeepSeekLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>DeepSeek</title>
    <path
      d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"
      fill="#4D6BFE"
    />
  </svg>
);

// 5. xAI (Grok) Official Vector Logo
export const GrokLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
  >
    <title>xAI / Grok</title>
    <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
  </svg>
);

// 6. Moonshot / Kimi Official Vector Logo
export const KimiLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Kimi / Moonshot AI</title>
    <rect width="24" height="24" rx="6" fill="#141413" />
    <path
      d="M7 6v12h2.8V13.2l4.8 4.8H18l-5.6-5.6L17.6 6h-3.4L9.8 10.4V6H7z"
      fill="#FAF9F5"
    />
  </svg>
);

// 7. Alibaba / Qwen (通义千问) Official Mobius Loop Logo
export const QwenLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Qwen / Alibaba</title>
    <path
      d="M12 2L4 6.6v9.2L12 20.4l8-4.6V6.6L12 2zm0 3.3l5.5 3.2v6.4L12 18.1l-5.5-3.2V8.5L12 5.3z"
      fill="url(#qwen-grad)"
    />
    <path
      d="M8.2 13.8L12 11.6l3.8 2.2-3.8 2.2-3.8-2.2z"
      fill="#615CED"
    />
    <defs>
      <linearGradient id="qwen-grad" x1="4" y1="2" x2="20" y2="20.4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#615CED" />
        <stop offset="0.5" stopColor="#8054FF" />
        <stop offset="1" stopColor="#A855F7" />
      </linearGradient>
    </defs>
  </svg>
);

// 8. 智谱 AI / Z.ai / GLM Official Tech Blue Origami Logo
export const ZhipuLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Zhipu AI / Z.ai / GLM</title>
    <path
      d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 3.1l6.8 3.8L12 12.7 5.2 8.9 12 5.1zM5 10.4l6 3.4v6.8l-6-3.4v-6.8zm8 10.2v-6.8l6-3.4v6.8l-6 3.4z"
      fill="url(#zhipu-grad)"
    />
    <defs>
      <linearGradient id="zhipu-grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#3B82F6" />
        <stop offset="1" stopColor="#1D4ED8" />
      </linearGradient>
    </defs>
  </svg>
);

// 9. Meta (Llama) Official Blue Infinity Loop Logo
export const MetaLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Meta / Llama</title>
    <path
      d="M16.68 5.6C14.7 5.6 13.06 6.64 12 8.16 10.94 6.64 9.3 5.6 7.32 5.6 3.86 5.6 1.5 8.36 1.5 12c0 3.64 2.36 6.4 5.82 6.4 2.22 0 4.02-1.22 4.68-2.64.66 1.42 2.46 2.64 4.68 2.64 3.46 0 5.82-2.76 5.82-6.4 0-3.64-2.36-6.4-5.82-6.4zm-9.36 10.4c-2.18 0-3.62-1.74-3.62-4s1.44-4 3.62-4c1.9 0 3.24 1.44 3.78 3.56-.44 2.14-1.8 4.44-3.78 4.44zm9.36 0c-1.98 0-3.34-2.3-3.78-4.44.54-2.12 1.88-3.56 3.78-3.56 2.18 0 3.62 1.74 3.62 4s-1.44 4-3.62 4z"
      fill="#0668E1"
    />
  </svg>
);

// 10. Xiaomi (小米) Official Orange Squircle Logo
export const XiaomiLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Xiaomi</title>
    <rect width="24" height="24" rx="7" fill="#FF6900" />
    <path
      d="M6 7.5h3.2v9H6v-9zm4.8 0h3.2v5.6c0 .7.5 1.2 1.2 1.2s1.2-.5 1.2-1.2V7.5h3.2v5.8c0 2.2-1.8 3.9-4 3.9s-4-1.7-4-3.9V7.5zm4.2 3h1.8v2.4h-1.8v-2.4z"
      fill="#FFFFFF"
    />
  </svg>
);

// 11. Tencent (腾讯 / 混元) Official Tech Emblem Logo
export const TencentLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Tencent / Hunyuan</title>
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h6.5v2.8H14v7.7h-3V9.8H8.5V7H11z"
      fill="#0052D9"
    />
  </svg>
);

// 12. MiniMax (名之梦) Official Dual Soundwave Logo
export const MiniMaxLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>MiniMax</title>
    <rect x="3" y="9" width="3.2" height="6" rx="1.6" fill="#F93C3C" />
    <rect x="7.6" y="5" width="3.2" height="14" rx="1.6" fill="#F93C3C" />
    <rect x="12.2" y="8" width="3.2" height="8" rx="1.6" fill="#FA6400" />
    <rect x="16.8" y="4" width="3.2" height="16" rx="1.6" fill="#FA6400" />
  </svg>
);

// 13. Mistral AI Official Stepped Chevron Matrix Logo
export const MistralLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>Mistral AI</title>
    <path
      d="M3 4h3.6v3.6H3V4zm14.4 0H21v3.6h-3.6V4zM3 7.6h7.2v3.6H3V7.6zm10.8 0H21v3.6h-7.2V7.6zM3 11.2h10.8v3.6H3v-3.6zm7.2 0H21v3.6h-10.8v-3.6zM3 14.8h18v3.6H3v-3.6zm0 3.6h3.6v3.6H3v-3.6zm7.2 0h3.6v3.6h-3.6v-3.6zm7.2 0H21v3.6h-3.6v-3.6z"
      fill="#FA520F"
    />
  </svg>
);

// 14. Upstage (Solar) Official Blue Ascent Stages Logo
export const UpstageLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Upstage / Solar</title>
    <path
      d="M3 17h4.5V21H3v-4zm5.5-5H13v9H8.5v-9zm5.5-5H18.5V21H14V7zm5.5-4H21V21h-1.5V3z"
      fill="#2152FF"
    />
  </svg>
);

// 15. NVIDIA Official Green Eye Logo
export const NvidiaLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>NVIDIA</title>
    <path
      d="M10.15 7.15c0-.07.03-.13.08-.17 1.83-1.6 4.35-1.8 6.42-.51.1.06.13.19.08.3-.39.81-.8 1.6-1.2 2.39-.06.12-.19.16-.31.09-1.26-.74-2.8-.57-3.89.41-.09.08-.22.06-.29-.03-.29-.76-.59-1.52-.89-2.48zm-2.43 1.95c.08-.09.2-.12.3-.06 2.5 1.5 5.57 1.25 7.82-.62.09-.08.22-.06.3.03.4.47.8 1 1.2 1.5.07.09.06.22-.03.3-3.1 2.54-7.4 2.87-10.8.84-.1-.06-.13-.19-.07-.29.42-.56.84-1.13 1.28-1.7zm-2.6 3.63c.09-.07.21-.05.29.04 3.73 4.14 9.94 4.46 14.07.75.1-.09.23-.07.31.03.43.53.86 1.07 1.28 1.62.07.09.05.23-.05.32-5.06 4.54-12.7 4.14-17.29-.91-.07-.08-.06-.21.03-.28.45-.52.91-1.05 1.36-1.57zm16.76-4.52c-.06-.11-.02-.24.08-.31 1.05-.73 1.85-.35 2.04.85.12.79-.31 1.58-1.07 1.96-.11.06-.24.01-.29-.1-.25-.79-.51-1.6-.76-2.4zm-19.76.84c.05-.12.18-.17.3-.12 1.33.56 2.31 1.5 2.88 2.76.05.12.01.25-.1.3-.5.26-1.01.52-1.52.79-.1.05-.23.02-.29-.08-.48-.96-1.15-1.68-2.07-2.16-.11-.06-.15-.19-.09-.3.26-.4.54-.79.89-1.19z"
      fill="#76B900"
    />
  </svg>
);

// 16. Thinking Machines / Thinky Tech Logo
export const ThinkingMachinesLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Thinking Machines / Thinky</title>
    <circle cx="12" cy="12" r="9" stroke="#E8A55A" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="#E8A55A" />
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke="#E8A55A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 17. ByteDance / Doubao Official Wave Logo
export const ByteDanceLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>ByteDance / Doubao</title>
    <rect x="2" y="8" width="3.5" height="8" rx="1.75" fill="#3884FF" />
    <rect x="7.5" y="4" width="3.5" height="16" rx="1.75" fill="#00D4C8" />
    <rect x="13" y="7" width="3.5" height="10" rx="1.75" fill="#3884FF" />
    <rect x="18.5" y="10" width="3.5" height="4" rx="1.75" fill="#00D4C8" />
  </svg>
);

// 18. Baidu (百度 / 文心一言) Official Logo
export const BaiduLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <title>Baidu / Ernie</title>
    <path
      d="M12 10.5c-3.1 0-5.2 2.2-5.2 5.1 0 3.2 2.7 5.4 5.2 5.4s5.2-2.2 5.2-5.4c0-2.9-2.1-5.1-5.2-5.1zm-6.5-1c1.2 0 2.2-1.3 2.2-2.8s-1-2.8-2.2-2.8-2.2 1.3-2.2 2.8 1 2.8 2.2 2.8zm13 0c1.2 0 2.2-1.3 2.2-2.8s-1-2.8-2.2-2.8-2.2 1.3-2.2 2.8 1 2.8 2.2 2.8zM7.5 4.5c1.4 0 2.5-1.5 2.5-3.3S8.9 0 7.5 0 5 1.5 5 3.3s1.1 1.2 2.5 1.2zm9 0c1.4 0 2.5-1.5 2.5-3.3S17.9 0 16.5 0 14 1.5 14 3.3s1.1 1.2 2.5 1.2z"
      fill="#2932E1"
    />
  </svg>
);

// 19. StepFun (阶跃星辰) Official Light Step Logo
export const StepFunLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>StepFun</title>
    <path
      d="M4 19h5v-5h5V9h6V4"
      stroke="#6366F1"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="20" cy="4" r="2.5" fill="#A855F7" />
  </svg>
);

// 20. KwaiKAT (快手 / 快意) Official Logo
export const KwaiLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Kwai / Kuaishou</title>
    <circle cx="9" cy="8.5" r="4.5" fill="#FF5000" />
    <circle cx="9" cy="8.5" r="2.2" fill="#FFFFFF" />
    <path
      d="M17.5 5.5l-4.5 3v6l4.5 3V5.5z"
      fill="#FF5000"
    />
    <circle cx="8" cy="18" r="3" fill="#FF5000" />
  </svg>
);

// 21. Cohere Official Cellular Logo
export const CohereLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Cohere</title>
    <path
      d="M12 2a10 10 0 00-7.07 17.07L12 12l7.07 7.07A10 10 0 0012 2z"
      fill="#D6705B"
    />
    <circle cx="12" cy="12" r="4" fill="#39594D" />
  </svg>
);

// 22. Microsoft Official 4-Color Logo
export const MicrosoftLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Microsoft</title>
    <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022" />
    <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00" />
    <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF" />
    <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900" />
  </svg>
);

// 23. Amazon / AWS Official Smile Logo
export const AmazonLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Amazon / AWS</title>
    <path
      d="M3 14.5c4.8 3.5 11.2 3.5 16 0 .5-.4 1.2.2.8.7-5.3 4.2-12.3 4.2-17.6 0-.4-.5.3-1.1.8-.7z"
      fill="#FF9900"
    />
    <path
      d="M20.5 12.8c.4 1.5-.2 2.8-1.5 3.2-1.3.4-2.6-.4-3-1.9-.4-1.5.2-2.8 1.5-3.2 1.3-.4 2.6.4 3 1.9z"
      fill="#FF9900"
    />
  </svg>
);

// 24. Perplexity AI Official Asterisk Logo
export const PerplexityLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>Perplexity</title>
    <path
      d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"
      stroke="#20808D"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="3" fill="#20808D" />
  </svg>
);

// 25. AI21 Labs Official Logo
export const AI21Logo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>AI21 Labs</title>
    <rect width="24" height="24" rx="5" fill="#0F172A" />
    <path
      d="M6 7h3v10H6V7zm6 3h3v2h-3v-2zm0 5h6v2h-6v-2zm3-8h3v5h-3V7z"
      fill="#6366F1"
    />
  </svg>
);

// 26. Cerebras Official Neural Chip Logo
export const CerebrasLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
  >
    <title>Cerebras</title>
    <path clipRule="evenodd" d="M14.121 2.701a9.299 9.299 0 000 18.598V22.7c-5.91 0-10.7-4.791-10.7-10.701S8.21 1.299 14.12 1.299V2.7zm4.752 3.677A7.353 7.353 0 109.42 17.643l-.901 1.074a8.754 8.754 0 01-1.08-12.334 8.755 8.755 0 0112.335-1.08l-.901 1.075zm-2.255.844a5.407 5.407 0 00-5.048 9.563l-.656 1.24a6.81 6.81 0 016.358-12.043l-.654 1.24zM14.12 8.539a3.46 3.46 0 100 6.922v1.402a4.863 4.863 0 010-9.726v1.402z" />
    <path d="M15.407 10.836a2.24 2.24 0 00-.51-.409 1.084 1.084 0 00-.544-.152c-.255 0-.483.047-.684.14a1.58 1.58 0 00-.84.912c-.074.203-.11.416-.11.631 0 .218.036.43.11.631a1.594 1.594 0 00.84.913c.2.093.43.14.684.14.216 0 .417-.046.602-.135.188-.09.35-.225.475-.392l.928 1.006c-.14.14-.3.261-.482.363a3.367 3.367 0 01-1.083.38c-.17.026-.317.04-.44.04a3.315 3.315 0 01-1.182-.21 2.825 2.825 0 01-.961-.597 2.816 2.816 0 01-.644-.929 2.987 2.987 0 01-.238-1.21c0-.444.08-.847.238-1.21.15-.35.368-.666.643-.929.278-.261.605-.464.962-.596a3.315 3.315 0 011.182-.21c.355 0 .712.068 1.072.204.361.138.685.36.944.649l-.962.97z" />
  </svg>
);

// 27. SiliconFlow (硅基流动) Official Logo
export const SiliconFlowLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <title>SiliconFlow</title>
    <path
      clipRule="evenodd"
      d="M22.956 6.521H12.522c-.577 0-1.044.468-1.044 1.044v3.13c0 .577-.466 1.044-1.043 1.044H1.044c-.577 0-1.044.467-1.044 1.044v4.174C0 17.533.467 18 1.044 18h10.434c.577 0 1.044-.467 1.044-1.043v-3.13c0-.578.466-1.044 1.043-1.044h9.391c.577 0 1.044-.467 1.044-1.044V7.565c0-.576-.467-1.044-1.044-1.044z"
      fill="#6E29F6"
      fillRule="evenodd"
    />
  </svg>
);

// 28. OpenRouter Official Geometric Route Logo
export const OpenRouterLogo: React.FC<LogoProps> = ({ className = 'w-5 h-5', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    fillRule="evenodd"
    className={className}
  >
    <title>OpenRouter</title>
    <path d="M18.654 3.87a5.087 5.087 0 110 10.174L23.7 19.09c.64.641.187 1.737-.72 1.737H8.48a8.479 8.479 0 010-16.958h10.175zM8.479 7.26a5.087 5.087 0 100 10.176 5.087 5.087 0 000-10.175z" />
  </svg>
);

// 29. Custom Relay Network Server Vector Logo
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
  const pid = (providerId || '').toLowerCase().trim();

  switch (pid) {
    case 'openai':
    case 'chatgpt':
      return <OpenAILogo className={`${className} text-[#faf9f5]`} size={size} />;
    case 'anthropic':
    case 'claude':
      return <ClaudeLogo className={className} size={size} />;
    case 'gemini':
    case 'google':
      return <GeminiLogo className={className} size={size} />;
    case 'deepseek':
      return <DeepSeekLogo className={className} size={size} />;
    case 'grok':
    case 'xai':
    case 'x-ai':
    case 'spacexai':
      return <GrokLogo className={`${className} text-[#faf9f5]`} size={size} />;
    case 'kimi':
    case 'moonshot':
      return <KimiLogo className={className} size={size} />;
    case 'qwen':
    case 'alibaba':
    case 'aliyun':
      return <QwenLogo className={className} size={size} />;
    case 'zhipu':
    case 'zai':
    case 'z.ai':
    case 'glm':
      return <ZhipuLogo className={className} size={size} />;
    case 'meta':
    case 'llama':
      return <MetaLogo className={className} size={size} />;
    case 'xiaomi':
      return <XiaomiLogo className={className} size={size} />;
    case 'tencent':
    case 'hunyuan':
      return <TencentLogo className={className} size={size} />;
    case 'minimax':
      return <MiniMaxLogo className={className} size={size} />;
    case 'mistral':
    case 'mixtral':
      return <MistralLogo className={className} size={size} />;
    case 'upstage':
    case 'solar':
      return <UpstageLogo className={className} size={size} />;
    case 'nvidia':
      return <NvidiaLogo className={className} size={size} />;
    case 'thinky':
    case 'thinkingmachines':
    case 'thinking machines':
      return <ThinkingMachinesLogo className={className} size={size} />;
    case 'bytedance':
    case 'doubao':
    case 'seed':
      return <ByteDanceLogo className={className} size={size} />;
    case 'baidu':
    case 'ernie':
    case 'wenxin':
      return <BaiduLogo className={className} size={size} />;
    case 'stepfun':
    case 'step':
      return <StepFunLogo className={className} size={size} />;
    case 'kwai':
    case 'kling':
    case 'kwaikat':
      return <KwaiLogo className={className} size={size} />;
    case 'cohere':
    case 'command':
      return <CohereLogo className={className} size={size} />;
    case 'microsoft':
    case 'msft':
      return <MicrosoftLogo className={className} size={size} />;
    case 'amazon':
    case 'aws':
    case 'bedrock':
      return <AmazonLogo className={className} size={size} />;
    case 'perplexity':
      return <PerplexityLogo className={className} size={size} />;
    case 'ai21':
      return <AI21Logo className={className} size={size} />;
    case 'cerebras':
      return <CerebrasLogo className={`${className} text-[#ff6320]`} size={size} />;
    case 'siliconflow':
    case 'siliconcloud':
      return <SiliconFlowLogo className={className} size={size} />;
    case 'openrouter':
      return <OpenRouterLogo className={`${className} text-[#ec4899]`} size={size} />;
    default:
      return <CustomRelayLogo className={`${className} text-[#cc785c]`} size={size} />;
  }
};
