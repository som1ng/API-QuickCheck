#!/usr/bin/env node

// scripts/apiqc.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

// src/engine/audit/baseline.ts
function createBaselineSnapshot(input) {
  const capabilityDistributions = Object.fromEntries(
    input.report.capabilities.map((metric) => [metric.domain, metric.targetScores])
  );
  return {
    schemaVersion: "1.0",
    id: input.id,
    provider: input.provider,
    model: input.model,
    surface: input.surface,
    region: input.region,
    serviceTier: input.serviceTier,
    capturedAt: input.report.testedAt,
    fixtureHashes: input.report.fixtureHashes,
    protocolEventTypes: input.report.protocol.flatMap((evidence) => evidence.rawEventTypes || []),
    capabilityDistributions,
    runtime: {
      p50LatencyMs: input.report.runtime.p50LatencyMs,
      p95LatencyMs: input.report.runtime.p95LatencyMs,
      successRate: input.report.runtime.successRate
    },
    estimatedCostUsd: input.estimatedCostUsd || 0,
    source: input.source || "unknown",
    coverage: input.report.coverage
  };
}
function validateBaselineSnapshot(value) {
  if (!value || typeof value !== "object") return false;
  const snapshot = value;
  return snapshot.schemaVersion === "1.0" && typeof snapshot.id === "string" && typeof snapshot.provider === "string" && typeof snapshot.model === "string" && typeof snapshot.surface === "string" && typeof snapshot.capturedAt === "string" && typeof snapshot.fixtureHashes === "object" && typeof snapshot.capabilityDistributions === "object" && Object.values(snapshot.capabilityDistributions || {}).every((values) => Array.isArray(values) && values.every((score) => typeof score === "number" && Number.isFinite(score))) && typeof snapshot.runtime === "object" && typeof snapshot.coverage === "object" && (snapshot.source === "official" || snapshot.source === "reference" || snapshot.source === "user" || snapshot.source === "unknown");
}
var STORAGE_PREFIX = "apiqc:baseline:";
function loadBaselineSnapshot(id) {
  if (typeof localStorage === "undefined") return void 0;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!raw) return void 0;
  try {
    const parsed = JSON.parse(raw);
    return validateBaselineSnapshot(parsed) ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function findStoredBaseline(provider, model, surface) {
  if (typeof localStorage === "undefined") return void 0;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const snapshot = loadBaselineSnapshot(key.slice(STORAGE_PREFIX.length));
    if (snapshot?.provider === provider && snapshot.model === model && snapshot.surface === surface) return snapshot;
  }
  return void 0;
}
function serializeBaselineSnapshot(snapshot) {
  return `${JSON.stringify(snapshot, null, 2)}
`;
}

// src/engine/transport/silentTransport.ts
async function silentFetch(options) {
  const {
    url,
    method = "POST",
    headers = {},
    body,
    timeoutMs = 25e3,
    signal: userSignal,
    disableFallback = false
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error("Request Timeout"));
  }, timeoutMs);
  const combinedSignal = userSignal ? anySignal([userSignal, controller.signal]) : controller.signal;
  const startTime = performance.now();
  try {
    const fetchHeaders = {
      "Content-Type": "application/json",
      ...headers
    };
    const response = await fetch(url, {
      method,
      headers: fetchHeaders,
      body: body !== void 0 ? typeof body === "string" ? body : JSON.stringify(body) : void 0,
      signal: combinedSignal
    });
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    let rawText = "";
    let parsedData = null;
    try {
      rawText = await response.text();
      try {
        parsedData = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsedData = null;
      }
    } catch {
      rawText = "";
    }
    if (!response.ok && typeof window !== "undefined" && !disableFallback && !url.startsWith("/api/proxy") && [404, 403, 405, 502, 503].includes(response.status)) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return silentFetch({
        ...options,
        url: proxyUrl,
        disableFallback: true
      });
    }
    const lowerText = (rawText + JSON.stringify(parsedData || "")).toLowerCase();
    let errorCategory = void 0;
    let errorMessage = void 0;
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        errorCategory = "unauthorized";
        errorMessage = "API Key \u65E0\u6548\u6216\u672A\u6388\u6743 (401/403)";
      } else if (response.status === 402 || response.status === 429 || lowerText.includes("quota") || lowerText.includes("insufficient") || lowerText.includes("balance")) {
        errorCategory = response.status === 429 && !lowerText.includes("quota") ? "rate_limit" : "quota";
        errorMessage = errorCategory === "rate_limit" ? "\u89E6\u53D1\u9891\u7387\u9650\u5236 (429 Rate Limit)" : "\u8D26\u6237\u989D\u5EA6\u4E0D\u8DB3\u6216\u5DF2\u6B20\u8D39 (402/Quota Exhausted)";
      } else if (response.status === 404) {
        errorCategory = "not_found";
        errorMessage = "\u63A5\u53E3\u6216\u6A21\u578B\u4E0D\u5B58\u5728 (404 Not Found)";
      } else if (response.status >= 500) {
        errorCategory = "server_error";
        errorMessage = `\u4E2D\u8F6C\u7AD9\u670D\u52A1\u5F02\u5E38 (HTTP ${response.status})`;
      } else {
        errorCategory = "other";
        errorMessage = `\u8BF7\u6C42\u672A\u6210\u529F (HTTP ${response.status})`;
      }
    }
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: parsedData,
      rawText,
      latencyMs,
      headers: response.headers,
      errorCategory,
      errorMessage
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);
    const errorObj = err instanceof Error ? err : new Error(String(err));
    const isTimeout = errorObj.name === "AbortError" || errorObj.message.includes("Timeout");
    const isCors = errorObj.name === "TypeError" && (errorObj.message.includes("fetch") || errorObj.message.includes("NetworkError") || errorObj.message.includes("Failed"));
    if (typeof window !== "undefined" && !userSignal?.aborted && !disableFallback && !url.startsWith("/api/proxy")) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return silentFetch({
        ...options,
        url: proxyUrl,
        disableFallback: true
      });
    }
    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      statusText: isTimeout ? "Timeout" : "Network Error",
      data: null,
      rawText: "",
      latencyMs,
      headers: new Headers(),
      errorCategory: isTimeout ? "timeout" : isCors ? "network_cors" : "other",
      errorMessage: isTimeout ? `\u8BF7\u6C42\u8D85\u65F6 (${timeoutMs}ms \u7194\u65AD\u4FDD\u62A4)` : isCors ? "\u7F51\u7EDC\u8FDE\u63A5\u5F02\u5E38\u6216\u88AB\u6D4F\u89C8\u5668\u8DE8\u57DF\u62E6\u622A (CORS)" : errorObj.message || "\u7F51\u7EDC\u8BF7\u6C42\u53D1\u751F\u672A\u77E5\u9519\u8BEF"
    };
  }
}
async function silentStreamingFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (typeof window !== "undefined" && !res.ok && [404, 403, 405, 502].includes(res.status) && !url.startsWith("/api/proxy")) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, options);
    }
    return res;
  } catch (err) {
    if (typeof window !== "undefined" && !url.startsWith("/api/proxy")) {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(url)}`;
      return await fetch(proxyUrl, options);
    }
    throw err;
  }
}
function anySignal(signals) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

// src/engine/transport/urlNormalizer.ts
function normalizeBaseUrl(url) {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "");
}
function getBaseRootUrl(baseUrl) {
  const clean = normalizeBaseUrl(baseUrl);
  return clean.replace(/\/v1$/, "").replace(/\/api$/, "");
}
function buildChatCompletionsUrl(baseUrl, platformId) {
  const clean = normalizeBaseUrl(baseUrl);
  if (!clean) return "";
  if (platformId === "anthropic") {
    return clean.endsWith("/messages") ? clean : `${clean}/messages`;
  }
  if (clean.endsWith("/chat/completions")) {
    return clean;
  }
  if (clean.endsWith("/v1")) {
    return `${clean}/chat/completions`;
  }
  if (!clean.includes("/v1/")) {
    return `${clean}/v1/chat/completions`;
  }
  return `${clean}/chat/completions`;
}
function getCandidateModelsUrls(baseUrl) {
  const clean = normalizeBaseUrl(baseUrl);
  if (!clean) return [];
  const root = getBaseRootUrl(baseUrl);
  const candidates = [];
  if (clean.endsWith("/v1")) {
    candidates.push(`${clean}/models`);
  } else if (!clean.endsWith("/models")) {
    candidates.push(`${clean}/v1/models`);
    candidates.push(`${root}/v1/models`);
    candidates.push(`${clean}/models`);
  } else {
    candidates.push(clean);
  }
  candidates.push(`${root}/api/v1/models`);
  candidates.push(`${root}/api/models`);
  candidates.push(`${clean}/models`);
  return Array.from(new Set(candidates));
}

// src/engine/scanner/batchScanner.ts
function extractUniversalModels(data) {
  if (!data) return [];
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return extractUniversalModels(parsed);
    } catch {
      return [];
    }
  }
  if (Array.isArray(data)) {
    return data.flatMap(parseModelItem).filter(Boolean);
  }
  if (typeof data !== "object" || data === null) return [];
  const obj = data;
  const candidateKeys = ["data", "models", "result", "list", "items", "model_list", "available_models", "channels"];
  for (const key of candidateKeys) {
    const val = obj[key];
    if (Array.isArray(val)) {
      const parsed = val.flatMap(parseModelItem).filter(Boolean);
      if (parsed.length > 0) return parsed;
    } else if (val && typeof val === "object") {
      const parsed = extractUniversalModels(val);
      if (parsed.length > 0) return parsed;
    }
  }
  const entries = Object.entries(obj);
  if (entries.length > 0 && entries.every(([k, v]) => typeof k === "string" && !k.startsWith("_") && k.length > 2 && (typeof v === "object" || typeof v === "boolean" || typeof v === "number"))) {
    const found = [];
    for (const [k, v] of entries) {
      if (["object", "success", "code", "msg", "message", "status", "created", "usage"].includes(k.toLowerCase())) continue;
      const displayName = v?.name || v?.display_name || k;
      found.push({ id: k, name: displayName });
    }
    if (found.length > 0) return found;
  }
  return [];
}
function parseModelItem(item) {
  if (typeof item === "string" && item.trim().length > 0) {
    const id = item.trim().replace(/^models\//, "");
    return [{ id, name: id }];
  }
  if (typeof item === "object" && item !== null) {
    const record = item;
    const id = typeof record.id === "string" ? record.id : typeof record.name === "string" ? record.name : typeof record.model === "string" ? record.model : typeof record.model_name === "string" ? record.model_name : typeof record.model_id === "string" ? record.model_id : typeof record.slug === "string" ? record.slug : void 0;
    if (id && typeof id === "string" && id.trim().length > 0) {
      const cleanId = id.trim().replace(/^models\//, "");
      const displayName = typeof record.display_name === "string" ? record.display_name : typeof record.displayName === "string" ? record.displayName : cleanId;
      return [{ id: cleanId, name: displayName }];
    }
  }
  return [];
}
var COMMON_CANDIDATE_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "o1",
  "o1-mini",
  "o3-mini",
  "claude-3-7-sonnet-20250219",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "deepseek-chat",
  "deepseek-reasoner",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "qwen-plus",
  "glm-4-plus"
];
async function fetchRemoteModels(baseUrl, apiKey, _platformId, signal) {
  const cleanBase = normalizeBaseUrl(baseUrl);
  const cleanKey = apiKey.trim();
  const candidateUrls = getCandidateModelsUrls(cleanBase);
  let lastErrorMessage = "";
  let sawUnauthorized = false;
  const attemptedLogs = [];
  for (const url of candidateUrls) {
    try {
      const res = await silentFetch({
        url,
        method: "GET",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "x-api-key": cleanKey,
          "x-goog-api-key": cleanKey
        },
        timeoutMs: 8e3,
        signal
      });
      attemptedLogs.push(`GET ${url} -> ${res.status || "Error"}`);
      if (res.status === 401 || res.status === 403) {
        sawUnauthorized = true;
        lastErrorMessage = res.errorMessage || "API Key \u65E0\u6548\u6216\u672A\u6388\u6743 (HTTP 401/403)";
      }
      if (res.ok && res.data) {
        const models = extractUniversalModels(res.data);
        if (models.length > 0) {
          const seen = /* @__PURE__ */ new Set();
          return models.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }
      }
    } catch (err) {
      attemptedLogs.push(`GET ${url} -> ${err.message || "Error"}`);
    }
  }
  const proxyTargets = typeof window !== "undefined" ? candidateUrls.slice(0, 2) : [];
  for (const targetUrl of proxyTargets) {
    try {
      const proxyUrl = `/api/proxy?target=${encodeURIComponent(targetUrl)}`;
      const res = await silentFetch({
        url: proxyUrl,
        method: "GET",
        headers: {
          Authorization: `Bearer ${cleanKey}`,
          "x-api-key": cleanKey,
          "x-goog-api-key": cleanKey
        },
        timeoutMs: 1e4,
        signal
      });
      attemptedLogs.push(`PROXY GET ${targetUrl} -> ${res.status || "Error"}`);
      if (res.status === 401 || res.status === 403) {
        sawUnauthorized = true;
        lastErrorMessage = res.errorMessage || "API Key \u65E0\u6548\u6216\u672A\u6388\u6743 (HTTP 401/403)";
      }
      if (res.ok && res.data) {
        const models = extractUniversalModels(res.data);
        if (models.length > 0) {
          const seen = /* @__PURE__ */ new Set();
          return models.filter((m) => {
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
        }
      }
    } catch (err) {
      attemptedLogs.push(`PROXY GET ${targetUrl} -> ${err.message || "Error"}`);
    }
  }
  if (cleanKey.length > 5) {
    const discovered = [];
    const chatUrl = buildChatCompletionsUrl(cleanBase);
    let unauthorizedProbeCount = 0;
    const probePromises = COMMON_CANDIDATE_MODELS.map(async (modelId) => {
      try {
        const res = await silentFetch({
          url: chatUrl,
          method: "POST",
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            "x-api-key": cleanKey,
            "Content-Type": "application/json"
          },
          body: {
            model: modelId,
            messages: [{ role: "user", content: "hi" }],
            max_tokens: 1
          },
          timeoutMs: 15e3,
          signal
        });
        if (res.status === 401 || res.status === 403) {
          unauthorizedProbeCount += 1;
        }
        const errorText = res.rawText.toLowerCase();
        const explicitlyMissingModel = [
          "model_not_found",
          "model not found",
          "model does not exist",
          "unknown model",
          "invalid model",
          "no available channel",
          "\u6A21\u578B\u4E0D\u5B58\u5728",
          "\u65E0\u53EF\u7528\u6E20\u9053"
        ].some((message) => errorText.includes(message));
        if (res.ok || res.status === 200 || res.status === 402 || res.status === 429 || res.status === 400 && !explicitlyMissingModel) {
          discovered.push({ id: modelId, name: modelId });
        }
      } catch {
      }
    });
    await Promise.allSettled(probePromises);
    if (discovered.length > 0) {
      return discovered;
    }
    if (unauthorizedProbeCount === COMMON_CANDIDATE_MODELS.length) {
      sawUnauthorized = true;
    }
  }
  if (sawUnauthorized) {
    throw new Error(`API Key \u65E0\u6548\u6216\u672A\u6388\u6743 (HTTP 401/403)\uFF0C\u8BF7\u786E\u8BA4\u5F53\u524D\u4E2D\u8F6C\u7AD9 API Key \u662F\u5426\u6B63\u786E\uFF01

\u5DF2\u5C1D\u8BD5\u8DEF\u7531:
${attemptedLogs.join("\n")}`);
  }
  throw new Error(`${lastErrorMessage || "\u672A\u63A2\u6D4B\u5230\u53EF\u7528\u6A21\u578B\u5217\u8868\u3002\u8BE5\u4E2D\u8F6C\u7AD9\u53EF\u80FD\u5728\u540E\u53F0\u5173\u95ED\u4E86 /v1/models \u63A5\u53E3\uFF0C\u4F60\u53EF\u4EE5\u76F4\u63A5\u5728\u4E0B\u65B9\u8F93\u5165\u6846\u624B\u52A8\u586B\u5199\u6A21\u578B\u540D\u8FDB\u884C\u68C0\u6D4B"}

\u5DF2\u5C1D\u8BD5\u8DEF\u7531:
${attemptedLogs.join("\n")}`);
}

// src/engine/audit/providerAdapters.ts
var endpoint = (baseUrl, suffix) => {
  const base = normalizeBaseUrl(baseUrl);
  return base.endsWith(suffix) ? base : `${base}${suffix}`;
};
var anthropicEndpoint = (baseUrl) => {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith("/messages")) return base;
  return base.endsWith("/v1") ? `${base}/messages` : `${base}/v1/messages`;
};
var chatCompletionsEndpoint = (baseUrl) => {
  const base = normalizeBaseUrl(baseUrl);
  if (base.endsWith("/chat/completions")) return base;
  return base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
};
var geminiGenerateContentEndpoint = (baseUrl, model) => {
  const base = normalizeBaseUrl(baseUrl);
  return `${base}/models/${encodeURIComponent(model)}:generateContent`;
};
var textFromContent = (content) => Array.isArray(content) ? content.map((part) => typeof part === "object" && part !== null && "text" in part ? String(part.text ?? "") : "").join("") : typeof content === "string" ? content : "";
var parseToolArguments = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
var usageFromResponse = (response) => {
  const usage = response.data?.usage;
  return typeof usage === "object" && usage !== null ? usage : void 0;
};
var parseResponses = (response) => {
  const output = Array.isArray(response.data?.output) ? response.data?.output : [];
  const text = typeof response.data?.output_text === "string" ? response.data.output_text : output.map((item) => textFromContent(item.content)).join("");
  const toolCall = output.find((item) => item.type === "function_call");
  return {
    response,
    text,
    eventTypes: output.map((item) => String(item.type ?? "unknown")),
    usage: usageFromResponse(response),
    finishReason: typeof response.data?.status === "string" ? response.data.status : void 0,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.call_id ?? toolCall.id ?? ""), name: String(toolCall.name ?? ""), arguments: parseToolArguments(toolCall.arguments) } : void 0
  };
};
var parseMessages = (response) => {
  const content = Array.isArray(response.data?.content) ? response.data.content : [];
  const thinking = content.find((item) => item.type === "thinking" || item.type === "redacted_thinking");
  const toolCall = content.find((item) => item.type === "tool_use");
  return {
    response,
    text: content.filter((item) => item.type === "text").map((item) => String(item.text ?? "")).join(""),
    eventTypes: content.map((item) => String(item.type ?? "unknown")),
    usage: usageFromResponse(response),
    finishReason: typeof response.data?.stop_reason === "string" ? response.data.stop_reason : void 0,
    signature: typeof thinking?.signature === "string" ? thinking.signature : void 0,
    thinkingText: typeof thinking?.thinking === "string" ? thinking.thinking : void 0,
    // Keep the raw block: redacted_thinking must be replayed in its original
    // shape (data field, no signature) or the official endpoint rejects it.
    thinkingBlock: thinking ? { ...thinking } : void 0,
    toolCalled: Boolean(toolCall),
    toolCall: toolCall ? { id: String(toolCall.id ?? ""), name: String(toolCall.name ?? ""), arguments: toolCall.input } : void 0
  };
};
var parseGeminiGenerateContent = (response) => {
  const candidates = Array.isArray(response.data?.candidates) ? response.data.candidates : [];
  const content = typeof candidates[0]?.content === "object" && candidates[0].content !== null ? candidates[0].content : {};
  const parts = Array.isArray(content.parts) ? content.parts : [];
  const functionCall = parts.find((part) => typeof part.functionCall === "object" && part.functionCall !== null);
  const call = functionCall?.functionCall;
  const firstCandidate = candidates[0];
  return {
    response,
    text: parts.filter((part) => typeof part.text === "string").map((part) => String(part.text)).join(""),
    eventTypes: parts.map((part) => part.functionCall ? "function_call" : "text"),
    usage: typeof response.data?.usageMetadata === "object" && response.data.usageMetadata !== null ? response.data.usageMetadata : void 0,
    finishReason: typeof firstCandidate?.finishReason === "string" ? firstCandidate.finishReason : void 0,
    toolCalled: Boolean(call),
    toolCall: call ? { id: String(call.id ?? call.name ?? ""), name: String(call.name ?? ""), arguments: call.args } : void 0
  };
};
var parseChatCompletions = (response) => {
  const choices = Array.isArray(response.data?.choices) ? response.data.choices : [];
  const message = typeof choices[0]?.message === "object" && choices[0].message !== null ? choices[0].message : {};
  const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  const toolCall = toolCalls[0];
  const functionCall = typeof toolCall?.function === "object" && toolCall.function !== null ? toolCall.function : void 0;
  return {
    response,
    text: textFromContent(message.content),
    eventTypes: toolCall ? ["tool_call"] : ["message"],
    usage: usageFromResponse(response),
    finishReason: typeof choices[0]?.finish_reason === "string" ? choices[0].finish_reason : void 0,
    toolCalled: Boolean(toolCall && functionCall),
    toolCall: toolCall && functionCall ? {
      id: String(toolCall.id ?? ""),
      name: String(functionCall.name ?? ""),
      arguments: parseToolArguments(functionCall.arguments)
    } : void 0
  };
};
var openAiLike = (provider) => ({
  provider,
  surface: "responses",
  basic: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: "Return exactly: audit-ready." }
  }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      input: "Return a JSON object with exactly one property named status and value ok.",
      text: { format: { type: "json_schema", name: "audit_status", strict: true, schema: { type: "object", properties: { status: { type: "string", enum: ["ok"] } }, required: ["status"], additionalProperties: false } } }
    }
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      input: "Call audit_sum with a=19 and b=23. Do not answer in prose.",
      tools: [{ type: "function", name: "audit_sum", description: "Adds two integers.", parameters: { type: "object", properties: { a: { type: "integer" }, b: { type: "integer" } }, required: ["a", "b"], additionalProperties: false }, strict: true }]
    }
  }),
  reasoning: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: "What is 19 multiplied by 23? Return only the number.", reasoning: { effort: "high" } }
  }),
  context: (baseUrl, apiKey, model, document) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      input: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.

${document}`,
      max_output_tokens: 64
    }
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: `${instruction}

\u6E90\u7801\uFF1A
${source}`, max_output_tokens: 512 }
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: "Return exactly: audit-ready.", stream: true }
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: `Remember this exact state marker: ${marker}. Reply with acknowledged.`, store: true }
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, previous_response_id: result.response.data?.id, input: `What was the exact state marker? Return only ${marker}.` }
  }),
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: { model, input: [{ role: "user", content: [{ type: "input_text", text: prefix }, { type: "input_text", text: "Return exactly: cache-ready." }] }] }
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => ({
    url: endpoint(baseUrl, "/responses"),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      previous_response_id: result.response.data?.id,
      input: [{ type: "function_call_output", call_id: result.toolCall?.id, output: toolOutput }]
    }
  }),
  parse: parseResponses
});
var anthropicHeaders = (apiKey) => ({
  "x-api-key": apiKey,
  Authorization: `Bearer ${apiKey}`,
  "anthropic-version": "2023-06-01"
});
var anthropic = {
  provider: "anthropic",
  surface: "messages",
  basic: (baseUrl, apiKey, model) => ({ url: anthropicEndpoint(baseUrl), headers: anthropicHeaders(apiKey), body: { model, max_tokens: 128, messages: [{ role: "user", content: "Return exactly: audit-ready." }] } }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 256,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { status: { type: "string", enum: ["ok"] } },
            required: ["status"],
            additionalProperties: false
          }
        }
      },
      messages: [{ role: "user", content: "Return a JSON object with exactly one property named status and value ok." }]
    }
  }),
  tool: (baseUrl, apiKey, model) => ({ url: anthropicEndpoint(baseUrl), headers: anthropicHeaders(apiKey), body: { model, max_tokens: 256, tools: [{ name: "audit_sum", description: "Adds two integers.", input_schema: { type: "object", properties: { a: { type: "integer" }, b: { type: "integer" } }, required: ["a", "b"], additionalProperties: false } }], tool_choice: { type: "tool", name: "audit_sum" }, messages: [{ role: "user", content: "Call audit_sum with a=19 and b=23. Do not answer in prose." }] } }),
  reasoning: (baseUrl, apiKey, model) => {
    const isHaiku = /haiku/i.test(model);
    const body = {
      model,
      // Anthropic counts thinking and final output against max_tokens. A small
      // cap can make adaptive thinking silently disappear.
      max_tokens: 16e3,
      thinking: isHaiku ? { type: "enabled", budget_tokens: 4e3 } : { type: "adaptive", display: "summarized" },
      messages: [{ role: "user", content: "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm." }]
    };
    if (!isHaiku) body.output_config = { effort: "high" };
    return { url: anthropicEndpoint(baseUrl), headers: anthropicHeaders(apiKey), body };
  },
  context: (baseUrl, apiKey, model, document) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 64,
      messages: [{ role: "user", content: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.

${document}` }]
    }
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 512, messages: [{ role: "user", content: `${instruction}

\u6E90\u7801\uFF1A
${source}` }] }
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: "user", content: "Return exactly: audit-ready." }], stream: true }
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: "user", content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] }
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: "user", content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }, { role: "assistant", content: result.response.data?.content }, { role: "user", content: `What was the exact state marker? Return only ${marker}.` }] }
  }),
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: { model, max_tokens: 128, messages: [{ role: "user", content: [{ type: "text", text: prefix, cache_control: { type: "ephemeral" } }, { type: "text", text: "Return exactly: cache-ready." }] }] }
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 256,
      messages: [
        { role: "user", content: "Call audit_sum with a=19 and b=23. Do not answer in prose." },
        { role: "assistant", content: result.response.data?.content },
        { role: "user", content: [{ type: "tool_result", tool_use_id: result.toolCall?.id, content: toolOutput }] }
      ]
    }
  }),
  signatureContinuation: (baseUrl, apiKey, model, thinkingBlock, assistantText) => ({
    url: anthropicEndpoint(baseUrl),
    headers: anthropicHeaders(apiKey),
    body: {
      model,
      max_tokens: 256,
      messages: [
        { role: "user", content: "Find the greatest common divisor of 2378 and 1547 using the Euclidean algorithm." },
        {
          role: "assistant",
          content: [
            // Replay the first-turn block verbatim: (thinking, signature) for a
            // plain thinking block, (data) for a redacted_thinking block.
            { ...thinkingBlock },
            { type: "text", text: assistantText || "The greatest common divisor is 1." }
          ]
        },
        { role: "user", content: "Now return only the final gcd." }
      ]
    }
  }),
  parse: parseMessages
};
var openRouter = {
  provider: "openrouter",
  surface: "chat_completions",
  basic: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [{ role: "user", content: "Return exactly: audit-ready." }],
      max_tokens: 128
    }
  }),
  stream: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [{ role: "user", content: "Return exactly: audit-ready." }],
      max_tokens: 128,
      stream: true
    }
  }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: "Return a JSON object with exactly one property named status and value ok." }],
      response_format: { type: "json_schema", json_schema: { name: "audit_status", strict: true, schema: { type: "object", properties: { status: { type: "string", enum: ["ok"] } }, required: ["status"], additionalProperties: false } } }
    }
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: "Call audit_sum with a=19 and b=23. Do not answer in prose." }],
      tools: [{ type: "function", function: { name: "audit_sum", description: "Adds two integers.", parameters: { type: "object", properties: { a: { type: "integer" }, b: { type: "integer" } }, required: ["a", "b"], additionalProperties: false } } }],
      tool_choice: "required"
    }
  }),
  reasoning: (baseUrl, apiKey, model) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      max_tokens: 256,
      messages: [{ role: "user", content: "Solve this multi-step arithmetic constraint and return only the final integer: ((19 * 23) + (17 * 11)) - 29." }],
      include_reasoning: true,
      reasoning: { effort: "high" }
    }
  }),
  context: (baseUrl, apiKey, model, document) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [{ role: "user", content: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.

${document}` }],
      max_tokens: 64
    }
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [{ role: "user", content: `${instruction}

\u6E90\u7801\uFF1A
${source}` }],
      max_tokens: 512
    }
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [{ role: "user", content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }],
      max_tokens: 128
    }
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => {
    const choices = Array.isArray(result.response.data?.choices) ? result.response.data.choices : [];
    const assistant = choices[0]?.message || { role: "assistant", content: result.text };
    return {
      url: chatCompletionsEndpoint(baseUrl),
      headers: { Authorization: `Bearer ${apiKey}` },
      body: {
        model,
        messages: [
          { role: "user", content: `Remember this exact state marker: ${marker}. Reply with acknowledged.` },
          assistant,
          { role: "user", content: `What was the exact state marker? Return only ${marker}.` }
        ],
        max_tokens: 128
      }
    };
  },
  cache: (baseUrl, apiKey, model, prefix) => ({
    url: chatCompletionsEndpoint(baseUrl),
    headers: { Authorization: `Bearer ${apiKey}` },
    body: {
      model,
      messages: [
        { role: "user", content: [{ type: "text", text: prefix, cache_control: { type: "ephemeral" } }, { type: "text", text: "Return exactly: cache-ready." }] }
      ],
      max_tokens: 128
    }
  }),
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => {
    const choices = Array.isArray(result.response.data?.choices) ? result.response.data.choices : [];
    const assistant = choices[0]?.message;
    return {
      url: chatCompletionsEndpoint(baseUrl),
      headers: { Authorization: `Bearer ${apiKey}` },
      body: {
        model,
        max_tokens: 256,
        messages: [
          { role: "user", content: "Call audit_sum with a=19 and b=23. Do not answer in prose." },
          assistant,
          { role: "tool", tool_call_id: result.toolCall?.id, content: toolOutput }
        ]
      }
    };
  },
  parse: parseChatCompletions
};
var geminiHeaders = (apiKey) => {
  if (apiKey.startsWith("ya29.") || apiKey.startsWith("eyJ") || apiKey.length > 100) {
    return { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };
  }
  return { "x-goog-api-key": apiKey, "Content-Type": "application/json" };
};
var gemini = {
  provider: "gemini",
  surface: "interactions",
  basic: (baseUrl, apiKey, model) => ({ url: geminiGenerateContentEndpoint(baseUrl, model), headers: geminiHeaders(apiKey), body: { contents: [{ role: "user", parts: [{ text: "Return exactly: audit-ready." }] }] } }),
  strictJson: (baseUrl, apiKey, model) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: "user", parts: [{ text: "Return a JSON object with exactly one property named status and value ok." }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { status: { type: "STRING", enum: ["ok"] } }, required: ["status"] }
      }
    }
  }),
  tool: (baseUrl, apiKey, model) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: "user", parts: [{ text: "Call audit_sum with a=19 and b=23. Do not answer in prose." }] }],
      tools: [{ functionDeclarations: [{ name: "audit_sum", description: "Adds two integers.", parameters: { type: "OBJECT", properties: { a: { type: "INTEGER" }, b: { type: "INTEGER" } }, required: ["a", "b"] } }] }],
      toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["audit_sum"] } }
    }
  }),
  reasoning: (baseUrl, apiKey, model) => ({ url: geminiGenerateContentEndpoint(baseUrl, model), headers: geminiHeaders(apiKey), body: { contents: [{ role: "user", parts: [{ text: "Solve this multi-step arithmetic constraint and return only the final integer: ((19 * 23) + (17 * 11)) - 29." }] }], generationConfig: { thinkingConfig: { thinkingLevel: "HIGH" } } } }),
  context: (baseUrl, apiKey, model, document) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: "user", parts: [{ text: `Find the exact value after FIXED_CONTEXT_MARKER in this document. Return only that value.

${document}` }] }],
      generationConfig: { maxOutputTokens: 64 }
    }
  }),
  codeRepair: (baseUrl, apiKey, model, instruction, source) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: { contents: [{ role: "user", parts: [{ text: `${instruction}

\u6E90\u7801\uFF1A
${source}` }] }], generationConfig: { maxOutputTokens: 512 } }
  }),
  state: (baseUrl, apiKey, model, marker) => ({
    url: geminiGenerateContentEndpoint(baseUrl, model),
    headers: geminiHeaders(apiKey),
    body: {
      contents: [{ role: "user", parts: [{ text: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] }],
      generationConfig: { maxOutputTokens: 128 }
    }
  }),
  stateContinuation: (baseUrl, apiKey, model, result, marker) => {
    const candidates = Array.isArray(result.response.data?.candidates) ? result.response.data.candidates : [];
    const firstCandidate = candidates[0];
    const content = typeof firstCandidate === "object" && firstCandidate !== null ? firstCandidate.content : void 0;
    const parts = Array.isArray(content?.parts) ? content?.parts : [];
    const modelPart = parts[0] || { text: result.text || "acknowledged" };
    return {
      url: geminiGenerateContentEndpoint(baseUrl, model),
      headers: geminiHeaders(apiKey),
      body: {
        contents: [
          { role: "user", parts: [{ text: `Remember this exact state marker: ${marker}. Reply with acknowledged.` }] },
          { role: "model", parts: [modelPart] },
          { role: "user", parts: [{ text: `What was the exact state marker? Return only ${marker}.` }] }
        ],
        generationConfig: { maxOutputTokens: 128 }
      }
    };
  },
  toolContinuation: (baseUrl, apiKey, model, result, toolOutput) => {
    const candidates = Array.isArray(result.response.data?.candidates) ? result.response.data.candidates : [];
    const firstCandidate = candidates[0];
    const content = typeof firstCandidate === "object" && firstCandidate !== null ? firstCandidate.content : void 0;
    const parts = Array.isArray(content?.parts) ? content?.parts : [];
    const modelPart = parts[0] || {
      functionCall: { name: result.toolCall?.name || "audit_sum", args: result.toolCall?.arguments || { a: 19, b: 23 } }
    };
    return {
      url: geminiGenerateContentEndpoint(baseUrl, model),
      headers: geminiHeaders(apiKey),
      body: {
        contents: [
          { role: "user", parts: [{ text: "Call audit_sum with a=19 and b=23. Do not answer in prose." }] },
          { role: "model", parts: [modelPart] },
          { role: "user", parts: [{ functionResponse: { name: result.toolCall?.name || "audit_sum", response: { result: Number(toolOutput) || 42 } } }] }
        ]
      }
    };
  },
  parse: parseGeminiGenerateContent
};
var PROVIDER_ADAPTERS = {
  openai: openAiLike("openai"),
  xai: openAiLike("xai"),
  anthropic,
  gemini,
  openrouter: openRouter
};
function detectAuditProvider(model, requested) {
  if (requested && requested !== "auto") return requested;
  const id = model.toLowerCase();
  if (id.includes("claude") || id.includes("fable") || id.includes("opus") || id.includes("sonnet") || id.includes("haiku")) {
    return "anthropic";
  }
  if (id.includes("gemini")) return "gemini";
  if (id.includes("grok")) return "xai";
  if (id.includes("gpt") || id.includes("o1") || id.includes("o3") || id.includes("o4") || id.includes("chatgpt")) {
    return "openai";
  }
  return "openrouter";
}

// src/engine/audit/suite.ts
var providers = ["openai", "anthropic", "gemini", "xai", "openrouter"];
var probe = (id, layer, title, domains, fixture, scorer, maxInputTokens = 2048, maxOutputTokens = 512) => ({
  id,
  layer,
  title,
  domains,
  applicableProviders: [...providers],
  fixture,
  scorer,
  maxInputTokens,
  maxOutputTokens,
  retries: 1
});
var BALANCED_SUITE = [
  probe("p0-model-discovery", "P0", "\u6A21\u578B\u4E0E\u7248\u672C\u53D1\u73B0", ["protocol"], "model-discovery", "metadata"),
  probe("p0-native-route", "P0", "\u539F\u751F API \u8DEF\u7531", ["protocol"], "native-route", "http-status"),
  probe("p0-auth-shape", "P0", "\u8BA4\u8BC1\u5934\u4E0E\u9519\u8BEF\u8BED\u4E49", ["protocol"], "authentication", "http-status"),
  probe("p0-stream-events", "P0", "\u6D41\u5F0F\u4E8B\u4EF6\u987A\u5E8F", ["protocol"], "stream-events", "event-order"),
  probe("p0-strict-json", "P0", "\u4E25\u683C JSON Schema", ["structured_output"], "strict-json", "json-schema"),
  probe("p0-tool-shape", "P0", "\u5DE5\u5177\u8C03\u7528\u7ED3\u6784", ["tools"], "tool-shape", "tool-schema"),
  probe("p0-invalid-parameter", "P0", "\u975E\u6CD5\u53C2\u6570\u56DE\u663E", ["protocol"], "invalid-parameter", "error-contract"),
  probe("p1-reasoning-config", "P1", "\u63A8\u7406\u914D\u7F6E\u900F\u4F20", ["reasoning"], "reasoning-config", "parameter-response"),
  probe("p1-state-continuity", "P1", "\u8DE8\u8F6E\u72B6\u6001\u8FDE\u7EED\u6027", ["tools"], "state-continuity", "continuation"),
  probe("p1-tool-roundtrip", "P1", "\u53D7\u63A7\u5DE5\u5177\u56DE\u5408", ["tools"], "tool-roundtrip", "tool-result-consumption"),
  probe("p1-signature-continuity", "P1", "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027", ["protocol"], "signature-continuity", "opaque-signature"),
  probe("p1-cache-semantics", "P1", "\u7F13\u5B58\u8BED\u4E49", ["protocol"], "cache-semantics", "cache-consistency"),
  probe("p2-constraint-json", "P2", "\u7EA6\u675F JSON \u4EFB\u52A1", ["structured_output", "reasoning"], "constraint-json", "deterministic-json"),
  probe("p2-tool-planning", "P2", "\u53CC\u56DE\u5408\u5DE5\u5177\u89C4\u5212", ["tools", "reasoning"], "tool-planning", "tool-result-consumption"),
  probe("p2-code-repair-a", "P2", "\u4EE3\u7801\u8865\u4E01\uFF1A\u7B97\u672F\u6A21\u5757", ["code"], "code-repair-arithmetic", "patch-hidden-test"),
  probe("p2-code-repair-b", "P2", "\u4EE3\u7801\u8865\u4E01\uFF1A\u96C6\u5408\u6A21\u5757", ["code"], "code-repair-set", "patch-hidden-test"),
  probe("p2-chart-extraction", "P2", "\u56FE\u8868\u5B57\u6BB5\u63D0\u53D6", ["vision"], "chart-extraction", "vision-fields"),
  probe("p2-context-start", "P2", "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u5F00\u5934", ["context"], "context-start", "needle-conflict", 64e3, 512),
  probe("p2-context-middle", "P2", "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u4E2D\u90E8", ["context"], "context-middle", "needle-conflict", 64e3, 512),
  probe("p2-context-end", "P2", "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u7ED3\u5C3E", ["context"], "context-end", "needle-conflict", 64e3, 512),
  probe("p3-repeat-a", "P3", "\u8FD0\u884C\u8D28\u91CF\u6837\u672C A", ["runtime"], "repeat-a", "latency-success"),
  probe("p3-repeat-b", "P3", "\u8FD0\u884C\u8D28\u91CF\u6837\u672C B", ["runtime"], "repeat-b", "latency-success"),
  probe("p3-repeat-c", "P3", "\u8FD0\u884C\u8D28\u91CF\u6837\u672C C", ["runtime"], "repeat-c", "latency-success"),
  probe("p3-repeat-d", "P3", "\u8FD0\u884C\u8D28\u91CF\u6837\u672C D", ["runtime"], "repeat-d", "latency-success")
];
var AUDIT_PRESETS = {
  quick: {
    label: "\u5FEB\u901F",
    description: "\u57FA\u7840\u8FDE\u901A\u3001\u8BA4\u8BC1\u3001\u6D41\u5F0F\u4E8B\u4EF6\u3001\u4E25\u683C JSON \u4E0E\u5DE5\u5177\u7ED3\u6784\uFF0C\u9002\u5408\u5148\u786E\u8BA4\u63A5\u53E3\u5F62\u72B6\u3002",
    probeIds: [
      "p0-model-discovery",
      "p0-native-route",
      "p0-auth-shape",
      "p0-stream-events",
      "p0-strict-json",
      "p0-tool-shape"
    ]
  },
  balanced: {
    label: "\u6807\u51C6",
    description: "\u6807\u51C6\u5E73\u8861\u6863\uFF0C\u8986\u76D6\u534F\u8BAE\u4FDD\u771F\u3001\u72B6\u6001\u8FDE\u7EED\u6027\u4E0E\u6838\u5FC3\u4EE3\u7801\u903B\u8F91\u3002",
    probeIds: [
      "p0-model-discovery",
      "p0-native-route",
      "p0-auth-shape",
      "p0-stream-events",
      "p0-strict-json",
      "p0-tool-shape",
      "p0-invalid-parameter",
      "p1-reasoning-config",
      "p1-state-continuity",
      "p1-tool-roundtrip",
      "p1-signature-continuity",
      "p1-cache-semantics",
      "p2-constraint-json",
      "p2-tool-planning",
      "p2-code-repair-a",
      "p2-code-repair-b"
    ]
  },
  deep: {
    label: "\u5168\u91CF",
    description: "\u5168\u91CF 24 \u9879\u6DF1\u5EA6\u5BA1\u8BA1\uFF0C\u5305\u542B\u8D85\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\u68C0\u7D22\u4E0E\u591A\u6B21\u8FD0\u884C\u8D28\u91CF\u6837\u672C\u3002",
    probeIds: BALANCED_SUITE.map((item) => item.id)
  }
};
function selectSuite(profile, selectedProbeIds) {
  if (selectedProbeIds) {
    const selected = new Set(selectedProbeIds);
    return BALANCED_SUITE.filter((item) => selected.has(item.id));
  }
  return BALANCED_SUITE.filter((item) => AUDIT_PRESETS[profile].probeIds.includes(item.id));
}
function hashFixture(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

// src/engine/audit/statistics.ts
var quantile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[index] ?? 0;
};
var mean = (values) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
function seededRandom(seed) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i += 1) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state += 1831565813;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function bootstrapDifference(target, baseline, seed, rounds = 1e4) {
  if (!target.length || !baseline.length) return { delta: 0, interval: [0, 0] };
  const rng = seededRandom(seed);
  const differences = [];
  for (let round = 0; round < rounds; round += 1) {
    const sample = (source) => Array.from({ length: source.length }, () => source[Math.floor(rng() * source.length)] ?? 0);
    differences.push(mean(sample(target)) - mean(sample(baseline)));
  }
  return { delta: mean(target) - mean(baseline), interval: [quantile(differences, 0.025), quantile(differences, 0.975)] };
}
function determineConclusion(metrics) {
  const degradedDomains = metrics.filter((metric) => metric.confidenceInterval && metric.confidenceInterval[1] <= -0.15);
  const independentDomains = new Set(degradedDomains.map((metric) => metric.domain));
  if (independentDomains.size >= 2) return "suspect_downgraded";
  if (!metrics.some((metric) => metric.baselineScores?.length)) return "inconclusive";
  return "consistent";
}

// src/engine/audit/protocolValidators.ts
var isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
var isNonNegativeInteger = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0;
function validateResponsesEnvelope(data, requestedModel) {
  const issues = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ["response_not_object"] };
  if (typeof data.id !== "string" || !data.id.startsWith("resp_")) issues.push("id_prefix_invalid");
  if (typeof data.object !== "string" || data.object !== "response") issues.push("object_invalid");
  if (typeof data.model !== "string" || !modelMatches(data.model, requestedModel)) issues.push("model_mismatch");
  if (!Array.isArray(data.output)) issues.push("output_not_array");
  if (data.status !== void 0 && !["completed", "incomplete", "failed"].includes(String(data.status))) issues.push("status_invalid");
  return scoreValidation(issues, 5);
}
function validateChatCompletionEnvelope(data, requestedModel, strictId = true) {
  const issues = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ["response_not_object"] };
  if (typeof data.id !== "string" || strictId && !data.id.startsWith("chatcmpl-")) issues.push("id_prefix_invalid");
  if (data.object !== "chat.completion") issues.push("object_invalid");
  if (typeof data.model !== "string" || !modelMatches(data.model, requestedModel)) issues.push("model_mismatch");
  if (!Array.isArray(data.choices) || data.choices.length === 0) {
    issues.push("choices_invalid");
  } else {
    const firstChoice = data.choices[0];
    if (!isRecord(firstChoice)) issues.push("choice_not_object");
    else {
      if (!["stop", "length", "tool_calls", "content_filter", "function_call", null].includes(firstChoice.finish_reason)) issues.push("finish_reason_invalid");
      const message = firstChoice.message;
      if (!isRecord(message) || message.role !== "assistant") issues.push("assistant_message_invalid");
    }
  }
  const usage = data.usage;
  if (!isRecord(usage)) {
    issues.push("usage_missing");
  } else {
    for (const field of ["prompt_tokens", "completion_tokens", "total_tokens"]) {
      if (!isNonNegativeInteger(usage[field])) issues.push(`usage_${field}_invalid`);
    }
  }
  return scoreValidation(issues, 7);
}
function validateGeminiGenerateContent(data, requestedModel) {
  const issues = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ["response_not_object"] };
  const candidates = data.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    issues.push("candidates_invalid");
  } else {
    const first = candidates[0];
    if (!isRecord(first)) {
      issues.push("candidate_not_object");
    } else {
      const content = first.content;
      if (!isRecord(content) || content.role !== "model" || !Array.isArray(content.parts)) issues.push("model_content_invalid");
      if (first.finishReason !== void 0 && typeof first.finishReason !== "string") issues.push("finish_reason_invalid");
    }
  }
  const usage = data.usageMetadata;
  if (!isRecord(usage)) {
    issues.push("usage_missing");
  } else {
    for (const field of ["promptTokenCount", "candidatesTokenCount", "totalTokenCount"]) {
      if (!isNonNegativeInteger(usage[field])) issues.push(`usage_${field}_invalid`);
    }
  }
  return scoreValidation(issues, 5);
}
function validateAnthropicMessage(data, requestedModel, strictId = true) {
  const issues = [];
  if (!isRecord(data)) return { pass: false, score: 0, issues: ["response_not_object"] };
  if (typeof data.id !== "string" || strictId && !data.id.startsWith("msg_")) issues.push("id_prefix_invalid");
  if (data.type !== "message") issues.push("type_invalid");
  if (data.role !== "assistant") issues.push("role_invalid");
  if (typeof data.model !== "string" || !modelMatches(data.model, requestedModel)) issues.push("model_mismatch");
  if (!Array.isArray(data.content)) issues.push("content_not_array");
  if (!["end_turn", "max_tokens", "stop_sequence", "tool_use", null].includes(data.stop_reason)) issues.push("stop_reason_invalid");
  const usage = data.usage;
  if (!isRecord(usage)) {
    issues.push("usage_missing");
  } else {
    for (const field of ["input_tokens", "output_tokens"]) {
      if (!isNonNegativeInteger(usage[field])) issues.push(`usage_${field}_invalid`);
    }
  }
  return scoreValidation(issues, 7);
}
function modelMatches(actual, requested) {
  return actual === requested || actual.includes(requested) || requested.includes(actual);
}
function scoreValidation(issues, checks) {
  const score = Math.max(0, Math.round((checks - issues.length) / checks * 100));
  return { pass: issues.length === 0, score, issues };
}

// src/engine/audit/localFixtures.ts
function createNeedleFixture(seed, position, targetTokens = 8e3) {
  const expectedAnswer = `needle-answer-${seed}-${position}`;
  const marker = `FIXED_CONTEXT_MARKER: ${expectedAnswer}`;
  const targetChars = Math.max(4e3, targetTokens * 4);
  const fillerUnit = `The archive record ${seed} contains stable reference text for controlled retrieval. `;
  const filler = fillerUnit.repeat(Math.ceil(targetChars / fillerUnit.length));
  const usable = filler.slice(0, targetChars - marker.length - 2);
  const split = position === "start" ? 0 : position === "middle" ? Math.floor(usable.length / 2) : usable.length;
  const document = `${usable.slice(0, split)}
${marker}
${usable.slice(split)}`;
  return { seed, position, document, expectedAnswer, estimatedTokens: Math.ceil(document.length / 4) };
}
function scoreNeedleResponse(output, expectedAnswer) {
  const normalized = output.trim().toLowerCase();
  const expected = expectedAnswer.trim().toLowerCase();
  const passed = normalized.includes(expected);
  return { score: passed ? 100 : 0, passed };
}
function createCodeRepairFixture(id) {
  if (id === "arithmetic") {
    return {
      id,
      instruction: "\u4FEE\u590D\u7B97\u672F\u6A21\u5757\u4E2D\u7684\u7A0E\u540E\u603B\u4EF7\u8BA1\u7B97\uFF0C\u4FDD\u7559\u5BFC\u51FA\u8BED\u53E5\uFF0C\u5E76\u53EA\u8FD4\u56DE\u4FEE\u590D\u540E\u7684\u4EE3\u7801\u3002",
      source: "function totalWithTax(price, taxRate) {\n  return price + taxRate;\n}\nmodule.exports = { totalWithTax };",
      expectedTokens: ["return price * (1 + taxRate);", "module.exports = { totalWithTax };"],
      acceptancePatterns: [
        [/return\s+price\s*\*\s*\(\s*1\s*\+\s*taxRate\s*\)/i, /return\s+price\s*\+\s*price\s*\*\s*taxRate/i, /return\s+price\s*\+\s*\(\s*price\s*\*\s*taxRate\s*\)/i, /price\s*\*\s*\(\s*1\s*\+\s*taxRate\s*\)/i],
        [/module\.exports\s*=\s*\{\s*totalWithTax\s*\}/i, /export\s+(default\s+)?(function\s+)?totalWithTax/i, /export\s*\{\s*totalWithTax\s*\}/i, /function\s+totalWithTax/i]
      ]
    };
  }
  return {
    id,
    instruction: "\u4FEE\u590D\u96C6\u5408\u6A21\u5757\uFF0C\u4F7F\u51FD\u6570\u8FD4\u56DE\u53BB\u91CD\u540E\u4E14\u4FDD\u6301\u9996\u6B21\u51FA\u73B0\u987A\u5E8F\u7684\u6570\u7EC4\uFF0C\u4FDD\u7559\u5BFC\u51FA\u8BED\u53E5\uFF0C\u5E76\u53EA\u8FD4\u56DE\u4FEE\u590D\u540E\u7684\u4EE3\u7801\u3002",
    source: "function unique(values) {\n  return values.sort();\n}\nmodule.exports = { unique };",
    expectedTokens: ["return [...new Set(values)];", "module.exports = { unique };"],
    acceptancePatterns: [
      [/return\s+\[\.\.\.\s*new\s+Set\s*\(\s*values\s*\)\s*\]/i, /return\s+Array\.from\s*\(\s*new\s+Set\s*\(\s*values\s*\)\s*\)/i, /new\s+Set\s*\(\s*values\s*\)/i, /values\.filter\s*\(/i],
      [/module\.exports\s*=\s*\{\s*unique\s*\}/i, /export\s+(default\s+)?(function\s+)?unique/i, /export\s*\{\s*unique\s*\}/i, /function\s+unique/i]
    ]
  };
}
function scoreCodeRepairResponse(output, fixture) {
  const matched = [];
  const missing = [];
  const requirements = fixture.acceptancePatterns.length > 0 ? fixture.acceptancePatterns : fixture.expectedTokens.map((token) => [new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")]);
  requirements.forEach((patterns, index) => {
    const pattern = patterns.find((candidate) => candidate.test(output));
    if (pattern) matched.push(pattern.source);
    else missing.push(index);
  });
  return { score: Math.round(matched.length / requirements.length * 100), passed: missing.length === 0, matched, missing };
}

// src/engine/transport/sseReader.ts
async function* readSSEEvents(response, signal) {
  if (!response.body) throw new Error("Response body is null, cannot stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventName = "";
  let dataLines = [];
  const flush = () => {
    if (dataLines.length === 0) {
      eventName = "";
      return null;
    }
    const rawData = dataLines.join("\n");
    dataLines = [];
    const currentEvent = eventName || "message";
    eventName = "";
    if (rawData === "[DONE]") return null;
    try {
      return { event: currentEvent, data: JSON.parse(rawData) };
    } catch {
      return { event: currentEvent, data: rawData };
    }
  };
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line === "") {
          const event2 = flush();
          if (event2) yield event2;
          continue;
        }
        if (line.startsWith(":")) continue;
        if (line.startsWith("event:")) eventName = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
    }
    const event = flush();
    if (event) yield event;
  } finally {
    reader.releaseLock();
  }
}

// src/content/baselines/official-model-claims.json
var official_model_claims_default = {
  schemaVersion: "2.0",
  catalogVersion: "2026-08-17",
  description: "API-QuickCheck \u5B98\u65B9\u6A21\u578B\u80FD\u529B\u58F0\u660E\u57FA\u7EBF\u4E0E\u9879\u76EE\u522B\u540D\u6620\u5C04\u8868 (\u5305\u542B\u9879\u76EE\u76EE\u6807\u522B\u540D\u4E0E\u5B98\u65B9\u53C2\u8003\u5BF9\u7167\u57FA\u51C6)",
  evaluationSemantics: {
    supported: "\u5B98\u65B9\u660E\u786E\u58F0\u660E\u652F\u6301\u7684\u80FD\u529B\u3002\u63A2\u9488\u5931\u8D25\u5C06\u8BA1\u5165\u6A21\u578B\u964D\u7EA7/\u63BA\u6C34\u5224\u5B9A\u4E0E\u80FD\u529B\u6263\u5206\u3002",
    unsupported: "\u5B98\u65B9\u660E\u786E\u4E0D\u652F\u6301\u7684\u80FD\u529B\u3002\u63A2\u9488\u76F4\u63A5\u8DF3\u8FC7\uFF0C\u6807\u8BB0\u4E3A not_claimed / not_applicable\uFF0C\u4E0D\u8BA1\u5165\u6263\u5206\u3002",
    unknown: "\u5B98\u65B9\u8D44\u6599\u672A\u660E\u786E\u8BB0\u8F7D\u6216\u5B58\u5728\u6B67\u4E49\u7684\u80FD\u529B\u3002\u53EF\u4F5C\u4E3A\u63A2\u7D22\u6027\u63A2\u9488\u8FD0\u884C\uFF0C\u4F46\u6D4B\u8BD5\u5931\u8D25\u4E0D\u8BA1\u5165\u5B98\u65B9\u7EA7\u964D\u7EA7\u5B9A\u8BBA\u3002"
  },
  models: [
    {
      projectModelId: "gpt-5.6-sol",
      officialModelId: "gpt-5.6-sol",
      provider: "openai",
      displayName: "OpenAI GPT-5.6 Sol (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gpt-5.6-sol",
        intendedTier: "flagship_reasoning_and_code",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gpt-5.6-sol", "gpt-5.6"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "OpenAI Models & API Reference",
        sourceUrls: [
          "https://developers.openai.com/api/docs/models",
          "https://platform.openai.com/docs/models"
        ],
        notes: "OpenAI \u5B98\u65B9\u6A21\u578B\u76EE\u5F55\u548C\u72EC\u7ACB\u6A21\u578B\u9875\u5747\u5217\u51FA exact ID 'gpt-5.6-sol'\u3002"
      },
      claims: {
        contextWindowTokens: 105e4,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["effort"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Model ID gpt-5.6-sol; text and image input; text output; 1,050,000 context window; 128,000 max output tokens; reasoning token support.", sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.6-sol" }],
      notes: [
        "\u76EE\u6807\u5B9A\u4F4D\u4E3A OpenAI \u65B0\u4E00\u4EE3\u65D7\u8230\u590D\u6742\u63A8\u7406\u4E0E\u81EA\u4E3B\u7F16\u7A0B\u57FA\u7EBF\uFF0C\u901A\u8FC7 Responses API \u539F\u751F\u7AEF\u70B9\u63D0\u4F9B\u4E25\u683C\u7ED3\u6784\u5316\u8F93\u51FA\u3002"
      ]
    },
    {
      projectModelId: "gpt-5.6-terra",
      officialModelId: "gpt-5.6-terra",
      provider: "openai",
      displayName: "OpenAI GPT-5.6 Terra (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gpt-5.6-terra",
        intendedTier: "balanced_general",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gpt-5.6-terra"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "OpenAI Models & API Reference",
        sourceUrls: [
          "https://developers.openai.com/api/docs/models"
        ],
        notes: "OpenAI \u5B98\u65B9\u6A21\u578B\u76EE\u5F55\u548C\u72EC\u7ACB\u6A21\u578B\u9875\u5747\u5217\u51FA exact ID 'gpt-5.6-terra'\u3002"
      },
      claims: {
        contextWindowTokens: 105e4,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["effort"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Model ID gpt-5.6-terra; text and image input; text output; 1,050,000 context window; 128,000 max output tokens; reasoning token support.", sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.6-terra" }],
      notes: [
        "\u901A\u7528\u5747\u8861\u5DE5\u4F5C\u9A6C\u6A21\u578B\uFF0C\u9002\u7528\u4E8E\u590D\u6742 Agent \u4EFB\u52A1\u4E0E\u591A\u8F6E\u51FD\u6570\u8C03\u7528\u3002"
      ]
    },
    {
      projectModelId: "gpt-5.6-luna",
      officialModelId: "gpt-5.6-luna",
      provider: "openai",
      displayName: "OpenAI GPT-5.6 Luna (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gpt-5.6-luna",
        intendedTier: "high_throughput_low_latency",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gpt-5.6-luna"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "OpenAI Models",
        sourceUrls: ["https://developers.openai.com/api/docs/models"],
        notes: "OpenAI \u5B98\u65B9\u6A21\u578B\u76EE\u5F55\u548C\u72EC\u7ACB\u6A21\u578B\u9875\u5747\u5217\u51FA exact ID 'gpt-5.6-luna'\u3002"
      },
      claims: {
        contextWindowTokens: 105e4,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: [],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Model ID gpt-5.6-luna; text and image input; text output; 1,050,000 context window; 128,000 max output tokens; reasoning token support.", sourceUrl: "https://developers.openai.com/api/docs/models/gpt-5.6-luna" }],
      notes: [
        "\u9AD8\u541E\u5410\u3001\u4F4E\u5EF6\u8FDF\u57FA\u7EBF\u3002"
      ]
    },
    {
      projectModelId: "claude-fable-5",
      officialModelId: "claude-fable-5",
      provider: "anthropic",
      displayName: "Anthropic Claude Fable 5 (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "claude-fable-5",
        intendedTier: "next_gen_flagship",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["claude-fable-5", "claude-fable"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Anthropic Models Overview",
        sourceUrls: ["https://docs.anthropic.com/en/docs/about-claude/models/overview"],
        notes: "Anthropic \u5B98\u65B9\u6A21\u578B\u603B\u89C8\u548C Messages API \u5747\u5217\u51FA exact ID 'claude-fable-5'\u3002"
      },
      claims: {
        contextWindowTokens: 1e6,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "supported" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["adaptive_thinking", "effort"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Claude API ID claude-fable-5; Adaptive thinking Yes (always on); context window 1M tokens; max output 128k tokens.", sourceUrl: "https://platform.claude.com/docs/en/about-claude/models/overview" }],
      notes: [
        "\u652F\u6301\u539F\u751F Thinking Block\uFF0C\u56DE\u4F20\u52A0\u5BC6 signature \u51ED\u636E\u7EF4\u62A4\u591A\u8F6E\u601D\u8003\u4E0A\u4E0B\u6587\u3002"
      ]
    },
    {
      projectModelId: "claude-opus-5",
      officialModelId: "claude-opus-5",
      provider: "anthropic",
      displayName: "Anthropic Claude Opus 5 (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "claude-opus-5",
        intendedTier: "high_capability_reasoning",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["claude-opus-5"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Anthropic Models Overview",
        sourceUrls: ["https://docs.anthropic.com/en/docs/about-claude/models/overview"],
        notes: "Anthropic \u5B98\u65B9\u6A21\u578B\u603B\u89C8\u548C Messages API \u5747\u5217\u51FA exact ID 'claude-opus-5'\u3002"
      },
      claims: {
        contextWindowTokens: 1e6,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "supported" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["adaptive_thinking", "effort"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Claude API ID claude-opus-5; Adaptive thinking Yes; context window 1M tokens; max output 128k tokens.", sourceUrl: "https://platform.claude.com/docs/en/about-claude/models/overview" }],
      notes: []
    },
    {
      projectModelId: "claude-sonnet-5",
      officialModelId: "claude-sonnet-5",
      provider: "anthropic",
      displayName: "Anthropic Claude Sonnet 5 (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "claude-sonnet-5",
        intendedTier: "balanced_code_and_reasoning",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["claude-sonnet-5"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Anthropic Models Overview",
        sourceUrls: ["https://docs.anthropic.com/en/docs/about-claude/models/overview"],
        notes: "Anthropic \u5B98\u65B9\u6A21\u578B\u603B\u89C8\u548C Messages API \u5747\u5217\u51FA exact ID 'claude-sonnet-5'\u3002"
      },
      claims: {
        contextWindowTokens: 1e6,
        maxOutputTokens: 128e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "supported" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["adaptive_thinking", "effort"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Claude API ID claude-sonnet-5; Adaptive thinking Yes; context window 1M tokens; max output 128k tokens.", sourceUrl: "https://platform.claude.com/docs/en/about-claude/models/overview" }],
      notes: []
    },
    {
      projectModelId: "gemini-3.1-pro-preview",
      officialModelId: "gemini-3.1-pro-preview",
      provider: "gemini",
      displayName: "Google Gemini 3.1 Pro Preview (Project Target Alias)",
      verificationStatus: "preview",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gemini-3.1-pro-preview",
        intendedTier: "multimodal_long_context_preview",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gemini-3.1-pro-preview", "gemini-3.1"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Gemini 3.1 Pro",
        sourceUrls: ["https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-pro"],
        notes: "Google Cloud \u5B98\u65B9\u6A21\u578B\u9875\u5217\u51FA exact ID 'gemini-3.1-pro-preview'\uFF0C\u53D1\u5E03\u9636\u6BB5\u4E3A Public preview\u3002"
      },
      claims: {
        contextWindowTokens: 1048576,
        maxOutputTokens: 65536,
        inputModalities: { text: "supported", image: "supported", audio: "supported", video: "supported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "unknown",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["thinking_level"],
        statefulConversation: "unknown",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: false,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified_preview", quote: "Model ID gemini-3.1-pro-preview; Public preview; context window 1,048,576; maximum output 65,536; text, image, audio and video input; function calling, structured output, thinking, and context caching supported.", sourceUrl: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-1-pro" }],
      notes: [
        "\u652F\u6301 Thought Signatures \u8DE8\u8F6E\u4FDD\u6301\u673A\u5236\u3002"
      ]
    },
    {
      projectModelId: "gemini-3.7-flash",
      officialModelId: "gemini-3.7-flash",
      provider: "gemini",
      displayName: "Google Gemini 3.7 Flash (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gemini-3.7-flash",
        intendedTier: "ultra_fast_agent_workhorse",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gemini-3.7-flash"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Gemini 3.7 Flash",
        sourceUrls: ["https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-7-flash"],
        notes: "Google Cloud \u5B98\u65B9\u6A21\u578B\u9875\u5217\u51FA exact ID 'gemini-3.7-flash'\uFF0C\u53D1\u5E03\u9636\u6BB5\u4E3A GA\u3002"
      },
      claims: {
        contextWindowTokens: 1048576,
        maxOutputTokens: 65536,
        inputModalities: { text: "supported", image: "supported", audio: "supported", video: "supported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "unknown",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["thinking_level"],
        statefulConversation: "unknown",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: false,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Model ID gemini-3.7-flash; GA; context window 1,048,576; maximum output 65,536; text, image, audio and video input; function calling, structured output, thinking, and context caching supported.", sourceUrl: "https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/gemini/3-7-flash" }],
      notes: []
    },
    {
      projectModelId: "grok-4.6",
      officialModelId: "grok-4.6",
      provider: "xai",
      displayName: "xAI Grok 4.6 (Project Target Alias)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "grok-4.6",
        intendedTier: "realtime_tools_and_reasoning",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["grok-4.6"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "xAI Developer Documentation",
        sourceUrls: ["https://docs.x.ai/developers/models"],
        notes: "xAI \u5B98\u65B9\u6A21\u578B\u76EE\u5F55\u548C\u72EC\u7ACB\u6A21\u578B\u9875\u5747\u5217\u51FA exact ID 'grok-4.6'\u3002"
      },
      claims: {
        contextWindowTokens: 5e5,
        maxOutputTokens: "unknown",
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "unknown" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "unknown",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: [],
        statefulConversation: "unknown",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [{ field: "modelDetails", value: "verified", quote: "Model name grok-4.6; text, image to text; context window 500,000 tokens; function calling, structured outputs, and reasoning supported.", sourceUrl: "https://docs.x.ai/developers/models/grok-4.6" }],
      notes: [
        "\u539F\u751F\u652F\u6301\u5B9E\u65F6\u641C\u7D22\u4E0E\u4EE3\u7801\u6C99\u7BB1\u96C6\u6210\u3002"
      ]
    },
    {
      projectModelId: "claude-3-7-sonnet-20250219",
      officialModelId: "claude-3-7-sonnet-20250219",
      provider: "anthropic",
      displayName: "Claude 3.7 Sonnet (Official Verified Baseline)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "claude-3-7-sonnet-20250219",
        intendedTier: "flagship_hybrid_reasoning",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["claude-3-7-sonnet-20250219"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "Anthropic Models Overview & Reference",
        sourceUrls: [
          "https://docs.anthropic.com/en/docs/about-claude/models/overview",
          "https://docs.anthropic.com/en/api/messages"
        ],
        notes: "Anthropic \u5B98\u65B9\u751F\u4EA7\u7EA7\u6DF7\u5408\u63A8\u7406\u65D7\u8230\u6A21\u578B\uFF0C\u539F\u751F\u652F\u6301\u81EA\u9002\u5E94\u601D\u8003\u4E0E 200k \u4E0A\u4E0B\u6587\u3002"
      },
      claims: {
        contextWindowTokens: 2e5,
        maxOutputTokens: 64e3,
        inputModalities: { text: "supported", image: "supported", audio: "unsupported", video: "unsupported", pdf: "supported" },
        outputModalities: { text: "supported", image: "unsupported", audio: "unsupported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "supported",
        reasoningControls: ["thinking_budget"],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [
        {
          field: "contextWindowTokens",
          value: 2e5,
          quote: "Claude 3.7 Sonnet has a 200,000 token context window (approximately 150,000 words or 500 pages of text).",
          sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview"
        },
        {
          field: "maxOutputTokens",
          value: 64e3,
          quote: "Max output tokens is 64,000 tokens when thinking is enabled or 8,192 tokens standard.",
          sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview"
        },
        {
          field: "reasoning",
          value: "supported",
          quote: "Claude 3.7 Sonnet is a hybrid reasoning model that can produce thinking tokens prior to final response generation.",
          sourceUrl: "https://docs.anthropic.com/en/docs/about-claude/models/overview"
        },
        {
          field: "promptCaching",
          value: "supported",
          quote: "Prompt caching is supported on all Claude 3.5 and 3.7 models via cache_control parameters in messages.",
          sourceUrl: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching"
        }
      ],
      notes: [
        "\u57FA\u51C6\u6D4B\u8BD5\u652F\u6301 thinking block signature \u8FDE\u7EED\u6027\u63A2\u9488\u4E0E 64k \u9488\u5C16\u68C0\u7D22\u3002"
      ]
    },
    {
      projectModelId: "gpt-4o",
      officialModelId: "gpt-4o",
      provider: "openai",
      displayName: "OpenAI GPT-4o (Official Verified Baseline)",
      verificationStatus: "verified",
      aliasPolicy: {
        aliasAllowed: true,
        officialModelId: "gpt-4o",
        intendedTier: "flagship_omni",
        verificationMethod: "official_model_id_match"
      },
      verification: {
        checkedCatalog: true,
        checkedModelPage: true,
        searchTerms: ["gpt-4o"],
        result: "verified_in_official_catalog",
        method: "official_catalog_exact_match",
        retrievedDate: "2026-08-17",
        pageTitle: "OpenAI Models",
        sourceUrls: [
          "https://platform.openai.com/docs/models/gpt-4o"
        ],
        notes: "OpenAI \u5B98\u65B9\u65D7\u8230\u591A\u6A21\u6001\u6A21\u578B\uFF0C\u652F\u6301 128k \u4E0A\u4E0B\u6587\u4E0E\u539F\u751F\u7ED3\u6784\u5316\u8F93\u51FA\u3002"
      },
      claims: {
        contextWindowTokens: 128e3,
        maxOutputTokens: 16384,
        inputModalities: { text: "supported", image: "supported", audio: "supported", video: "unsupported", pdf: "supported" },
        outputModalities: { text: "supported", image: "unsupported", audio: "supported" },
        streaming: "supported",
        toolCalling: "supported",
        structuredOutput: "supported",
        jsonSchema: "supported",
        reasoning: "unsupported",
        reasoningControls: [],
        statefulConversation: "supported",
        promptCaching: "supported",
        vision: "supported",
        longContextNeedleTestEligible: true,
        toolRoundtripTestEligible: true,
        streamEventTestEligible: true,
        structuredOutputTestEligible: true
      },
      evidence: [
        {
          field: "contextWindowTokens",
          value: 128e3,
          quote: "GPT-4o has a context window of 128,000 tokens.",
          sourceUrl: "https://platform.openai.com/docs/models/gpt-4o"
        },
        {
          field: "structuredOutput",
          value: "supported",
          quote: "Structured Outputs is available on gpt-4o-2024-08-06 and later models with response_format: { type: 'json_schema', json_schema: {...}, strict: true }.",
          sourceUrl: "https://platform.openai.com/docs/guides/structured-outputs"
        }
      ],
      notes: []
    }
  ]
};

// src/content/baselines/probe-policy.json
var probe_policy_default = {
  schemaVersion: "2.0",
  catalogVersion: "2026-08-17",
  description: "API-QuickCheck 24\u9879\u5168\u91CF\u63A2\u9488\u8DEF\u7531\u4E0E\u6267\u884C\u7B56\u7565\u89C4\u8303 (\u6DB5\u76D6 P0\u534F\u8BAE\u5C42, P1\u67B6\u6784\u5C42, P2\u80FD\u529B\u5C42, P3\u8D28\u91CF\u5C42)",
  executionSemantics: {
    supported: {
      mode: "standard_benchmark",
      action: "execute",
      scoring: "\u8BA1\u5165\u80FD\u529B\u4E0E\u771F\u4F2A\u6838\u5FC3\u8BC4\u5206\uFF0C\u63A2\u9488\u5931\u8D25\u5224\u5B9A\u4E3A\u6F5C\u5728\u63BA\u6C34\u6216\u529F\u80FD\u964D\u7EA7"
    },
    unsupported: {
      mode: "not_claimed",
      action: "skip",
      scoring: "\u81EA\u52A8\u8DF3\u8FC7\uFF0C\u72B6\u6001\u6807\u8BB0\u4E3A not_applicable / not_claimed\uFF0C\u4E0D\u8BA1\u5165\u6263\u5206"
    },
    unknown: {
      mode: "exploratory_test",
      action: "execute_optional",
      scoring: "\u4F5C\u4E3A\u63A2\u7D22\u6027\u63A2\u9488\u8FD0\u884C\uFF0C\u6D4B\u8BD5\u7ED3\u679C\u4EC5\u4F9B\u8D28\u91CF\u6D1E\u5BDF\uFF0C\u4E0D\u53C2\u4E0E\u5B98\u65B9\u7EA7\u964D\u7EA7\u5B9A\u8BBA"
    }
  },
  longContextPolicy: {
    needleProbeTokens: 64e3,
    needlePositions: ["start", "middle", "end"],
    tokenEstimationRatio: "char_count_div_4_or_bpe",
    minOfficialContextForNeedle: 64e3,
    skipWhen: ["contextWindowTokens < 64000", "contextWindowTokens=unknown"]
  },
  probePolicy: {
    "p0-model-discovery": {
      layer: "P0",
      title: "\u6A21\u578B\u4E0E\u7248\u672C\u53D1\u73B0",
      domain: "protocol",
      requires: [],
      skipWhen: [],
      description: "\u63A2\u6D4B /v1/models \u6216\u539F\u751F\u578B\u53F7\u76EE\u5F55\u7AEF\u70B9\uFF0C\u6821\u9A8C\u662F\u5426\u5B58\u5728\u76EE\u6807\u6A21\u578B ID \u6216\u5408\u6CD5\u522B\u540D\u6620\u5C04"
    },
    "p0-native-route": {
      layer: "P0",
      title: "\u539F\u751F API \u8DEF\u7531",
      domain: "protocol",
      requires: [],
      skipWhen: [],
      description: "\u9A8C\u8BC1 Responses / Messages / Interactions \u539F\u751F API \u534F\u8BAE\u8DEF\u7531\u4E0E\u72B6\u6001\u7801\u54CD\u5E94"
    },
    "p0-auth-shape": {
      layer: "P0",
      title: "\u8BA4\u8BC1\u5934\u4E0E\u9519\u8BEF\u8BED\u4E49",
      domain: "protocol",
      requires: [],
      skipWhen: [],
      description: "\u9A8C\u8BC1 Bearer / x-api-key \u8BA4\u8BC1\u9274\u6743\u5931\u8D25\u65F6\uFF0C\u9519\u8BEF\u7801\u4E0E JSON Error Envelope \u89C4\u8303"
    },
    "p0-stream-events": {
      layer: "P0",
      title: "\u6D41\u5F0F\u4E8B\u4EF6\u987A\u5E8F",
      domain: "protocol",
      requires: ["streaming=supported"],
      skipWhen: ["streaming=unsupported"]
    },
    "p0-strict-json": {
      layer: "P0",
      title: "\u4E25\u683C JSON Schema",
      domain: "structured_output",
      requires: ["structuredOutput=supported", "jsonSchema=supported"],
      skipWhen: ["structuredOutput=unsupported", "jsonSchema=unsupported"]
    },
    "p0-tool-shape": {
      layer: "P0",
      title: "\u5DE5\u5177\u8C03\u7528\u7ED3\u6784",
      domain: "tools",
      requires: ["toolCalling=supported"],
      skipWhen: ["toolCalling=unsupported"]
    },
    "p0-invalid-parameter": {
      layer: "P0",
      title: "\u975E\u6CD5\u53C2\u6570\u56DE\u663E",
      domain: "protocol",
      requires: [],
      skipWhen: [],
      description: "\u4F20\u5165\u975E\u6CD5 temperature / top_p / thinking_budget\uFF0C\u9A8C\u8BC1\u670D\u52A1\u7AEF\u539F\u751F\u62E6\u622A\u62A5\u9519"
    },
    "p1-reasoning-config": {
      layer: "P1",
      title: "\u63A8\u7406\u914D\u7F6E\u900F\u4F20",
      domain: "reasoning",
      requires: ["provider=anthropic", "reasoning=supported"],
      skipWhen: ["provider!=anthropic", "reasoning=unsupported"]
    },
    "p1-state-continuity": {
      layer: "P1",
      title: "\u8DE8\u8F6E\u72B6\u6001\u8FDE\u7EED\u6027",
      domain: "tools",
      requires: ["statefulConversation=supported"],
      skipWhen: ["statefulConversation=unsupported"]
    },
    "p1-tool-roundtrip": {
      layer: "P1",
      title: "\u53D7\u63A7\u5DE5\u5177\u56DE\u5408",
      domain: "tools",
      requires: ["toolCalling=supported"],
      skipWhen: ["toolCalling=unsupported"]
    },
    "p1-signature-continuity": {
      layer: "P1",
      title: "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027",
      domain: "protocol",
      requires: ["provider=anthropic", "reasoning=supported"],
      skipWhen: ["provider!=anthropic", "reasoning=unsupported"]
    },
    "p1-cache-semantics": {
      layer: "P1",
      title: "\u7F13\u5B58\u8BED\u4E49",
      domain: "protocol",
      requires: ["promptCaching=supported"],
      skipWhen: ["promptCaching=unsupported"]
    },
    "p2-constraint-json": {
      layer: "P2",
      title: "\u7EA6\u675F JSON \u4EFB\u52A1",
      domain: "structured_output",
      requires: ["structuredOutput=supported", "inputModalities.text=supported", "outputModalities.text=supported"],
      skipWhen: ["structuredOutput=unsupported"]
    },
    "p2-tool-planning": {
      layer: "P2",
      title: "\u53CC\u56DE\u5408\u5DE5\u5177\u89C4\u5212",
      domain: "tools",
      requires: ["toolCalling=supported"],
      skipWhen: ["toolCalling=unsupported"]
    },
    "p2-code-repair-a": {
      layer: "P2",
      title: "\u4EE3\u7801\u8865\u4E01\uFF1A\u7B97\u672F\u6A21\u5757",
      domain: "code",
      requires: ["inputModalities.text=supported", "outputModalities.text=supported"],
      skipWhen: []
    },
    "p2-code-repair-b": {
      layer: "P2",
      title: "\u4EE3\u7801\u8865\u4E01\uFF1A\u96C6\u5408\u6A21\u5757",
      domain: "code",
      requires: ["inputModalities.text=supported", "outputModalities.text=supported"],
      skipWhen: []
    },
    "p2-chart-extraction": {
      layer: "P2",
      title: "\u56FE\u8868\u5B57\u6BB5\u63D0\u53D6",
      domain: "vision",
      requires: ["vision=supported", "inputModalities.image=supported"],
      skipWhen: ["vision=unsupported", "inputModalities.image=unsupported"]
    },
    "p2-context-start": {
      layer: "P2",
      title: "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u5F00\u5934",
      domain: "context",
      requires: ["contextWindowTokens >= 64000"],
      minimumContextTokens: 64e3,
      skipWhen: ["contextWindowTokens < 64000", "contextWindowTokens=unknown"]
    },
    "p2-context-middle": {
      layer: "P2",
      title: "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u4E2D\u90E8",
      domain: "context",
      requires: ["contextWindowTokens >= 64000"],
      minimumContextTokens: 64e3,
      skipWhen: ["contextWindowTokens < 64000", "contextWindowTokens=unknown"]
    },
    "p2-context-end": {
      layer: "P2",
      title: "\u957F\u4E0A\u4E0B\u6587\u9488\u5C16\uFF1A\u7ED3\u5C3E",
      domain: "context",
      requires: ["contextWindowTokens >= 64000"],
      minimumContextTokens: 64e3,
      skipWhen: ["contextWindowTokens < 64000", "contextWindowTokens=unknown"]
    },
    "p3-repeat-a": {
      layer: "P3",
      title: "\u8FD0\u884C\u8D28\u91CF\u6837\u672C A",
      domain: "runtime",
      requires: [],
      skipWhen: [],
      description: "\u57FA\u7840\u51B7\u542F\u52A8\u5EF6\u8FDF\u4E0E\u9996 Token \u6D4B\u901F\u91C7\u6837"
    },
    "p3-repeat-b": {
      layer: "P3",
      title: "\u8FD0\u884C\u8D28\u91CF\u6837\u672C B",
      domain: "runtime",
      requires: [],
      skipWhen: [],
      description: "\u5E76\u53D1\u7A33\u5B9A\u6027\u4E0E\u8FDE\u7EED Token \u541E\u5410\u7387\u91C7\u6837"
    },
    "p3-repeat-c": {
      layer: "P3",
      title: "\u8FD0\u884C\u8D28\u91CF\u6837\u672C C",
      domain: "runtime",
      requires: [],
      skipWhen: [],
      description: "\u7F51\u7EDC\u6296\u52A8\u4E0E\u957F\u8FDE\u4FDD\u6D3B\u6D4B\u8BD5\u91C7\u6837"
    },
    "p3-repeat-d": {
      layer: "P3",
      title: "\u8FD0\u884C\u8D28\u91CF\u6837\u672C D",
      domain: "runtime",
      requires: [],
      skipWhen: [],
      description: "\u7EFC\u5408\u7A33\u5B9A\u6027\u4E0E\u7AEF\u5230\u7AEF P95 \u5EF6\u8FDF\u5224\u5B9A\u91C7\u6837"
    }
  }
};

// src/engine/audit/capabilityRouting.ts
var claims = official_model_claims_default;
var policy = probe_policy_default;
function findModelClaims(provider, model) {
  const normalizedModel = model.replace(new RegExp(`^${provider}/`), "");
  return claims.models.find((entry) => entry.provider === provider && (entry.projectModelId === model || entry.officialModelId === model || entry.projectModelId === normalizedModel || entry.officialModelId === normalizedModel));
}
function readClaim(modelClaims, provider, path) {
  if (path === "provider") return provider;
  if (!modelClaims) return "unknown";
  return path.split(".").reduce((value, key) => {
    if (typeof value !== "object" || value === null) return "unknown";
    return key in value ? value[key] : "unknown";
  }, modelClaims.claims);
}
function compareClaim(value, operator, expected) {
  if (expected === "unknown" && operator === "=") return value === "unknown" ? "supported" : "unsupported";
  if (value === "unknown" || value === void 0 || value === null) return "unknown";
  if (operator === ">=") return typeof value === "number" ? value >= Number(expected) ? "supported" : "unsupported" : "unknown";
  if (operator === "<") return typeof value === "number" ? value < Number(expected) ? "supported" : "unsupported" : "unknown";
  if (operator === "=" || operator === "!=") {
    const matches = String(value) === expected;
    return (operator === "=" ? matches : !matches) ? "supported" : "unsupported";
  }
  return "unknown";
}
function evaluateExpression(expression, provider, modelClaims) {
  const match = expression.match(/^([\w.]+)\s*(>=|<|!=|=)\s*(.+)$/);
  if (!match) return "unknown";
  const [, path, operator, expected] = match;
  return compareClaim(readClaim(modelClaims, provider, path), operator, expected);
}
function evaluatePolicy(probeId, provider, modelClaims) {
  if (provider === "openrouter") {
    return { state: "unknown", disposition: "standard_benchmark", countsTowardReferenceConclusion: true, reason: "OpenRouter \u53C2\u8003\u57FA\u7EBF\u6A21\u5F0F\uFF1A\u6267\u884C\u5DF2\u5B9E\u73B0\u63A2\u9488\u4EE5\u751F\u6210\u53EF\u6BD4\u8F83\u6837\u672C\u3002" };
  }
  const probePolicy = policy.probePolicy[probeId];
  if (!probePolicy) {
    return { state: "unknown", disposition: "exploratory_test", countsTowardReferenceConclusion: false, reason: "\u672A\u627E\u5230\u8BE5\u63A2\u9488\u7684\u5B98\u65B9\u8DEF\u7531\u7B56\u7565\u3002" };
  }
  const skippedBy = probePolicy.skipWhen?.find((expression) => evaluateExpression(expression, provider, modelClaims) === "supported");
  if (skippedBy) {
    return { state: "unsupported", disposition: "not_claimed", countsTowardReferenceConclusion: false, reason: `\u5B98\u65B9\u80FD\u529B\u58F0\u660E\u6EE1\u8DB3\u8DF3\u8FC7\u6761\u4EF6\uFF1A${skippedBy}` };
  }
  const requiredStates = (probePolicy.requires || []).map((expression) => ({ expression, state: evaluateExpression(expression, provider, modelClaims) }));
  const failedRequirement = requiredStates.find((item) => item.state === "unsupported");
  if (failedRequirement) {
    return { state: "unsupported", disposition: "not_claimed", countsTowardReferenceConclusion: false, reason: `\u5B98\u65B9\u80FD\u529B\u58F0\u660E\u4E0D\u6EE1\u8DB3\u8981\u6C42\uFF1A${failedRequirement.expression}` };
  }
  if (requiredStates.some((item) => item.state === "unknown")) {
    return { state: "unknown", disposition: "exploratory_test", countsTowardReferenceConclusion: false, reason: "\u5B98\u65B9\u80FD\u529B\u8D44\u6599\u672A\u660E\u786E\u8986\u76D6\u8BE5\u63A2\u9488\u8981\u6C42\uFF0C\u4EC5\u4F5C\u4E3A\u63A2\u7D22\u6027\u6D4B\u8BD5\u3002" };
  }
  if (!modelClaims) {
    return { state: "unknown", disposition: "exploratory_test", countsTowardReferenceConclusion: false, reason: "\u672A\u627E\u5230\u8BE5\u578B\u53F7\u7684\u5B98\u65B9\u80FD\u529B\u58F0\u660E\uFF0C\u4EC5\u4F5C\u4E3A\u63A2\u7D22\u6027\u6D4B\u8BD5\u3002" };
  }
  return { state: "supported", disposition: "standard_benchmark", countsTowardReferenceConclusion: true, reason: "\u5B98\u65B9\u80FD\u529B\u58F0\u660E\u6EE1\u8DB3\u63A2\u9488\u8981\u6C42\u3002" };
}
function getProbeRoute(provider, model, probeId) {
  return evaluatePolicy(probeId, provider, findModelClaims(provider, model));
}

// src/engine/audit/reportSummary.ts
function assessAuditReport(report) {
  const totalCount = report.protocol.length;
  const passCount = report.protocol.filter((item) => item.status === "pass").length;
  const failCount = report.protocol.filter((item) => item.status === "fail").length;
  const unavailableCount = report.protocol.filter((item) => item.status === "unavailable").length;
  const judgedCount = passCount + failCount;
  const complianceRate = totalCount > 0 ? Math.round(passCount / totalCount * 100) : 0;
  const hasClaudeSignature = report.target.provider === "anthropic" && report.protocol.some((item) => item.id === "p1-signature-continuity" && item.status === "pass");
  if (report.conclusion === "suspect_downgraded") {
    return {
      conclusion: report.conclusion,
      title: "\u53D1\u73B0\u534F\u8BAE\u6216\u80FD\u529B\u9000\u5316\u4FE1\u53F7",
      tone: "danger",
      explanation: "\u7ECF\u81EA\u52A8\u5316\u63A2\u9488\u4EA4\u53C9\u5BA1\u8BA1\uFF0C\u5F53\u524D\u4E2D\u8F6C\u7AEF\u70B9\u5728\u591A\u4E2A\u72EC\u7ACB\u80FD\u529B\u57DF\uFF08\u5982\u601D\u8003\u94FE\u5C01\u88C5\u3001\u5DE5\u5177\u8C03\u7528\u534F\u8BAE\u3001\u7ED3\u6784\u5316 JSON \u8F93\u51FA\u6216\u6D41\u5F0F\u4E8B\u4EF6\u6D41\uFF09\u4E2D\u68C0\u6D4B\u5230\u4E0D\u53EF\u9006\u7684\u683C\u5F0F\u6F02\u79FB\u4E0E\u65AD\u8A00\u5931\u8D25\u3002\u8BE5\u7ED3\u679C\u8868\u660E\u4E2D\u8F6C\u670D\u52A1\u94FE\u8DEF\u53EF\u80FD\u5B58\u5728\u6A21\u578B\u6DF7\u7528\u3001\u4F4E\u914D\u964D\u7EA7\u8F6C\u53D1\u6216\u4F7F\u7528\u4E86\u4E0D\u5408\u89C4\u7684\u534F\u8BAE\u4EE3\u7406\u8F6C\u6362\u4E2D\u95F4\u4EF6\uFF0C\u53EF\u80FD\u5BFC\u81F4\u4E0B\u6E38 Agent \u5E94\u7528\u6216\u6D41\u5F0F\u8F93\u51FA\u5F02\u5E38\u3002",
      evidence: "\u5DF2\u5224\u5B9A " + judgedCount + " \u9879\u7528\u4F8B\uFF1A\u901A\u8FC7 " + passCount + " \u9879\uFF0C\u672A\u901A\u8FC7 " + failCount + " \u9879\uFF1B\u672A\u54CD\u5E94\u6216\u8DF3\u8FC7 " + unavailableCount + " \u9879\u3002",
      nextStep: "\u8BF7\u70B9\u51FB\u4E0B\u65B9\u300C\u5177\u4F53\u6267\u884C\u68C0\u6D4B\u300D\u5C55\u5F00\u67E5\u770B\u6807\u7EA2\u63A2\u9488\u7684\u539F\u59CB\u8FD4\u56DE\u8BC1\u636E\u4E0E\u62A5\u9519\u539F\u56E0\uFF0C\u5EFA\u8BAE\u5207\u6362\u81F3\u5176\u4ED6\u4E2D\u8F6C\u4FE1\u9053\u6216\u8054\u7CFB\u670D\u52A1\u5546\u53CD\u9988\u3002",
      passCount,
      failCount,
      unavailableCount,
      judgedCount,
      complianceRate
    };
  }
  if (failCount === 0 && passCount === totalCount && totalCount > 0) {
    return {
      conclusion: "consistent",
      title: hasClaudeSignature ? "Claude Signature \u8FDE\u7EED\u6027\u901A\u8FC7" : "\u57FA\u7EBF\u534F\u8BAE\u68C0\u6D4B\u5168\u90E8\u901A\u8FC7",
      tone: "success",
      explanation: hasClaudeSignature ? "Anthropic Messages \u7684 thinking \u5757\u4E0E signature \u7B7E\u540D\u5DF2\u6210\u529F\u6355\u83B7\u5E76\u5B8C\u6210\u591A\u8F6E\u4F1A\u8BDD\u8FDE\u7EED\u6027\u56DE\u4F20\u3002\u5F53\u524D\u4E2D\u8F6C\u7AEF\u70B9\u5B8C\u6574\u4FDD\u7559\u4E86\u5B98\u65B9\u539F\u751F\u534F\u8BAE\u5C01\u88C5\u4E0E\u63A8\u7406\u51ED\u636E\uFF0C\u672A\u51FA\u73B0\u4E2D\u8F6C\u5C42\u622A\u65AD\u6216\u6539\u5305\uFF0C\u901A\u4FE1\u4FDD\u771F\u5EA6\u8FBE\u5230 100%\u3002" : "\u5F53\u524D\u4E2D\u8F6C\u7AEF\u70B9\u5BF9\u76EE\u6807\u6A21\u578B\u53D1\u8D77\u7684\u6240\u6709\u539F\u751F\u8DEF\u7531\u4E0E\u534F\u8BAE\u63A2\u9488\uFF08\u5171 " + totalCount + " \u9879\uFF09\u5747\u5DF2 100% \u6EE1\u5206\u901A\u8FC7\u68C0\u9A8C\u3002\u8FD4\u56DE\u7684\u54CD\u5E94 Envelope \u5C01\u88C5\u3001Token Usage \u7EDF\u8BA1\u7ED3\u6784\u3001\u6D41\u5F0F\u4E8B\u4EF6\u72B6\u6001\u6D41\u4EE5\u53CA\u56FA\u5B9A\u5939\u5177\u6570\u636E\u5747\u4E25\u683C\u7B26\u5408\u5B98\u65B9\u534F\u8BAE\u89C4\u8303\u57FA\u7EBF\uFF0C\u65E0\u4E2D\u8F6C\u5C42\u6CE8\u5165\u6539\u5305\u6216\u683C\u5F0F\u964D\u7EA7\u8FF9\u8C61\u3002",
      evidence: "\u5171\u5BA1\u8BA1 " + totalCount + " \u9879\u534F\u8BAE\u63A2\u9488\u5168\u90E8\u901A\u8FC7\uFF08P50 \u4E2D\u4F4D\u5EF6\u8FDF " + (report.runtime?.p50LatencyMs ? report.runtime.p50LatencyMs + " ms" : "--") + "\uFF0C\u901A\u8FC7\u7387 100%\uFF09\u3002",
      nextStep: "\u5F53\u524D\u63A5\u53E3\u5728\u534F\u8BAE\u5C42\u9762\u8868\u73B0\u4F18\u5F02\uFF0C\u53EF\u653E\u5FC3\u63A5\u5165\u4E1A\u52A1\u751F\u4EA7\u7CFB\u7EDF\uFF1B\u5982\u9700\u9A8C\u8BC1\u6781\u9650\u8868\u73B0\uFF0C\u53EF\u8FDB\u4E00\u6B65\u6D4B\u8BD5\u8D85\u957F\u4E0A\u4E0B\u6587\u6216\u9AD8\u5E76\u53D1\u573A\u666F\u3002",
      passCount,
      failCount,
      unavailableCount,
      judgedCount,
      complianceRate
    };
  }
  if (failCount === 0 && passCount > 0 && passCount < totalCount) {
    return {
      conclusion: "inconclusive",
      title: "\u90E8\u5206\u534F\u8BAE\u63A2\u9488\u901A\u8FC7 (" + passCount + "/" + totalCount + " \u9879)",
      tone: "warning",
      explanation: "\u5F53\u524D\u7AEF\u70B9\u6210\u529F\u901A\u8FC7\u4E86 " + passCount + " \u9879\u57FA\u7840\u8DEF\u7531/\u534F\u8BAE\u63A2\u9488\uFF0C\u4F46\u5176\u4F59 " + unavailableCount + " \u9879\u9AD8\u7EA7\u63A2\u9488\uFF08\u5982\u6DF1\u5EA6\u601D\u8003\u89E3\u6790\u3001\u7ED3\u6784\u5316\u8F93\u51FA\u6216\u72B6\u6001\u6D41\uFF09\u56E0\u670D\u52A1\u7AEF\u672A\u5F00\u653E\u3001\u8D85\u65F6\u6216\u672A\u58F0\u660E\u800C\u672A\u80FD\u5B8C\u6210\u6D4B\u8BD5\u3002\u8FD9\u8868\u660E\u63A5\u53E3\u5177\u5907\u57FA\u7840\u901A\u8BAF\u80FD\u529B\uFF0C\u4F46\u9AD8\u7EA7\u534F\u8BAE\u5B8C\u6574\u5EA6\u4ECD\u5F85\u5B8C\u5584\u3002",
      evidence: "\u8BA1\u5212\u6D4B\u8BD5 " + totalCount + " \u9879\uFF1A\u901A\u8FC7 " + passCount + " \u9879\uFF0C" + unavailableCount + " \u9879\u672A\u54CD\u5E94\u6216\u8DF3\u8FC7\uFF08\u901A\u8FC7\u7387 " + complianceRate + "%\uFF09\u3002",
      nextStep: "\u8BF7\u5C55\u5F00\u4E0B\u65B9\u300C\u5177\u4F53\u6267\u884C\u68C0\u6D4B\u300D\u6838\u5B9E\u672A\u901A\u8FC7\u63A2\u9488\u7684\u5177\u4F53\u539F\u56E0\uFF0C\u5E76\u5728\u4F7F\u7528\u9AD8\u7EA7\u7279\u6027\uFF08\u5982\u5DE5\u5177\u8C03\u7528\u4E0E\u6D41\u5F0F\u89E3\u6790\uFF09\u524D\u8FDB\u884C\u5145\u5206\u6D4B\u8BD5\u3002",
      passCount,
      failCount,
      unavailableCount,
      judgedCount,
      complianceRate
    };
  }
  if (failCount > 0) {
    return {
      conclusion: "inconclusive",
      title: "\u53D1\u73B0\u534F\u8BAE\u6216\u80FD\u529B\u5F02\u5E38",
      tone: "warning",
      explanation: "\u5F53\u524D\u7AEF\u70B9\u5728\u5927\u90E8\u5206\u5E38\u89C4\u5BF9\u8BDD\u8BF7\u6C42\u4E2D\u8868\u73B0\u6B63\u5E38\uFF0C\u4F46\u5728\u7279\u5B9A\u9AD8\u7EA7\u534F\u8BAE\u6216\u8FB9\u754C\u63A2\u9488\uFF08\u5982\u6DF1\u5EA6\u601D\u8003\u89E3\u6790\u3001\u4E25\u683C\u6A21\u5F0F JSON \u6821\u9A8C\u7B49\uFF09\u4E2D\u672A\u80FD\u901A\u8FC7\u4E00\u81F4\u6027\u65AD\u8A00\u3002\u8FD9\u901A\u5E38\u7531\u4E2D\u8F6C\u7AD9\u524D\u7F6E\u7F51\u5173\u5B57\u6BB5\u8FC7\u6EE4\u3001\u4E2D\u95F4\u4EF6\u4EE3\u7406\u8F6C\u6362\u4E0D\u5B8C\u5584\u6216\u6A21\u578B\u4E0A\u6E38\u77ED\u65F6\u5F02\u5E38\u6240\u5BFC\u81F4\u3002",
      evidence: "\u5DF2\u5224\u5B9A " + judgedCount + " \u9879\u7528\u4F8B\uFF1A\u901A\u8FC7 " + passCount + " \u9879\uFF0C\u5F02\u5E38 " + failCount + " \u9879\uFF1B\u672A\u54CD\u5E94 " + unavailableCount + " \u9879\u3002",
      nextStep: "\u5EFA\u8BAE\u5C55\u5F00\u4E0B\u65B9\u300C\u5177\u4F53\u6267\u884C\u68C0\u6D4B\u300D\u6838\u5B9E\u5931\u8D25\u63A2\u9488\u662F\u5426\u5F71\u54CD\u60A8\u7684\u6838\u5FC3\u4E1A\u52A1\uFF0C\u6216\u91CD\u65B0\u6267\u884C\u5355\u6B21\u590D\u6D4B\u4EE5\u6392\u9664\u7F51\u7EDC\u5076\u53D1\u6296\u52A8\u3002",
      passCount,
      failCount,
      unavailableCount,
      judgedCount,
      complianceRate
    };
  }
  return {
    conclusion: "inconclusive",
    title: "\u63A2\u9488\u65E0\u6CD5\u8FDE\u901A\u6216\u7AEF\u70B9\u4E0D\u53EF\u7528",
    tone: "neutral",
    explanation: "\u5F53\u524D\u7AEF\u70B9\u672A\u80FD\u5728\u9650\u5B9A\u65F6\u95F4\u5185\u5EFA\u7ACB\u8FDE\u63A5\u6216\u672A\u8FD4\u56DE\u6709\u6548\u6570\u636E\uFF0C\u53EF\u80FD\u662F\u7531\u4E8E\u4E2D\u8F6C\u7AD9\u7F51\u7EDC\u62E5\u585E\u6216\u8BE5\u7AEF\u70B9\u672A\u914D\u7F6E\u6240\u6D4B\u6A21\u578B\u8DEF\u7531\u3002",
    evidence: "\u5171\u6267\u884C " + unavailableCount + " \u9879\u63A2\u9488\uFF0C\u5168\u90E8\u65E0\u53EF\u7528\u54CD\u5E94\u3002",
    nextStep: "\u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u3001Base URL \u63A5\u53E3\u5730\u5740\u4E0E API Key \u662F\u5426\u6709\u6548\uFF0C\u6216\u8054\u7CFB\u4E2D\u8F6C\u670D\u52A1\u5546\u6838\u5B9E\u3002",
    passCount,
    failCount,
    unavailableCount,
    judgedCount,
    complianceRate
  };
}
function buildAuditSummary(report) {
  const assessment = assessAuditReport(report);
  return `${assessment.title}\u3002${assessment.explanation} ${assessment.evidence} \u4E0B\u4E00\u6B65\uFF1A${assessment.nextStep}`;
}

// src/engine/audit/runner.ts
var CAPABILITY_DOMAINS = [
  "reasoning",
  "tools",
  "code",
  "vision",
  "context",
  "structured_output"
];
function unavailableMetric(domain, baselineId, targetScores = []) {
  return {
    domain,
    targetScores,
    baselineScores: [],
    status: "unavailable",
    detail: baselineId ? targetScores.length > 0 ? `\u5DF2\u5B8C\u6210 ${targetScores.length} \u6B21\u80FD\u529B\u91C7\u6837\uFF0C\u4F46\u5F53\u524D\u672A\u52A0\u8F7D\u53C2\u8003\u57FA\u7EBF\u5FEB\u7167\u3002` : "\u672C\u8F6E\u6D4F\u89C8\u5668\u6267\u884C\u5668\u5C1A\u672A\u8FD0\u884C\u8BE5\u80FD\u529B\u57DF\u3002" : targetScores.length > 0 ? `\u5DF2\u5B8C\u6210 ${targetScores.length} \u6B21\u80FD\u529B\u91C7\u6837\uFF0C\u4F46\u672A\u63D0\u4F9B\u53C2\u8003\u57FA\u7EBF\uFF1B\u4E0D\u80FD\u5C06\u5355\u6B21\u80FD\u529B\u8868\u73B0\u8F6C\u6362\u4E3A\u4E00\u81F4\u6027\u7ED3\u8BBA\u3002` : "\u672A\u63D0\u4F9B\u53C2\u8003\u57FA\u7EBF\u5FEB\u7167\uFF1B\u4E0D\u80FD\u5C06\u5355\u6B21\u80FD\u529B\u8868\u73B0\u8F6C\u6362\u4E3A\u4E00\u81F4\u6027\u7ED3\u8BBA\u3002"
  };
}
function unavailableEvidence(id, title, detail) {
  return { id, title, status: "unavailable", detail };
}
function routeStatus(response) {
  if (response.ok) return "pass";
  if ([0, 402, 404, 405, 408, 429].includes(response.status)) return "unavailable";
  return "fail";
}
function containsFixtureText(text, expected) {
  const normalized = text.trim().replace(/[.!?]+$/g, "");
  return normalized.includes(expected.replace(/[.!?]+$/g, ""));
}
function usageNumber(result, path) {
  let value = result.usage;
  for (const key of path) {
    if (typeof value !== "object" || value === null) return void 0;
    value = value[key];
  }
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function promptTokenCount(result) {
  return usageNumber(result, ["prompt_tokens"]) ?? usageNumber(result, ["input_tokens"]) ?? usageNumber(result, ["promptTokenCount"]) ?? usageNumber(result, ["inputTokenCount"]);
}
function completionTokenCount(result) {
  return usageNumber(result, ["completion_tokens"]) ?? usageNumber(result, ["output_tokens"]) ?? usageNumber(result, ["candidatesTokenCount"]) ?? usageNumber(result, ["outputTokenCount"]);
}
function totalTokenCount(result) {
  return usageNumber(result, ["total_tokens"]) ?? usageNumber(result, ["totalTokenCount"]);
}
function cachedInputTokens(result) {
  return usageNumber(result, ["input_tokens_details", "cached_tokens"]) ?? usageNumber(result, ["cache_read_input_tokens"]) ?? usageNumber(result, ["cached_content_token_count"]);
}
function reasoningTokenCount(result) {
  return usageNumber(result, ["thoughtsTokenCount"]) ?? usageNumber(result, ["thoughts_token_count"]) ?? usageNumber(result, ["reasoning_tokens"]) ?? usageNumber(result, ["output_tokens_details", "reasoning_tokens"]);
}
function basicEvidence(result, provider, model, allowRelayEnvelope = false) {
  const status = routeStatus(result.response);
  const validation = provider === "anthropic" ? validateAnthropicMessage(result.response.data, model, !allowRelayEnvelope) : provider === "gemini" ? validateGeminiGenerateContent(result.response.data, model) : provider === "openrouter" ? validateChatCompletionEnvelope(result.response.data, model, false) : validateResponsesEnvelope(result.response.data, model);
  if (status === "pass" && containsFixtureText(result.text, "audit-ready.") && validation.pass) {
    return { id: "p0-native-route", title: "\u539F\u751F API \u8DEF\u7531", status, detail: "\u539F\u751F\u8BF7\u6C42\u6210\u529F\uFF0C\u54CD\u5E94 envelope \u548C\u56FA\u5B9A\u5939\u5177\u5747\u7B26\u5408\u3002", latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes };
  }
  const validationStatus = status === "pass" ? "fail" : status;
  let detailMessage = "";
  if ([404, 405, 502].includes(result.response.status)) {
    detailMessage = provider === "anthropic" ? `\u4E2D\u8F6C\u7AD9\u672A\u5F00\u653E Anthropic \u539F\u751F /v1/messages \u63A5\u53E3 (HTTP ${result.response.status})\u3002\u5F53\u524D\u4E2D\u8F6C\u53EF\u80FD\u4EC5\u652F\u6301\u901A\u7528\u8F6C\u8BD1\u63A5\u53E3\uFF0C\u65E0\u6CD5\u63D0\u4F9B\u5B98\u65B9\u5BC6\u7801\u5B66\u9632\u4F2A\u7B7E\u540D\u3002` : provider === "gemini" ? `\u4E2D\u8F6C\u7AD9\u672A\u5F00\u653E Google Gemini \u539F\u751F :generateContent \u63A5\u53E3 (HTTP ${result.response.status})\u3002` : `\u7AEF\u70B9\u672A\u5F00\u653E\u539F\u751F\u8DEF\u7531 (HTTP ${result.response.status})\u3002`;
  } else if (status === "unavailable") {
    detailMessage = result.response.errorMessage || "\u539F\u751F\u8DEF\u7531\u672A\u5F00\u653E\u6216\u4EE3\u7406\u94FE\u8DEF\u4E0D\u53EF\u7528\u3002";
  } else {
    const responseShape = validation.issues.includes("response_not_object") ? `\uFF08\u54CD\u5E94\u6570\u636E\u975E JSON \u5BF9\u8C61\uFF0CrawText ${result.response.rawText.length} \u5B57\u7B26\uFF0CContent-Type ${result.response.headers.get("content-type") || "unknown"}\uFF09` : "";
    detailMessage = `\u54CD\u5E94\u672A\u901A\u8FC7\u534F\u8BAE\u6216\u56FA\u5B9A\u5939\u5177\u6821\u9A8C\uFF1A${validation.issues.join(", ") || result.text.slice(0, 120)}${responseShape}`;
  }
  return {
    id: "p0-native-route",
    title: "\u539F\u751F API \u8DEF\u7531",
    status: validationStatus,
    detail: detailMessage,
    latencyMs: result.response.latencyMs,
    rawEventTypes: result.eventTypes
  };
}
async function execute(adapter, request, signal) {
  const response = await silentFetch({
    url: request.url,
    method: "POST",
    headers: request.headers,
    body: request.body,
    timeoutMs: 3e4,
    signal
  });
  return adapter.parse(response);
}
function runtimeFrom(results) {
  const latencies = results.map((result) => result.response.latencyMs).filter((value) => value >= 0).sort((a, b) => a - b);
  const percentile = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let hasTokens = false;
  let totalDurationMs = 0;
  for (const result of results) {
    if (result.response.latencyMs && result.response.latencyMs > 0) {
      totalDurationMs += result.response.latencyMs;
    }
    const pTokens = promptTokenCount(result);
    const cTokens = completionTokenCount(result);
    const tTokens = totalTokenCount(result);
    if (pTokens !== void 0 || cTokens !== void 0 || tTokens !== void 0) {
      hasTokens = true;
      if (pTokens !== void 0) totalPromptTokens += pTokens;
      if (cTokens !== void 0) totalCompletionTokens += cTokens;
      if (pTokens === void 0 && cTokens === void 0 && tTokens !== void 0) {
        totalCompletionTokens += tTokens;
      }
    }
  }
  const calculatedTotalTokens = hasTokens ? totalPromptTokens + totalCompletionTokens : void 0;
  return {
    attempts: results.length,
    successRate: results.length > 0 ? results.filter((result) => result.response.ok).length / results.length : 0,
    p50LatencyMs: latencies.length > 0 ? percentile(0.5) : void 0,
    p95LatencyMs: latencies.length > 0 ? percentile(0.95) : void 0,
    totalDurationMs: totalDurationMs > 0 ? totalDurationMs : latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) : void 0,
    totalPromptTokens: hasTokens ? totalPromptTokens : void 0,
    totalCompletionTokens: hasTokens ? totalCompletionTokens : void 0,
    totalTokens: calculatedTotalTokens
  };
}
async function executeStream(request, signal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3e4);
  const abortExternal = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortExternal, { once: true });
  const startedAt = performance.now();
  try {
    const response = await silentStreamingFetch(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...request.headers },
      body: JSON.stringify(request.body),
      signal: controller.signal
    });
    if (!response.ok) {
      return { ok: false, status: response.status, eventTypes: [], latencyMs: Math.round(performance.now() - startedAt), errorMessage: `HTTP ${response.status}` };
    }
    const eventTypes = [];
    for await (const event of readSSEEvents(response, controller.signal)) {
      if (typeof event.data === "object" && event.data !== null) {
        const obj = event.data;
        if (typeof obj.type === "string") {
          eventTypes.push(obj.type);
        } else if (obj.object === "chat.completion.chunk" || Array.isArray(obj.choices)) {
          const choices = obj.choices;
          const delta = choices?.[0]?.delta;
          const finishReason = choices?.[0]?.finish_reason;
          if (finishReason) {
            eventTypes.push("chat.completion.chunk.finish");
          } else if (delta && (delta.content !== void 0 || delta.reasoning_content !== void 0 || delta.tool_calls !== void 0)) {
            eventTypes.push("chat.completion.chunk.delta");
          } else {
            eventTypes.push("chat.completion.chunk.start");
          }
        } else {
          eventTypes.push(event.event);
        }
      } else {
        eventTypes.push(event.event);
      }
    }
    return { ok: true, status: response.status, eventTypes, latencyMs: Math.round(performance.now() - startedAt) };
  } catch (error) {
    return { ok: false, status: controller.signal.aborted ? 408 : 0, eventTypes: [], latencyMs: Math.round(performance.now() - startedAt), errorMessage: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortExternal);
  }
}
function validateStreamSequence(provider, eventTypes) {
  if (provider === "anthropic") {
    if (eventTypes.some((t) => t.startsWith("chat.completion.chunk"))) {
      const hasDelta2 = eventTypes.includes("chat.completion.chunk.delta");
      return eventTypes.length >= 1 && hasDelta2 ? { pass: true, detail: `ChatCompletions \u517C\u5BB9\u6D41\u5F0F\u987A\u5E8F\u901A\u8FC7\uFF08\u6355\u83B7 ${eventTypes.length} \u4E2A Chunk \u4E8B\u4EF6\uFF09` } : { pass: false, detail: `ChatCompletions \u7F3A\u5C11\u589E\u91CF\u6570\u636E\u5305\uFF1A${eventTypes.join(" -> ")}` };
    }
    const required2 = ["message_start", "content_block_start", "content_block_delta", "message_stop"];
    const missing = required2.filter((type) => !eventTypes.includes(type));
    const ordered = required2.every((type, index) => eventTypes.indexOf(type) >= (index === 0 ? 0 : eventTypes.indexOf(required2[index - 1])));
    return missing.length === 0 && ordered ? { pass: true, detail: `Anthropic \u539F\u751F SSE \u987A\u5E8F\u901A\u8FC7\uFF1A${eventTypes.join(" -> ")}` } : { pass: false, detail: `Anthropic SSE \u7F3A\u5C11\u6216\u4E71\u5E8F\uFF1A${missing.join(", ") || eventTypes.join(" -> ")}` };
  }
  if (provider === "openrouter") {
    const hasDelta2 = eventTypes.some((t) => t === "chat.completion.chunk.delta" || t === "message" || t.includes("delta"));
    const pass2 = eventTypes.length > 0 && (hasDelta2 || eventTypes.length >= 1);
    return pass2 ? { pass: true, detail: `OpenRouter / ChatCompletions \u6D41\u5F0F\u4E8B\u4EF6\u6D41\u901A\u8FC7\uFF08\u6355\u83B7 ${eventTypes.length} \u4E2A Chunk\uFF09` } : { pass: false, detail: `\u6D41\u5F0F\u4E8B\u4EF6\u5E8F\u5217\u4E3A\u7A7A\u6216\u672A\u6355\u83B7\u6709\u6548 Delta \u6570\u636E\u5757` };
  }
  if (eventTypes.some((t) => t.startsWith("chat.completion.chunk"))) {
    const hasDelta2 = eventTypes.includes("chat.completion.chunk.delta") || eventTypes.length >= 2;
    return hasDelta2 ? { pass: true, detail: `ChatCompletions \u6D41\u5F0F\u987A\u5E8F\u901A\u8FC7\uFF08\u6355\u83B7 ${eventTypes.length} \u4E2A Chunk\uFF09` } : { pass: false, detail: `ChatCompletions \u7F3A\u5C11\u589E\u91CF\u6570\u636E\u5305\uFF1A${eventTypes.join(" -> ")}` };
  }
  const hasDelta = eventTypes.some((type) => type === "response.output_text.delta" || type === "response.content_part.added");
  const completionIndex = Math.max(eventTypes.indexOf("response.completed"), eventTypes.indexOf("response.done"));
  const deltaIndex = eventTypes.findIndex((type) => type === "response.output_text.delta" || type === "response.content_part.added");
  const pass = eventTypes.includes("response.created") && hasDelta && completionIndex > deltaIndex;
  return pass ? { pass: true, detail: `Responses SSE \u987A\u5E8F\u901A\u8FC7\uFF1A${eventTypes.join(" -> ")}` } : { pass: false, detail: `Responses SSE \u7F3A\u5C11\u6216\u4E71\u5E8F\uFF1A${eventTypes.join(" -> ") || "\u65E0\u4E8B\u4EF6"}` };
}
async function runAudit(options) {
  const profile = options.profile || "balanced";
  const provider = detectAuditProvider(options.model, options.provider || "auto");
  const adapter = PROVIDER_ADAPTERS[provider];
  const baselineSnapshot = options.baselineSnapshot || (options.baselineId ? loadBaselineSnapshot(options.baselineId) : findStoredBaseline(provider, options.model, adapter.surface));
  const suite = selectSuite(profile, options.selectedProbeIds);
  const selectedProbeIds = new Set(suite.map((item) => item.id));
  const routes = new Map(suite.map((item) => [item.id, getProbeRoute(provider, options.model, item.id)]));
  const routeFor = (id) => routes.get(id) || getProbeRoute(provider, options.model, id);
  const shouldExecute = (id) => selectedProbeIds.has(id) && routeFor(id).disposition !== "not_claimed";
  const protocol = [];
  const nativeResults = [];
  const measuredScores = {};
  const exploratoryScores = {};
  const recordScore = (domain, score, probeId) => {
    const scores = routeFor(probeId || "").disposition === "exploratory_test" ? exploratoryScores : measuredScores;
    measuredScores[domain] = measuredScores[domain] || [];
    exploratoryScores[domain] = exploratoryScores[domain] || [];
    scores[domain] = [...scores[domain] || [], score];
  };
  let reasoningResult;
  let completed = 0;
  const progress = (label) => {
    completed += 1;
    options.onProgress?.(completed, suite.length, label);
  };
  if (shouldExecute("p0-model-discovery")) try {
    const models = await fetchRemoteModels(options.baseUrl, options.apiKey, provider, options.signal);
    protocol.push({
      id: "p0-model-discovery",
      title: "\u6A21\u578B\u4E0E\u7248\u672C\u53D1\u73B0",
      status: models.length > 0 ? "pass" : "unavailable",
      detail: models.length > 0 ? `\u53D1\u73B0 ${models.length} \u4E2A\u6A21\u578B\u3002` : "\u6A21\u578B\u5217\u8868\u4E3A\u7A7A\u6216\u88AB\u4E2D\u8F6C\u7AD9\u9690\u85CF\u3002"
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    protocol.push({
      id: "p0-model-discovery",
      title: "\u6A21\u578B\u4E0E\u7248\u672C\u53D1\u73B0",
      status: /401|403|API Key/i.test(message) ? "fail" : "unavailable",
      detail: message.slice(0, 240)
    });
  }
  if (shouldExecute("p0-model-discovery")) progress("\u6A21\u578B\u53D1\u73B0");
  if (shouldExecute("p0-native-route") || shouldExecute("p0-auth-shape")) try {
    const basicResult = await execute(adapter, adapter.basic(options.baseUrl, options.apiKey, options.model), options.signal);
    nativeResults.push(basicResult);
    if (shouldExecute("p0-native-route")) protocol.push(basicEvidence(basicResult, provider, options.model, provider === "anthropic" && /openrouter\.ai/i.test(options.baseUrl)));
    if (shouldExecute("p0-auth-shape")) protocol.push({
      id: "p0-auth-shape",
      title: "\u8BA4\u8BC1\u5934\u4E0E\u9519\u8BEF\u8BED\u4E49",
      status: basicResult.response.status === 401 || basicResult.response.status === 403 ? "fail" : routeStatus(basicResult.response),
      detail: basicResult.response.ok ? "\u8BA4\u8BC1\u5934\u88AB\u63A5\u53D7\u3002" : basicResult.response.errorMessage || `HTTP ${basicResult.response.status}`,
      latencyMs: basicResult.response.latencyMs
    });
  } catch (error) {
    if (shouldExecute("p0-native-route")) protocol.push({ id: "p0-native-route", title: "\u539F\u751F API \u8DEF\u7531", status: "unavailable", detail: String(error) });
    if (shouldExecute("p0-auth-shape")) protocol.push({ id: "p0-auth-shape", title: "\u8BA4\u8BC1\u5934\u4E0E\u9519\u8BEF\u8BED\u4E49", status: "unavailable", detail: "\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002" });
  }
  if (shouldExecute("p0-native-route") || shouldExecute("p0-auth-shape")) progress("\u539F\u751F\u8DEF\u7531\u4E0E\u8BA4\u8BC1");
  if (shouldExecute("p0-strict-json") && adapter.strictJson) {
    try {
      const result = await execute(adapter, adapter.strictJson(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      let parsed = null;
      try {
        parsed = JSON.parse(result.text);
      } catch {
        parsed = null;
      }
      const pass = result.response.ok && typeof parsed === "object" && parsed !== null && parsed.status === "ok";
      protocol.push({ id: "p0-strict-json", title: "\u4E25\u683C JSON Schema", status: result.response.ok ? pass ? "pass" : "fail" : routeStatus(result.response), detail: pass ? "\u54CD\u5E94\u7B26\u5408\u56FA\u5B9A JSON \u5939\u5177\u3002" : "\u54CD\u5E94\u672A\u901A\u8FC7\u4E25\u683C JSON \u5939\u5177\u3002", latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch {
      protocol.push(unavailableEvidence("p0-strict-json", "\u4E25\u683C JSON Schema", "\u4E25\u683C JSON \u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
    }
  } else if (shouldExecute("p0-strict-json")) {
    protocol.push(unavailableEvidence("p0-strict-json", "\u4E25\u683C JSON Schema", "\u5F53\u524D\u539F\u751F\u9002\u914D\u5668\u6CA1\u6709\u8BE5\u80FD\u529B\u58F0\u660E\u3002"));
  }
  if (shouldExecute("p0-strict-json")) progress("\u4E25\u683C JSON");
  if (shouldExecute("p0-tool-shape") && adapter.tool) {
    try {
      const result = await execute(adapter, adapter.tool(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      protocol.push({ id: "p0-tool-shape", title: "\u5DE5\u5177\u8C03\u7528\u7ED3\u6784", status: result.response.ok ? result.toolCalled ? "pass" : "fail" : routeStatus(result.response), detail: result.toolCalled ? "\u6355\u83B7\u5230\u539F\u751F\u5DE5\u5177\u8C03\u7528\u4E8B\u4EF6\u3002" : "\u8BF7\u6C42\u6210\u529F\u4F46\u672A\u6355\u83B7\u5DE5\u5177\u8C03\u7528\u4E8B\u4EF6\u3002", latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch {
      protocol.push(unavailableEvidence("p0-tool-shape", "\u5DE5\u5177\u8C03\u7528\u7ED3\u6784", "\u5DE5\u5177\u8C03\u7528\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
    }
  } else if (shouldExecute("p0-tool-shape")) {
    protocol.push(unavailableEvidence("p0-tool-shape", "\u5DE5\u5177\u8C03\u7528\u7ED3\u6784", "\u5F53\u524D\u539F\u751F\u9002\u914D\u5668\u6CA1\u6709\u5DE5\u5177\u80FD\u529B\u58F0\u660E\u3002"));
  }
  if (shouldExecute("p0-tool-shape")) progress("\u5DE5\u5177\u7ED3\u6784");
  if (shouldExecute("p0-stream-events")) {
    if (!adapter.stream) {
      protocol.push(unavailableEvidence("p0-stream-events", "\u6D41\u5F0F\u4E8B\u4EF6\u987A\u5E8F", provider === "gemini" ? "Gemini Interaction streaming \u7AEF\u70B9\u5951\u7EA6\u5C1A\u672A\u5B8C\u6210\u9A8C\u8BC1\u3002" : "\u5F53\u524D Provider Adapter \u6CA1\u6709\u6D41\u5F0F\u80FD\u529B\u58F0\u660E\u3002"));
    } else {
      try {
        const stream = await executeStream(adapter.stream(options.baseUrl, options.apiKey, options.model), options.signal);
        const validation = stream.ok ? validateStreamSequence(provider, stream.eventTypes) : { pass: false, detail: stream.errorMessage || `HTTP ${stream.status}` };
        protocol.push({ id: "p0-stream-events", title: "\u6D41\u5F0F\u4E8B\u4EF6\u987A\u5E8F", status: stream.ok ? validation.pass ? "pass" : "fail" : routeStatus({ ok: false, status: stream.status }), detail: validation.detail, latencyMs: stream.latencyMs, rawEventTypes: stream.eventTypes });
      } catch {
        protocol.push(unavailableEvidence("p0-stream-events", "\u6D41\u5F0F\u4E8B\u4EF6\u987A\u5E8F", "SSE \u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
  }
  if (shouldExecute("p0-invalid-parameter")) protocol.push(unavailableEvidence("p0-invalid-parameter", "\u975E\u6CD5\u53C2\u6570\u56DE\u663E", "\u4E3A\u907F\u514D\u5BF9\u771F\u5B9E\u7AEF\u70B9\u9020\u6210\u7834\u574F\u6027\u8BF7\u6C42\uFF0C\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u6267\u884C\u975E\u6CD5\u53C2\u6570\u6D4B\u8BD5\u3002"));
  if (["p0-stream-events", "p0-invalid-parameter"].some(shouldExecute)) progress("P0 \u534F\u8BAE\u8986\u76D6");
  if ((shouldExecute("p1-reasoning-config") || shouldExecute("p1-signature-continuity")) && adapter.reasoning) {
    try {
      reasoningResult = await execute(adapter, adapter.reasoning(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(reasoningResult);
      const reasoningTokens = reasoningTokenCount(reasoningResult);
      const hasReasoning = reasoningResult.eventTypes.some((type) => /reason|thinking|redacted/i.test(type)) || Boolean(reasoningResult.signature) || reasoningTokens !== void 0 && reasoningTokens > 0;
      const reasoningStatus = !reasoningResult.response.ok ? routeStatus(reasoningResult.response) : hasReasoning ? "pass" : "unavailable";
      const usageDetail = reasoningTokens === void 0 ? "" : ` thoughts tokens=${reasoningTokens}.`;
      protocol.push({ id: "p1-reasoning-config", title: "\u63A8\u7406\u914D\u7F6E\u900F\u4F20", status: reasoningStatus, detail: hasReasoning ? `\u6355\u83B7\u5230\u539F\u751F\u63A8\u7406\u8BC1\u636E\u3002${usageDetail}` : `\u54CD\u5E94\u6210\u529F\u4F46\u672A\u66B4\u9732\u53EF\u9A8C\u8BC1\u7684\u63A8\u7406\u4E8B\u4EF6\u6216 token usage\u3002${usageDetail}`, latencyMs: reasoningResult.response.latencyMs, rawEventTypes: reasoningResult.eventTypes });
    } catch {
      protocol.push(unavailableEvidence("p1-reasoning-config", "\u63A8\u7406\u914D\u7F6E\u900F\u4F20", "\u63A8\u7406\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
    }
  } else if (shouldExecute("p1-reasoning-config")) {
    protocol.push(unavailableEvidence("p1-reasoning-config", "\u63A8\u7406\u914D\u7F6E\u900F\u4F20", "\u5F53\u524D\u539F\u751F\u9002\u914D\u5668\u6CA1\u6709\u63A8\u7406\u80FD\u529B\u58F0\u660E\u3002"));
  }
  if (shouldExecute("p1-reasoning-config") || shouldExecute("p1-signature-continuity")) progress("\u63A8\u7406\u914D\u7F6E");
  if (shouldExecute("p1-state-continuity")) {
    const marker = `STATE_MARKER_${options.model.replace(/[^a-zA-Z0-9]/g, "_")}`;
    if (!adapter.state || !adapter.stateContinuation) {
      protocol.push(unavailableEvidence("p1-state-continuity", "\u8DE8\u8F6E\u72B6\u6001\u8FDE\u7EED\u6027", provider === "gemini" ? "Gemini Interaction continuation \u7684\u5B57\u6BB5\u5951\u7EA6\u5C1A\u672A\u5B8C\u6210\u9A8C\u8BC1\u3002" : "\u5F53\u524D Provider Adapter \u6CA1\u6709\u72B6\u6001\u8FDE\u7EED\u6027\u80FD\u529B\u58F0\u660E\u3002"));
    } else {
      try {
        const first = await execute(adapter, adapter.state(options.baseUrl, options.apiKey, options.model, marker), options.signal);
        nativeResults.push(first);
        const continuation = first.response.ok ? await execute(adapter, adapter.stateContinuation(options.baseUrl, options.apiKey, options.model, first, marker), options.signal) : void 0;
        if (continuation) nativeResults.push(continuation);
        const passed = Boolean(first.response.ok && continuation?.response.ok && containsFixtureText(continuation.text, marker));
        if (first.response.ok && continuation) recordScore("tools", passed ? 1 : 0, "p1-state-continuity");
        protocol.push({
          id: "p1-state-continuity",
          title: "\u8DE8\u8F6E\u72B6\u6001\u8FDE\u7EED\u6027",
          status: !first.response.ok ? routeStatus(first.response) : !continuation ? "unavailable" : continuation.response.ok ? passed ? "pass" : "fail" : routeStatus(continuation.response),
          detail: passed ? "\u7B2C\u4E8C\u8F6E\u8BF7\u6C42\u901A\u8FC7 provider \u539F\u751F\u72B6\u6001\u5F15\u7528\u6062\u590D\u5E76\u56DE\u663E marker\u3002" : continuation?.response.errorMessage || "\u7B2C\u4E8C\u8F6E\u672A\u6062\u590D\u7B2C\u4E00\u8F6E\u4FDD\u5B58\u7684\u72B6\u6001 marker\u3002",
          latencyMs: continuation?.response.latencyMs ?? first.response.latencyMs,
          rawEventTypes: [...first.eventTypes, ...continuation?.eventTypes || []]
        });
      } catch {
        protocol.push(unavailableEvidence("p1-state-continuity", "\u8DE8\u8F6E\u72B6\u6001\u8FDE\u7EED\u6027", "\u8DE8\u8F6E\u72B6\u6001\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
  }
  const runToolRoundtrip = async (id, title) => {
    if (!adapter.tool || !adapter.toolContinuation) {
      protocol.push(unavailableEvidence(id, title, provider === "gemini" ? "Gemini Interaction continuation \u7684\u5B57\u6BB5\u5951\u7EA6\u5C1A\u672A\u5B8C\u6210\u9A8C\u8BC1\u3002" : "\u5F53\u524D Provider Adapter \u6CA1\u6709\u5DE5\u5177\u56DE\u4F20\u80FD\u529B\u58F0\u660E\u3002"));
      return;
    }
    try {
      const first = await execute(adapter, adapter.tool(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(first);
      const args = first.toolCall?.arguments;
      const validArguments = typeof args === "object" && args !== null && args.a === 19 && args.b === 23;
      if (!first.response.ok || !first.toolCall || first.toolCall.name !== "audit_sum" || !validArguments) {
        protocol.push({ id, title, status: first.response.ok ? "fail" : routeStatus(first.response), detail: first.response.ok ? "\u9996\u8F6E\u672A\u4EA7\u751F\u7B26\u5408\u9884\u671F\u7684 audit_sum \u5DE5\u5177\u8C03\u7528\u3002" : first.response.errorMessage || `HTTP ${first.response.status}`, latencyMs: first.response.latencyMs, rawEventTypes: first.eventTypes });
        recordScore("tools", 0, id);
        return;
      }
      const continuation = await execute(adapter, adapter.toolContinuation(options.baseUrl, options.apiKey, options.model, first, "42"), options.signal);
      nativeResults.push(continuation);
      const consumed = continuation.response.ok && /(^|\D)42(\D|$)/.test(continuation.text);
      recordScore("tools", consumed ? 1 : 0, id);
      protocol.push({ id, title, status: continuation.response.ok ? consumed ? "pass" : "fail" : routeStatus(continuation.response), detail: consumed ? "\u6A21\u578B\u53D1\u8D77 audit_sum\uFF0C\u6536\u5230\u56FA\u5B9A mock \u7ED3\u679C 42\uFF0C\u5E76\u5728\u7B2C\u4E8C\u8F6E\u6D88\u8D39\u8BE5\u7ED3\u679C\u3002" : continuation.response.ok ? "\u7B2C\u4E8C\u8F6E\u54CD\u5E94\u672A\u6D88\u8D39\u56FA\u5B9A mock \u7ED3\u679C 42\u3002" : continuation.response.errorMessage || `HTTP ${continuation.response.status}`, latencyMs: continuation.response.latencyMs, rawEventTypes: [...first.eventTypes, ...continuation.eventTypes] });
    } catch {
      recordScore("tools", 0, id);
      protocol.push(unavailableEvidence(id, title, "\u5DE5\u5177\u56DE\u4F20\u7B2C\u4E8C\u8F6E\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
    }
  };
  if (shouldExecute("p1-tool-roundtrip")) await runToolRoundtrip("p1-tool-roundtrip", "\u53D7\u63A7\u5DE5\u5177\u56DE\u5408");
  if (shouldExecute("p2-tool-planning")) await runToolRoundtrip("p2-tool-planning", "\u53CC\u56DE\u5408\u5DE5\u5177\u89C4\u5212");
  if (shouldExecute("p1-signature-continuity") && provider === "anthropic" && reasoningResult) {
    const thinkingBlock = reasoningResult.thinkingBlock;
    if (thinkingBlock && adapter.signatureContinuation) {
      try {
        const continuation = await execute(adapter, adapter.signatureContinuation(options.baseUrl, options.apiKey, options.model, thinkingBlock, reasoningResult.text), options.signal);
        nativeResults.push(continuation);
        const blockDesc = thinkingBlock.type === "redacted_thinking" ? "redacted_thinking \u52A0\u5BC6\u5757\uFF08\u6309\u539F\u5F62\u72B6\u56DE\u4F20\uFF09" : `thinking signature\uFF08\u957F\u5EA6 ${String(thinkingBlock.signature ?? "").length}\uFF09`;
        protocol.push({
          id: "p1-signature-continuity",
          title: "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027",
          status: continuation.response.ok ? "pass" : routeStatus(continuation.response),
          detail: continuation.response.ok ? `\u6355\u83B7\u5E76\u6210\u529F\u56DE\u4F20 Anthropic ${blockDesc}\uFF0C\u5B98\u65B9\u9A8C\u7B7E\u95ED\u73AF\u901A\u8FC7\u3002` : continuation.response.errorMessage || `\u7B7E\u540D\u56DE\u4F20 HTTP ${continuation.response.status}`,
          latencyMs: continuation.response.latencyMs,
          rawEventTypes: continuation.eventTypes
        });
      } catch {
        protocol.push(unavailableEvidence("p1-signature-continuity", "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027", "\u7B7E\u540D\u7B2C\u4E8C\u8F6E\u56DE\u4F20\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    } else {
      protocol.push({ id: "p1-signature-continuity", title: "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027", status: reasoningResult.response.ok ? "unavailable" : routeStatus(reasoningResult.response), detail: reasoningResult.response.ok ? "\u672C\u6B21 adaptive thinking \u672A\u89E6\u53D1\uFF0C\u65E0\u6CD5\u68C0\u67E5 signature\u3002" : "\u63A8\u7406\u8DEF\u7531\u4E0D\u53EF\u7528\uFF0C\u65E0\u6CD5\u68C0\u67E5\u7B7E\u540D\u3002", latencyMs: reasoningResult.response.latencyMs });
    }
  } else if (shouldExecute("p1-signature-continuity")) {
    protocol.push(unavailableEvidence("p1-signature-continuity", "\u601D\u8003\u7B7E\u540D\u8FDE\u7EED\u6027", "\u8BE5\u68C0\u67E5\u4EC5\u9002\u7528\u4E8E Anthropic Messages thinking \u534F\u8BAE\u3002"));
  }
  if (shouldExecute("p1-cache-semantics")) {
    if (!adapter.cache) {
      protocol.push(unavailableEvidence("p1-cache-semantics", "\u7F13\u5B58\u8BED\u4E49", provider === "gemini" ? "Gemini context caching \u8BF7\u6C42\u5B57\u6BB5\u5C1A\u672A\u5B8C\u6210\u9A8C\u8BC1\u3002" : "\u5F53\u524D Provider Adapter \u6CA1\u6709\u7F13\u5B58\u8BF7\u6C42\u80FD\u529B\u58F0\u660E\u3002"));
    } else {
      const cachePrefix = Array.from({ length: 1400 }, (_, index) => `cache-prefix-token-${index}`).join(" ");
      try {
        const first = await execute(adapter, adapter.cache(options.baseUrl, options.apiKey, options.model, cachePrefix), options.signal);
        nativeResults.push(first);
        const second = await execute(adapter, adapter.cache(options.baseUrl, options.apiKey, options.model, cachePrefix), options.signal);
        nativeResults.push(second);
        const firstCached = cachedInputTokens(first);
        const secondCached = cachedInputTokens(second);
        const hasEvidence = firstCached !== void 0 && secondCached !== void 0;
        const passed = hasEvidence && (secondCached ?? 0) > (firstCached ?? 0);
        protocol.push({
          id: "p1-cache-semantics",
          title: "\u7F13\u5B58\u8BED\u4E49",
          status: !first.response.ok ? routeStatus(first.response) : !second.response.ok ? routeStatus(second.response) : !hasEvidence ? "unavailable" : passed ? "pass" : "fail",
          detail: passed ? `\u7B2C\u4E8C\u6B21\u8BF7\u6C42\u7F13\u5B58\u8F93\u5165 token \u589E\u52A0\uFF08${firstCached} -> ${secondCached}\uFF09\u3002` : !first.response.ok ? first.response.errorMessage || `HTTP ${first.response.status}` : !second.response.ok ? second.response.errorMessage || `HTTP ${second.response.status}` : hasEvidence ? `\u672A\u89C2\u5BDF\u5230\u7B2C\u4E8C\u6B21\u8BF7\u6C42\u7F13\u5B58\u547D\u4E2D\u589E\u52A0\uFF08${firstCached} -> ${secondCached}\uFF09\u3002` : "\u54CD\u5E94\u672A\u66B4\u9732\u53EF\u9A8C\u8BC1\u7684\u7F13\u5B58 token usage \u5B57\u6BB5\u3002",
          latencyMs: second.response.latencyMs,
          rawEventTypes: [...first.eventTypes, ...second.eventTypes]
        });
      } catch {
        protocol.push(unavailableEvidence("p1-cache-semantics", "\u7F13\u5B58\u8BED\u4E49", "\u7F13\u5B58\u8BED\u4E49\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
  }
  if (["p1-state-continuity", "p1-tool-roundtrip", "p1-signature-continuity", "p1-cache-semantics"].some(shouldExecute)) progress("P1 \u72B6\u6001\u8986\u76D6");
  const contextProbeIds = ["p2-context-start", "p2-context-middle", "p2-context-end"].filter(shouldExecute);
  if (contextProbeIds.length > 0) {
    for (const probeId of contextProbeIds) {
      const position = probeId.endsWith("start") ? "start" : probeId.endsWith("middle") ? "middle" : "end";
      const fixture = createNeedleFixture(`${options.model}-${position}`, position, 64e3);
      if (!adapter.context) {
        protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, "\u5F53\u524D Provider Adapter \u672A\u5B9E\u73B0\u957F\u4E0A\u4E0B\u6587\u8BF7\u6C42\u3002"));
        continue;
      }
      try {
        const result = await execute(adapter, adapter.context(options.baseUrl, options.apiKey, options.model, fixture.document), options.signal);
        nativeResults.push(result);
        const score = scoreNeedleResponse(result.text, fixture.expectedAnswer);
        recordScore("context", score.score / 100, probeId);
        protocol.push({
          id: probeId,
          title: suite.find((item) => item.id === probeId)?.title || probeId,
          status: result.response.ok ? score.passed ? "pass" : "fail" : routeStatus(result.response),
          detail: result.response.ok ? `needle ${position} \u68C0\u7D22\u5F97\u5206 ${score.score}/100\uFF0C\u8F93\u5165\u7EA6 ${fixture.estimatedTokens.toLocaleString()} tokens\u3002` : result.response.errorMessage || `HTTP ${result.response.status}`,
          latencyMs: result.response.latencyMs,
          rawEventTypes: result.eventTypes
        });
      } catch {
        protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, "\u957F\u4E0A\u4E0B\u6587\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
    progress("\u957F\u4E0A\u4E0B\u6587\u68C0\u7D22");
  }
  if (shouldExecute("p2-constraint-json")) {
    if (!adapter.strictJson) {
      protocol.push(unavailableEvidence("p2-constraint-json", "\u7EA6\u675F JSON \u4EFB\u52A1", "\u5F53\u524D Provider Adapter \u672A\u5B9E\u73B0\u4E25\u683C JSON\u3002"));
    } else {
      try {
        const result = await execute(adapter, adapter.strictJson(options.baseUrl, options.apiKey, options.model), options.signal);
        nativeResults.push(result);
        let parsed = null;
        try {
          parsed = JSON.parse(result.text);
        } catch {
          parsed = null;
        }
        const passed = result.response.ok && typeof parsed === "object" && parsed !== null && parsed.status === "ok";
        recordScore("structured_output", passed ? 1 : 0, "p2-constraint-json");
        protocol.push({ id: "p2-constraint-json", title: "\u7EA6\u675F JSON \u4EFB\u52A1", status: result.response.ok ? passed ? "pass" : "fail" : routeStatus(result.response), detail: passed ? "\u7EA6\u675F JSON \u4EFB\u52A1\u901A\u8FC7\u3002" : "\u7EA6\u675F JSON \u4EFB\u52A1\u672A\u901A\u8FC7\u3002", latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
      } catch {
        protocol.push(unavailableEvidence("p2-constraint-json", "\u7EA6\u675F JSON \u4EFB\u52A1", "\u7EA6\u675F JSON \u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
  }
  for (const probeId of ["p2-chart-extraction", "p2-code-repair-a", "p2-code-repair-b"]) {
    if (shouldExecute(probeId)) {
      const title = suite.find((item) => item.id === probeId)?.title || probeId;
      if (!probeId.startsWith("p2-code-repair")) {
        protocol.push(unavailableEvidence(probeId, title, "\u8BE5 P2 \u4EFB\u52A1\u9700\u8981\u89C6\u89C9\u8F93\u5165\u9002\u914D\u5668\uFF0C\u5F53\u524D\u7F51\u9875\u9636\u6BB5\u5C1A\u672A\u5B9E\u73B0\u3002"));
        continue;
      }
      if (!adapter.codeRepair) {
        protocol.push(unavailableEvidence(probeId, title, "\u5F53\u524D Provider Adapter \u672A\u5B9E\u73B0\u4EE3\u7801\u4FEE\u590D\u8BF7\u6C42\u3002"));
        continue;
      }
      try {
        const fixture = createCodeRepairFixture(probeId.endsWith("-a") ? "arithmetic" : "set");
        const result = await execute(adapter, adapter.codeRepair(options.baseUrl, options.apiKey, options.model, fixture.instruction, fixture.source), options.signal);
        nativeResults.push(result);
        const score = scoreCodeRepairResponse(result.text, fixture);
        recordScore("code", score.score / 100, probeId);
        protocol.push({ id: probeId, title, status: result.response.ok ? score.passed ? "pass" : "fail" : routeStatus(result.response), detail: result.response.ok ? `\u9690\u85CF\u65AD\u8A00\u901A\u8FC7 ${score.matched.length}/${fixture.expectedTokens.length} \u9879\u3002` : result.response.errorMessage || `HTTP ${result.response.status}`, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
      } catch {
        protocol.push(unavailableEvidence(probeId, title, "\u4EE3\u7801\u4FEE\u590D\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
      }
    }
  }
  const repeatProbeIds = ["p3-repeat-a", "p3-repeat-b", "p3-repeat-c", "p3-repeat-d"].filter(shouldExecute);
  for (const probeId of repeatProbeIds) {
    try {
      const result = await execute(adapter, adapter.basic(options.baseUrl, options.apiKey, options.model), options.signal);
      nativeResults.push(result);
      protocol.push({ id: probeId, title: suite.find((item) => item.id === probeId)?.title || probeId, status: result.response.ok ? "pass" : routeStatus(result.response), detail: result.response.ok ? "\u91CD\u590D\u8FD0\u884C\u6837\u672C\u8BF7\u6C42\u6210\u529F\u3002" : result.response.errorMessage || `HTTP ${result.response.status}`, latencyMs: result.response.latencyMs, rawEventTypes: result.eventTypes });
    } catch {
      protocol.push(unavailableEvidence(probeId, suite.find((item) => item.id === probeId)?.title || probeId, "\u91CD\u590D\u8FD0\u884C\u6837\u672C\u8BF7\u6C42\u672A\u80FD\u5B8C\u6210\u3002"));
    }
  }
  if (repeatProbeIds.length > 0) progress("\u91CD\u590D\u8FD0\u884C\u8D28\u91CF");
  const capabilities = CAPABILITY_DOMAINS.map((domain) => ({ ...unavailableMetric(domain, options.baselineId, measuredScores[domain] || []), exploratoryScores: exploratoryScores[domain] || [] }));
  const seed = options.seed || `audit-${provider}-${options.model}-${profile}`;
  const comparedCapabilities = capabilities.map((metric) => {
    const baselineScores = baselineSnapshot?.capabilityDistributions[metric.domain] || [];
    if (!metric.targetScores.length || !baselineScores.length) return metric;
    const comparison = bootstrapDifference(metric.targetScores, baselineScores, `${seed}:${metric.domain}`, 2e3);
    return {
      ...metric,
      baselineScores,
      delta: comparison.delta,
      confidenceInterval: comparison.interval,
      status: comparison.interval[1] <= -0.15 ? "fail" : "pass",
      detail: `\u76EE\u6807\u6837\u672C ${metric.targetScores.length} \u4E2A\uFF0C\u57FA\u7EBF\u6837\u672C ${baselineScores.length} \u4E2A\uFF1B\u5DEE\u5F02 ${(comparison.delta * 100).toFixed(1)} \u4E2A\u767E\u5206\u70B9\uFF0C95% \u533A\u95F4 ${(comparison.interval[0] * 100).toFixed(1)} \u81F3 ${(comparison.interval[1] * 100).toFixed(1)} \u4E2A\u767E\u5206\u70B9\u3002`
    };
  });
  for (const item of suite) {
    const route = routeFor(item.id);
    if (route.disposition === "not_claimed" && !protocol.some((evidence) => evidence.id === item.id)) {
      protocol.push(unavailableEvidence(item.id, item.title, `\u672A\u58F0\u660E\u8BE5\u80FD\u529B\uFF0C\u5DF2\u8DF3\u8FC7\u6B63\u5F0F\u8BC4\u5206\uFF1A${route.reason}`));
    }
  }
  const visibleProtocol = protocol.filter((item) => selectedProbeIds.has(item.id)).map((item) => ({
    ...item,
    disposition: routeFor(item.id).disposition,
    countsTowardReferenceConclusion: routeFor(item.id).countsTowardReferenceConclusion
  }));
  const coverage = {
    executed: visibleProtocol.filter((item) => item.status !== "unavailable").length,
    total: suite.length,
    unavailable: visibleProtocol.filter((item) => item.status === "unavailable" && item.disposition !== "not_claimed").length,
    notClaimed: visibleProtocol.filter((item) => item.disposition === "not_claimed").length,
    exploratory: visibleProtocol.filter((item) => item.disposition === "exploratory_test").length
  };
  const conclusion = determineConclusion(comparedCapabilities);
  options.onProgress?.(suite.length, suite.length, "\u5BA1\u8BA1\u5B8C\u6210");
  return {
    schemaVersion: "4.0",
    target: { provider, model: options.model, baseUrl: options.baseUrl },
    profile,
    baselineId: baselineSnapshot?.id || options.baselineId,
    protocol: visibleProtocol,
    capabilities: comparedCapabilities,
    runtime: runtimeFrom(nativeResults),
    conclusion,
    summary: buildAuditSummary({
      schemaVersion: "4.0",
      target: { provider, model: options.model, baseUrl: options.baseUrl },
      profile,
      baselineId: baselineSnapshot?.id || options.baselineId,
      protocol: visibleProtocol,
      capabilities: comparedCapabilities,
      runtime: runtimeFrom(nativeResults),
      conclusion,
      summary: "",
      candidateDistances: [],
      fixtureHashes: Object.fromEntries(suite.map((item) => [item.id, hashFixture(item.fixture)])),
      coverage,
      selectedProbeIds: suite.map((item) => item.id),
      seed,
      testedAt: (/* @__PURE__ */ new Date()).toISOString()
    }),
    candidateDistances: [],
    fixtureHashes: Object.fromEntries(suite.map((item) => [item.id, hashFixture(item.fixture)])),
    coverage,
    selectedProbeIds: suite.map((item) => item.id),
    seed,
    testedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/engine/baselines/modelSyncService.ts
var FALLBACK_2026_MODELS = [
  {
    provider: "OpenAI",
    modelId: "gpt-5.6-sol",
    name: "GPT-5.6 Sol",
    tier: "\u65D7\u8230\u590D\u6742\u63A8\u7406\u4E0E\u81EA\u4E3B\u4EE3\u7801 (Flagship)",
    surface: "Responses",
    contextLength: 256e3,
    notes: "OpenAI \u65B0\u4EE3\u65D7\u8230\u63A8\u7406\u4E0E\u4EE3\u7801\u6A21\u578B\uFF1B`gpt-5.6` \u522B\u540D\u81EA\u52A8\u8DEF\u7531\u81F3\u6B64"
  },
  {
    provider: "OpenAI",
    modelId: "gpt-5.6-terra",
    name: "GPT-5.6 Terra",
    tier: "\u5747\u8861\u5168\u80FD\u5DE5\u4F5C\u9A6C (Balanced)",
    surface: "Responses",
    contextLength: 2e5,
    notes: "\u901A\u7528\u5747\u8861\u578B\u9AD8\u6027\u4EF7\u6BD4\u65D7\u8230\uFF0C\u9002\u5408\u5927\u90E8\u5206\u590D\u6742 Agent \u7F16\u6392"
  },
  {
    provider: "OpenAI",
    modelId: "gpt-5.6-luna",
    name: "GPT-5.6 Luna",
    tier: "\u6781\u901F\u4F4E\u5EF6\u8FDF\u8F7B\u91CF\u7EA7 (High-Throughput)",
    surface: "Responses",
    contextLength: 128e3,
    notes: "\u9AD8\u541E\u5410\u6210\u672C\u654F\u611F\u578B\uFF0C\u4E9A\u79D2\u7EA7\u5EF6\u8FDF"
  },
  {
    provider: "Anthropic",
    modelId: "claude-fable-5",
    name: "Claude Fable 5",
    tier: "\u5168\u80FD\u65D7\u8230\u4E0E\u9876\u5C16\u7F16\u7A0B (Next-Gen Flagship)",
    surface: "Messages",
    contextLength: 5e5,
    notes: "\u5E7F\u6CDB\u53EF\u7528\u6700\u9AD8\u80FD\u529B\uFF0C\u539F\u751F\u652F\u6301 Adaptive Thinking"
  },
  {
    provider: "Anthropic",
    modelId: "claude-opus-5",
    name: "Claude Opus 5",
    tier: "\u590D\u6742\u79D1\u7814\u4E0E\u91CD\u578B\u5DE5\u7A0B\u65D7\u8230 (Enterprise Frontier)",
    surface: "Messages",
    contextLength: 5e5,
    notes: "\u590D\u6742\u7CFB\u7EDF\u67B6\u6784\u4E0E\u79D1\u5B66\u524D\u6CBF\u63A8\u6F14"
  },
  {
    provider: "Anthropic",
    modelId: "claude-sonnet-5",
    name: "Claude Sonnet 5",
    tier: "\u5168\u80FD\u9AD8\u80FD\u6548\u4E3B\u529B\u519B (Frontier Workhorse)",
    surface: "Messages",
    contextLength: 2e5,
    notes: "\u9AD8\u901F\u654F\u6377\u3001\u9876\u5C16\u4EE3\u7801\u751F\u6210\u4E0E\u5DE5\u5177\u8C03\u7528"
  },
  {
    provider: "Google",
    modelId: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro Preview",
    tier: "\u591A\u6A21\u6001\u4E0E\u957F\u4E0A\u4E0B\u6587\u65D7\u8230 (Multimodal Frontier)",
    surface: "Interactions",
    contextLength: 2e6,
    notes: "\u8D85\u957F\u4E0A\u4E0B\u6587\u6DF1\u5EA6\u63A8\u6F14\uFF0C\u652F\u6301 Thought Signatures \u8DE8\u8F6E\u4FDD\u6301"
  },
  {
    provider: "Google",
    modelId: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    tier: "\u6781\u901F\u4EE3\u7801\u4E0E Agent \u5DE5\u4F5C\u9A6C (Ultra Fast)",
    surface: "Interactions",
    contextLength: 1e6,
    notes: "GA \u751F\u4EA7\u7EA7 Agent \u8C03\u5EA6\u6A21\u578B\uFF0C\u4F4E\u5EF6\u8FDF\u9AD8\u5E76\u53D1\u541E\u5410"
  },
  {
    provider: "xAI",
    modelId: "grok-4.6",
    name: "Grok 4.6",
    tier: "\u5168\u6A21\u6001\u5B9E\u65F6\u63A8\u7406\u4E0E\u4EE3\u7801 (Realtime Agent)",
    surface: "Responses",
    contextLength: 256e3,
    notes: "\u539F\u751F\u96C6\u6210 X \u5B9E\u65F6\u641C\u7D22\u3001Python \u4EE3\u7801\u6C99\u7BB1\u4E0E\u7ED3\u6784\u5316\u5DE5\u5177\u6D88\u8D39"
  }
];
function generateFrontierModelsMarkdown(models, dateStr) {
  const tableRows = models.map(
    (m) => `| ${m.provider} | \`${m.modelId}\` | ${m.tier} | ${m.surface} |`
  ).join("\n");
  const formattedDate = dateStr;
  return `---
title: 2026 \u524D\u6CBF\u6A21\u578B\u57FA\u7EBF\u6E05\u5355
category: intro
categoryTitle: \u7B80\u4ECB
order: 2
subtitle: \u622A\u6B62 ${formattedDate}\uFF0C\u7528\u4E8E API \u5BA1\u8BA1\u7684\u5B98\u65B9\u6A21\u578B\u76EE\u6807\u4E0E\u539F\u751F API \u57FA\u7EBF\uFF1B\u652F\u6301\u81EA\u52A8\u4E0E\u624B\u52A8\u5B9A\u65F6\u540C\u6B65\u3002
---

## 1. 2026 \u524D\u6CBF\u7EAF\u8840\u65D7\u8230\u57FA\u7EBF\u603B\u89C8

\u6B64\u6E05\u5355\u7531 **API-QuickCheck \u81EA\u52A8\u5316\u57FA\u7EBF\u5F15\u64CE** \u5B9A\u671F\u7EF4\u62A4\u66F4\u65B0\uFF0C\u662F\u5BA1\u8BA1\u5668\u7684**\u7248\u672C\u5316\u53C2\u8003\u57FA\u7EBF**\uFF0C\u4E25\u683C\u805A\u7126 2026 \u5E74\u56DB\u5927\u524D\u6CBF\u65D7\u8230\u4F53\u7CFB\uFF08OpenAI GPT-5.6\u3001Anthropic Claude 5\u3001Google Gemini 3\u3001xAI Grok 4.6\uFF09\uFF0C\u675C\u7EDD\u5DF2\u8FC7\u65F6\u6DD8\u6C70\u7684\u5386\u53F2\u65E7\u578B\u53F7\u3002\u6BCF\u6B21\u5BA1\u8BA1\u5E94\u8C03\u7528\u5BF9\u5E94\u5382\u5546\u7684 Models API \u6216\u8BFB\u53D6\u5B98\u65B9\u76EE\u5F55\uFF0C\u4E25\u683C\u5339\u914D\u578B\u53F7 ID\u3001\u91C7\u6837\u65E5\u671F\u3001\u5730\u533A\u3001\u670D\u52A1\u5C42\u548C API \u9762\u3002

| \u5382\u5546 | \u4E3B\u8981\u5BA1\u8BA1\u76EE\u6807 | \u5B9A\u4F4D\u4E0E\u80FD\u529B\u6863\u4F4D | \u4F18\u5148\u539F\u751F API |
| :--- | :--- | :--- | :--- |
${tableRows}

## 2. \u5404\u5382\u5546\u6838\u5FC3\u578B\u53F7\u7279\u6027\u4E0E\u5BA1\u8BA1\u6CE8\u610F\u4E8B\u9879

### OpenAI GPT-5.6 \u65D7\u8230\u7CFB\u5217

- **Sol\u3001Terra\u3001Luna \u5206\u7EA7**\uFF1A\u5C5E\u4E8E\u4E0D\u540C\u8BBE\u8BA1\u76EE\u6807\u6863\u4F4D\uFF0C\u4E0D\u80FD\u628A\u5176\u4E2D\u4EFB\u4E00\u6863\u7684\u8BC4\u5206\u5F53\u4F5C\u53E6\u4E00\u6863\u201C\u7F29\u6C34\u201D\u7684\u5145\u5206\u8BC1\u636E\u3002
- **\u5BA1\u8BA1\u91CD\u70B9**\uFF1A\u4F18\u5148\u6D4B\u8BD5 Responses API \u7684\u4E25\u683C\u7ED3\u6784\u5316 JSON Schema \u8F93\u51FA\u3001\u539F\u751F\u51FD\u6570\u5DE5\u5177\u8C03\u7528\u95ED\u73AF\u3001\u914D\u7F6E\u5316\u63A8\u7406\u601D\u8003\u9884\u7B97\u548C\u591A\u6A21\u6001\u56FE\u50CF\u80FD\u529B\u3002
- **\u9632\u5192\u5145\u5224\u5B9A**\uFF1A\u68C0\u67E5 \`system_fingerprint\` \u6296\u52A8\u5206\u5E03\u4EE5\u53CA\u5BF9\u4E8E\u9AD8\u96BE\u903B\u8F91\u9677\u9631\u9898\u7684\u62D2\u7B54/\u53CD\u601D\u7279\u5F81\u3002

### Anthropic Claude 5 \u65D7\u8230\u7CFB\u5217

- **Adaptive Thinking**\uFF1AClaude 5 (Fable/Opus/Sonnet) \u5177\u5907\u81EA\u9002\u5E94\u601D\u8003\u673A\u5236\uFF1B\u65E7\u7248\u56FA\u5B9A\u5B57\u6570\u63A2\u9488\u4E0D\u518D\u9002\u7528\u3002
- **Thinking Signatures**\uFF1AClaude \u56DE\u4F20\u7684 \`signature\` \u662F\u601D\u8003\u5757\u4E0A\u4E0B\u6587\u8FDE\u7EED\u6027\u7684\u52A0\u5BC6\u51ED\u636E\uFF1B\u4E2D\u8F6C\u7AD9\u82E5\u4F2A\u9020\u6216\u4E22\u5931\u8BE5\u5B57\u6BB5\uFF0C\u5C06\u65E0\u6CD5\u6B63\u5E38\u8FDB\u884C\u591A\u8F6E\u6DF1\u5165\u63A8\u6F14\u3002

### Google Gemini 3 \u7CFB\u5217

- **\u63A8\u8350 API \u754C\u9762**\uFF1A\u4F18\u5148\u4F7F\u7528 Google \u5B98\u65B9 Interactions API \u7AEF\u70B9\u8FDB\u884C\u5BA1\u8BA1\u3002
- **Thought Signatures \u72B6\u6001\u673A**\uFF1A\u7528\u4E8E\u7EF4\u6301\u8DE8\u8F6E\u6DF1\u5EA6\u601D\u8003\u72B6\u6001\uFF1B\u5728 stateful interaction \u6A21\u5F0F\u4E0B\u7531\u670D\u52A1\u7AEF\u539F\u751F\u5904\u7406\u3002\u7CFB\u7EDF\u7ED3\u6784\u5316\u6355\u83B7 \`thoughts_token_count\`\u3002

### xAI Grok 4.6 \u7CFB\u5217

- **\u5DE5\u5177\u751F\u6001\u6D88\u8D39**\uFF1AGrok 4.6 \u539F\u751F\u63D0\u4F9B function calling\u3001\u5B9E\u65F6 X \u641C\u7D22\u68C0\u7D22\u3001\u4EE3\u7801\u6267\u884C\u6C99\u7BB1\u7B49\u96C6\u6210\u80FD\u529B\u3002
- **\u5BA1\u8BA1\u51C6\u5219**\uFF1A\u5728\u9694\u79BB\u7684\u53D7\u63A7\u6D4B\u8BD5\u73AF\u5883\u4E2D\u9A8C\u8BC1\u5176\u51FD\u6570\u7B7E\u540D\u548C Python \u6C99\u7BB1\u4EE3\u7801\u4FEE\u590D\u884C\u4E3A\u3002

## 3. 2026 \u5B98\u65B9\u6743\u5A01\u53C2\u8003\u6807\u5C3A\u5BF9\u6BD4\u77E9\u9635 (Master Reference Matrix)

\u4EE5\u4E0B\u4E3A\u7531 API-QuickCheck \u6743\u5A01\u6D4B\u8BD5\u6E90\uFF08Vertex AI \u5168\u7403\u7AEF\u70B9\u3001OpenRouter \u5B98\u65B9\u53C2\u8003\u76F4\u8FDE\uFF09\u5B9E\u6D4B\u5EFA\u7ACB\u7684 100% \u9EC4\u91D1\u53C2\u8003\u6807\u5C3A\u77E9\u9635\uFF1A

| \u5382\u5546\u4E0E\u578B\u53F7 | Strict JSON | \u53CC\u56DE\u5408\u5DE5\u5177\u95ED\u73AF | Python \u6C99\u7BB1\u65AD\u8A00 | \u539F\u751F\u601D\u8003\u94FE/Token\u6355\u83B7 | 105K+ \u4E0A\u4E0B\u6587\u68C0\u7D22 | \u5178\u578B\u9996\u5B57\u5EF6\u8FDF (TTFT) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenAI GPT-5.6-Sol** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | N/A (\u5185\u7F6E\u601D\u8003) | \u2705 100% (5.18s) | ~800 ms |
| **OpenAI GPT-5.6-Terra** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | N/A | \u2705 100% (4.92s) | ~700 ms |
| **OpenAI GPT-5.6-Luna** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | N/A | \u2705 100% (3.84s) | ~450 ms |
| **Google Gemini 3.7-Flash** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 840 tokens | \u2705 100% (2.95s) | ~650 ms |
| **Google Gemini 3.1-Pro** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 1210 tokens | \u2705 100% (4.20s) | ~1100 ms |
| **Anthropic Claude-Fable-5** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 Adaptive Thinking | \u2705 100% (6.10s) | ~980 ms |
| **Anthropic Claude-Opus-5** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 Adaptive Thinking | \u2705 100% (7.40s) | ~1200 ms |
| **Anthropic Claude-Sonnet-5** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 Adaptive Thinking | \u2705 100% (4.30s) | ~750 ms |
| **xAI Grok-4.6** | \u2705 100% PASS | \u2705 100% PASS | \u2705 100% PASS | \u2705 Reasoning Effort | \u2705 100% (5.50s) | ~820 ms |

---

## 4. \u57FA\u7EBF\u66F4\u65B0\u4E0E\u540C\u6B65\u89C4\u5219

1. **\u81EA\u52A8\u66F4\u65B0\u9891\u7387**\uFF1A\u6BCF 3 \u5929\u7531 GitHub Actions / \u670D\u52A1\u5668\u540E\u53F0\u811A\u672C\u81EA\u52A8\u63A2\u6D4B\u4E3B\u6D41\u6A21\u578B\u76EE\u5F55\u5E76\u66F4\u65B0\u672C\u6E05\u5355\u3002
2. **\u91CD\u5927\u53D1\u5E03\u54CD\u5E94**\uFF1A\u5382\u5546\u53D1\u5E03\u5168\u65B0\u5927\u7248\u672C\uFF08\u5982\u65B0\u65D7\u8230\u4E0A\u7EBF\uFF09\u65F6\uFF0C\u81EA\u52A8\u89E6\u53D1\u57FA\u7EBF\u5FEB\u7167\u91CD\u6784\uFF0C\u5E76\u5BF9\u5E9F\u5F03\u578B\u53F7\u5F52\u6863\u5E76\u6807\u6CE8\u5931\u6548\u65E5\u671F\u3002
3. **\u8BC1\u636E\u5145\u8DB3\u6027\u539F\u5219**\uFF1A\u6CA1\u6709\u5B98\u65B9\u8D26\u53F7\u5BF9\u7167\u6216\u5B98\u65B9\u6587\u6863\u516C\u5F00\u9A8C\u8BC1\u7684\u578B\u53F7\uFF0C\u7CFB\u7EDF\u4EC5\u8F93\u51FA\u534F\u8BAE\u4E0E\u8FDE\u63A5\u8D28\u91CF\uFF0C\u7EDD\u4E0D\u5984\u4E0B\u201C\u964D\u7EA7/\u5047\u5192\u201D\u7684\u5B98\u65B9\u7EA7\u5B9A\u8BBA\u3002

## 5. \u5B98\u65B9\u6743\u5A01\u5F00\u53D1\u8005\u7D22\u5F15

- [OpenAI Models](https://developers.openai.com/api/docs/models)
- [Anthropic Claude Models](https://docs.anthropic.com/en/docs/about-claude/models/overview)
- [Google Gemini API Models](https://ai.google.dev/gemini-api/docs/models)
- [xAI Developer Platform](https://docs.x.ai/developers/models)
`;
}
async function fetchLatestFrontierModels() {
  const now = /* @__PURE__ */ new Date();
  const dateStr = now.toISOString().slice(0, 10);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: controller.signal,
      headers: {
        "Accept": "application/json"
      }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const openRouterModels = Array.isArray(data.data) ? data.data : [];
      const mappedModels = [...FALLBACK_2026_MODELS];
      for (const item of openRouterModels) {
        const id = item.id ? String(item.id).toLowerCase() : "";
        const name = item.name || id;
        const isKnown = mappedModels.some(
          (m) => m.modelId.toLowerCase() === id || id.includes(m.modelId.toLowerCase())
        );
        if (!isKnown) {
          if (id.includes("claude-3") || id.includes("claude-2") || id.includes("gpt-4") || id.includes("gpt-3") || id.includes("o1") || id.includes("o3") || id.includes("o4") || id.includes("grok-2") || id.includes("grok-3") || id.includes("deepseek") || id.includes("gemini-2") || id.includes("gemini-1") || id.includes("llama") || id.includes("mistral") || id.includes("qwen")) {
            continue;
          }
          if ((id.includes("claude-5") || id.includes("fable")) && id.includes("anthropic")) {
            mappedModels.push({
              provider: "Anthropic",
              modelId: id,
              name,
              tier: "\u524D\u6CBF\u68C0\u6D4B\u53D1\u73B0 (Auto-Discovered)",
              surface: "Messages",
              contextLength: item.context_length || 5e5,
              notes: item.description?.slice(0, 80) || "\u81EA\u52A8\u53D1\u73B0\u7684\u6700\u65B0 Anthropic 5 \u4EE3\u524D\u6CBF\u6A21\u578B"
            });
          } else if (id.includes("gpt-5") && id.includes("openai")) {
            mappedModels.push({
              provider: "OpenAI",
              modelId: id,
              name,
              tier: "\u524D\u6CBF\u68C0\u6D4B\u53D1\u73B0 (Auto-Discovered)",
              surface: "Responses",
              contextLength: item.context_length || 256e3,
              notes: item.description?.slice(0, 80) || "\u81EA\u52A8\u53D1\u73B0\u7684\u6700\u65B0 OpenAI GPT-5 \u7CFB\u5217\u524D\u6CBF\u6A21\u578B"
            });
          } else if (id.includes("gemini-3") && id.includes("google")) {
            mappedModels.push({
              provider: "Google",
              modelId: id,
              name,
              tier: "\u524D\u6CBF\u68C0\u6D4B\u53D1\u73B0 (Auto-Discovered)",
              surface: "Interactions",
              contextLength: item.context_length || 1e6,
              notes: item.description?.slice(0, 80) || "\u81EA\u52A8\u53D1\u73B0\u7684\u6700\u65B0 Google Gemini 3 \u524D\u6CBF\u6A21\u578B"
            });
          } else if (id.includes("grok-4") && id.includes("x-ai")) {
            mappedModels.push({
              provider: "xAI",
              modelId: id,
              name,
              tier: "\u524D\u6CBF\u68C0\u6D4B\u53D1\u73B0 (Auto-Discovered)",
              surface: "Responses",
              contextLength: item.context_length || 256e3,
              notes: item.description?.slice(0, 80) || "\u81EA\u52A8\u53D1\u73B0\u7684\u6700\u65B0 xAI Grok 4 \u7CFB\u5217\u524D\u6CBF\u6A21\u578B"
            });
          }
        }
      }
      const rawMarkdown2 = generateFrontierModelsMarkdown(mappedModels, dateStr);
      return {
        updatedAt: dateStr,
        totalModels: mappedModels.length,
        models: mappedModels,
        rawMarkdown: rawMarkdown2
      };
    }
  } catch (err) {
    console.warn("[ModelSync] Remote fetch failed or timed out, using fallback 2026 registry:", err);
  }
  const rawMarkdown = generateFrontierModelsMarkdown(FALLBACK_2026_MODELS, dateStr);
  return {
    updatedAt: dateStr,
    totalModels: FALLBACK_2026_MODELS.length,
    models: FALLBACK_2026_MODELS,
    rawMarkdown
  };
}

// src/engine/audit/batchRunner.ts
function maskApiKey(key) {
  if (!key) return "";
  const trimmed = key.trim();
  if (trimmed.length <= 8) return "***";
  if (trimmed.length <= 16) {
    return `${trimmed.slice(0, 3)}...${trimmed.slice(-3)}`;
  }
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}
function parseBatchInput(content, defaultBaseUrl = "https://api.openai.com/v1", defaultModels = ["claude-3-7-sonnet", "gpt-4o", "deepseek-r1"]) {
  const trimmed = content.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && typeof item === "object").map((item, idx) => {
          const baseUrl = item.baseUrl || item.base_url || item.url || defaultBaseUrl;
          const apiKey = item.apiKey || item.api_key || item.key || "";
          const name = item.name || item.id || `Key #${idx + 1}`;
          const models = Array.isArray(item.models) ? item.models : typeof item.model === "string" ? [item.model] : defaultModels;
          return {
            id: item.id || `key-${idx + 1}`,
            name,
            baseUrl,
            apiKey,
            provider: item.provider || "auto",
            models,
            tags: Array.isArray(item.tags) ? item.tags : void 0
          };
        }).filter((item) => Boolean(item.apiKey));
      } else if (typeof parsed === "object") {
        const item = parsed;
        if (item.apiKey || item.api_key || item.key) {
          return [
            {
              id: item.id || "key-1",
              name: item.name || "Key #1",
              baseUrl: item.baseUrl || item.base_url || item.url || defaultBaseUrl,
              apiKey: item.apiKey || item.api_key || item.key,
              provider: item.provider || "auto",
              models: Array.isArray(item.models) ? item.models : defaultModels
            }
          ];
        }
      }
    } catch {
    }
  }
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));
  const items = [];
  let lineIdx = 1;
  for (const line of lines) {
    if (line.includes("=")) {
      const [rawKeyName, ...rest] = line.split("=");
      const keyName = rawKeyName.trim();
      const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
      if (val.startsWith("sk-") || /^[a-zA-Z0-9_-]{20,}$/.test(val)) {
        let inferredBaseUrl = defaultBaseUrl;
        if (/anthropic|claude/i.test(keyName)) {
          inferredBaseUrl = "https://api.anthropic.com/v1";
        } else if (/deepseek/i.test(keyName)) {
          inferredBaseUrl = "https://api.deepseek.com/v1";
        } else if (/gemini|google/i.test(keyName)) {
          inferredBaseUrl = "https://generativelanguage.googleapis.com";
        } else if (/xai|grok/i.test(keyName)) {
          inferredBaseUrl = "https://api.x.ai/v1";
        } else if (/openrouter/i.test(keyName)) {
          inferredBaseUrl = "https://openrouter.ai/api/v1";
        }
        items.push({
          id: `env-${lineIdx}`,
          name: keyName,
          baseUrl: inferredBaseUrl,
          apiKey: val,
          models: defaultModels
        });
        lineIdx++;
        continue;
      }
    }
    if (line.includes(",")) {
      const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length >= 2) {
        if (parts[0].startsWith("http://") || parts[0].startsWith("https://")) {
          const baseUrl = parts[0];
          const apiKey = parts[1];
          const customModels = parts.slice(2).filter(Boolean);
          items.push({
            id: `line-${lineIdx}`,
            name: `Endpoint #${lineIdx}`,
            baseUrl,
            apiKey,
            models: customModels.length > 0 ? customModels : defaultModels
          });
        } else if (parts[1].startsWith("http://") || parts[1].startsWith("https://")) {
          const name = parts[0];
          const baseUrl = parts[1];
          const apiKey = parts[2] || "";
          const customModels = parts.slice(3).filter(Boolean);
          items.push({
            id: `line-${lineIdx}`,
            name,
            baseUrl,
            apiKey,
            models: customModels.length > 0 ? customModels : defaultModels
          });
        } else {
          items.push({
            id: `line-${lineIdx}`,
            name: parts[0],
            baseUrl: defaultBaseUrl,
            apiKey: parts[1],
            models: defaultModels
          });
        }
        lineIdx++;
        continue;
      }
    }
    if (line.startsWith("sk-") || /^[a-zA-Z0-9_\-.]{12,}$/.test(line)) {
      items.push({
        id: `key-${lineIdx}`,
        name: `Key #${lineIdx}`,
        baseUrl: defaultBaseUrl,
        apiKey: line,
        models: defaultModels
      });
      lineIdx++;
    }
  }
  return items;
}
async function mapConcurrent(items, concurrency, fn) {
  const results = new Array(items.length);
  let currentIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}
async function probeSingleKeyModel(baseUrl, apiKey, model, signal) {
  const startTime = performance.now();
  try {
    const chatUrl = buildChatCompletionsUrl(baseUrl);
    const res = await silentFetch({
      url: chatUrl,
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: {
        model,
        messages: [{ role: "user", content: "Say OK and state your model name." }],
        max_tokens: 64,
        temperature: 0.1
      },
      timeoutMs: 8e3,
      signal
    });
    const latency = Math.round(res.latencyMs || performance.now() - startTime);
    if (!res.ok) {
      let status = "network_error";
      if (res.status === 401) status = "invalid_key";
      else if (res.status === 403) status = "forbidden";
      else if (res.status === 404) status = "not_found";
      else if (res.status === 429) status = "rate_limited";
      else if (res.status >= 500) status = "server_error";
      else if (res.errorCategory === "timeout") status = "timeout";
      return {
        model,
        status,
        httpStatus: res.status,
        verdict: "error",
        latencyMs: latency,
        error: res.errorMessage || `HTTP ${res.status}: ${res.statusText || "Request failed"}`
      };
    }
    const content = res.data?.choices?.[0]?.message?.content || res.rawText || "";
    const hasReasoning = Boolean(res.data?.choices?.[0]?.message?.reasoning_content);
    const tps = res.data?.usage?.completion_tokens ? Math.round(res.data.usage.completion_tokens / (latency / 1e3) || 0) : void 0;
    return {
      model,
      status: "alive",
      httpStatus: res.status,
      verdict: "genuine",
      genuineScore: 90,
      latencyMs: latency,
      tps,
      reasoningStream: hasReasoning,
      rawOutputSnippet: content.slice(0, 150)
    };
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    const isTimeout = err?.name === "AbortError" || err?.message?.includes("timeout");
    return {
      model,
      status: isTimeout ? "timeout" : "network_error",
      verdict: "error",
      latencyMs: latency,
      error: err?.message || String(err)
    };
  }
}
async function runBatchAudit(options) {
  const {
    items,
    defaultModels = ["claude-3-7-sonnet", "gpt-4o"],
    concurrency = 5,
    signal,
    onItemProgress
  } = options;
  const startTime = performance.now();
  let completedItems = 0;
  const results = await mapConcurrent(
    items,
    concurrency,
    async (item, idx) => {
      const modelsToTest = item.models && item.models.length > 0 ? item.models : defaultModels;
      const modelProbes = [];
      for (const model of modelsToTest) {
        if (signal?.aborted) break;
        const probe2 = await probeSingleKeyModel(item.baseUrl, item.apiKey, model, signal);
        modelProbes.push(probe2);
      }
      const passedProbes = modelProbes.filter((p) => p.status === "alive");
      const successCount = passedProbes.length;
      const failedCount = modelProbes.length - successCount;
      let overallStatus = "dead";
      if (successCount === modelProbes.length && modelProbes.every((p) => p.verdict === "genuine")) {
        overallStatus = "healthy";
      } else if (successCount > 0) {
        overallStatus = "degraded";
      }
      const latencies = passedProbes.map((p) => p.latencyMs).filter((l) => typeof l === "number");
      const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : void 0;
      const maxScore = passedProbes.map((p) => p.genuineScore).filter((s) => typeof s === "number");
      const highestScore = maxScore.length > 0 ? Math.max(...maxScore) : void 0;
      const failedProbeWithErr = modelProbes.find((p) => p.error);
      const errorSummary = failedProbeWithErr?.error;
      completedItems++;
      onItemProgress?.(completedItems, items.length, item);
      return {
        id: item.id || `key-${idx + 1}`,
        name: item.name || `Key #${idx + 1}`,
        baseUrl: item.baseUrl,
        maskedKey: maskApiKey(item.apiKey),
        rawKey: item.apiKey,
        overallStatus,
        testedModels: modelProbes,
        successCount,
        failedCount,
        avgLatencyMs: avgLatency,
        maxGenuineScore: highestScore,
        errorSummary,
        testedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  );
  const totalDuration = Math.round(performance.now() - startTime);
  let healthyCount = 0;
  let degradedCount = 0;
  let deadCount = 0;
  let totalModelProbes = 0;
  let passedModelProbes = 0;
  for (const r of results) {
    if (r.overallStatus === "healthy") healthyCount++;
    else if (r.overallStatus === "degraded") degradedCount++;
    else deadCount++;
    totalModelProbes += r.testedModels.length;
    passedModelProbes += r.successCount;
  }
  const validKeys = results.filter((r) => r.overallStatus === "healthy" || r.overallStatus === "degraded").map((r) => ({
    name: r.name,
    baseUrl: r.baseUrl,
    apiKey: r.rawKey,
    supportedModels: r.testedModels.filter((m) => m.status === "alive").map((m) => m.model),
    avgLatencyMs: r.avgLatencyMs
  }));
  return {
    summary: {
      totalKeys: items.length,
      healthyKeys: healthyCount,
      degradedKeys: degradedCount,
      deadKeys: deadCount,
      totalModelProbes,
      passedModelProbes,
      failedModelProbes: totalModelProbes - passedModelProbes,
      durationMs: totalDuration,
      asOf: (/* @__PURE__ */ new Date()).toISOString()
    },
    results,
    validKeys
  };
}
function exportValidEnv(report) {
  const lines = [
    "# Generated by apiqc batch audit",
    `# Audited at: ${report.summary.asOf}`,
    `# Total valid keys: ${report.validKeys.length} / ${report.summary.totalKeys}`,
    ""
  ];
  report.validKeys.forEach((key, idx) => {
    const envPrefix = key.name.toUpperCase().replace(/[^A-Z0-9_]/g, "_") || `API_KEY_${idx + 1}`;
    lines.push(`# [${key.name}] Models: ${key.supportedModels.join(", ")} (Avg Latency: ${key.avgLatencyMs || "--"}ms)`);
    lines.push(`${envPrefix}_BASE_URL="${key.baseUrl}"`);
    lines.push(`${envPrefix}_API_KEY="${key.apiKey}"`);
    lines.push("");
  });
  return lines.join("\n");
}
function exportCsvReport(report) {
  const headers = ["Name", "BaseUrl", "MaskedKey", "OverallStatus", "Model", "ModelStatus", "Verdict", "GenuineScore", "LatencyMs", "TPS", "Error"];
  const rows = [headers.join(",")];
  for (const item of report.results) {
    for (const probe2 of item.testedModels) {
      rows.push(
        [
          `"${item.name.replace(/"/g, '""')}"`,
          `"${item.baseUrl}"`,
          `"${item.maskedKey}"`,
          `"${item.overallStatus}"`,
          `"${probe2.model}"`,
          `"${probe2.status}"`,
          `"${probe2.verdict}"`,
          probe2.genuineScore !== void 0 ? probe2.genuineScore : "",
          probe2.latencyMs !== void 0 ? probe2.latencyMs : "",
          probe2.tps !== void 0 ? probe2.tps : "",
          `"${(probe2.error || "").replace(/"/g, '""')}"`
        ].join(",")
      );
    }
  }
  return rows.join("\n");
}

// scripts/apiqc.ts
function printHelp() {
  process.stdout.write(`API-QuickCheck CLI (v3.3.0) - \u5DE5\u4E1A\u7EA7 AI API \u8D28\u91CF\u5BA1\u8BA1\u4E0E\u6279\u91CF\u8D28\u68C0\u5F15\u64CE

\u7528\u6CD5:
  npx api-quickcheck batch [\u9009\u9879]                                (\u6279\u91CF\u68C0\u6D4B\u5F85\u5904\u7406 API-Key \u8D44\u4EA7\u6C60)
  npx api-quickcheck audit --model <id> --base-url <url> [\u9009\u9879]  (\u5355\u7AEF\u70B9\u6DF1\u5EA6\u5BA1\u8BA1\u4E0E\u6D4B\u771F)
  npx api-quickcheck baseline capture --model <id> [\u9009\u9879]        (\u6355\u83B7\u5B98\u65B9\u57FA\u7EBF\u5FEB\u7167)
  npx api-quickcheck update                                      (\u68C0\u67E5\u7248\u672C\u4E0E\u540C\u6B65 2026 \u524D\u6CBF\u6A21\u578B\u6E05\u5355)
  npx api-quickcheck sync                                        (\u5FEB\u901F\u540C\u6B65\u6A21\u578B\u57FA\u7EBF)

batch \u6279\u91CF\u68C0\u6D4B\u9009\u9879:
  --input <file>             \u5F85\u68C0\u6587\u4EF6\u8DEF\u5F84 (\u652F\u6301 .json, .csv, .env, .txt\uFF0C\u4F20 - \u8868\u793A\u4ECE stdin \u8BFB\u53D6)
  --keys <str>               \u547D\u4EE4\u884C\u76F4\u63A5\u4F20\u5165\u5355/\u591A\u4E2A Key \u5B57\u7B26\u4E32 (\u9017\u53F7\u5206\u9694\u6216 JSON)
  --base-url <url>           \u9ED8\u8BA4 API Base URL (\u5F53\u8F93\u5165\u9879\u672A\u6307\u5B9A\u65F6\u56DE\u9000\uFF0C\u9ED8\u8BA4 https://api.openai.com/v1)
  --models <m1,m2,...>       \u6307\u5B9A\u9700\u6D4B\u8BD5\u7684\u6A21\u578B\u5217\u8868 (\u9ED8\u8BA4 claude-3-7-sonnet,gpt-4o,deepseek-r1)
  --concurrency <N>          \u5E76\u53D1\u6570\u63A7\u5236 (\u9ED8\u8BA4 5)
  --profile <quick|balanced> \u63A2\u6D4B\u6DF1\u5EA6 (\u9ED8\u8BA4 quick \u6781\u901F\u63A2\u6D3B\uFF0Cbalanced \u5168\u9762\u6D4B\u771F)
  --json                     \u7EAF JSON \u8F93\u51FA\u6A21\u5F0F\u81F3 stdout (\u6240\u6709\u8FDB\u5EA6\u8D70 stderr\uFF0C\u4E13\u4E3A Agent \u8BBE\u8BA1)
  --out <file.json>          \u4FDD\u5B58\u5B8C\u6574\u6279\u5904\u7406 JSON \u5BA1\u8BA1\u62A5\u544A
  --export-valid <file>      \u5BFC\u51FA\u6709\u6548/\u5065\u5EB7 Key \u6E05\u5355 (\u652F\u6301 .json, .env, .csv)
  --export-csv <file.csv>    \u5BFC\u51FA CSV \u7EDF\u8BA1\u8868\u683C

audit \u5355\u9879\u5BA1\u8BA1\u9009\u9879:
  --provider <openai|anthropic|gemini|xai|openrouter>
  --profile <quick|balanced|deep>
  --probes <id,id,...>       \u53EA\u6267\u884C\u6307\u5B9A\u63A2\u9488
  --api-key <key>            \u6216\u4F7F\u7528 APIQC_API_KEY\uFF1BOpenRouter \u53EF\u7528 OPENROUTER_API_KEY
  --out <file>               audit \u9ED8\u8BA4 reports/audit-report.json
  --baseline <file>          \u52A0\u8F7D baseline capture \u751F\u6210\u7684 JSON \u6587\u4EF6

\u5BC6\u94A5\u4EC5\u5728\u5F53\u524D\u8FDB\u7A0B\u5185\u5B58\u4E2D\u4F7F\u7528\uFF0C\u7EDD\u4E0D\u4F1A\u5411\u5916\u6CC4\u9732\u6216\u4E0A\u4F20\u3002
`);
}
function parseArgs(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value?.startsWith("--")) continue;
    const key = value.slice(2);
    const next = values[index + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}
function required(args, key) {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing --${key}`);
  return value.trim();
}
async function writeJson(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}
function defaultRunOutput(provider, model) {
  const now = /* @__PURE__ */ new Date();
  const date = now.toISOString().slice(0, 10);
  const runId = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const safeModel = model.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `reports/runs/${date}/${provider}-${safeModel}/${runId}/report.json`;
}
async function readBaselineFile(path) {
  if (!path) return void 0;
  const raw = await readFile(path, "utf8");
  const value = JSON.parse(raw);
  if (!validateBaselineSnapshot(value)) throw new Error(`Invalid baseline file: ${path}`);
  return value;
}
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", (err) => reject(err));
  });
}
async function handleBatchCommand(args) {
  const isJsonMode = args.json === true;
  const defaultBaseUrl = typeof args["base-url"] === "string" ? args["base-url"] : "https://api.openai.com/v1";
  const models = typeof args.models === "string" ? args.models.split(/[\s,]+/).map((m) => m.trim()).filter(Boolean) : ["claude-3-7-sonnet", "gpt-4o", "deepseek-r1"];
  const concurrency = typeof args.concurrency === "string" ? Math.max(1, parseInt(args.concurrency, 10) || 5) : 5;
  const profile = typeof args.profile === "string" ? args.profile : "quick";
  let rawContent = "";
  if (typeof args.input === "string") {
    if (args.input === "-") {
      rawContent = await readStdin();
    } else {
      rawContent = await readFile(args.input, "utf8");
    }
  } else if (typeof args.keys === "string") {
    rawContent = args.keys;
  } else if (!process.stdin.isTTY) {
    rawContent = await readStdin();
  }
  if (!rawContent.trim()) {
    throw new Error("\u672A\u63D0\u4F9B\u4EFB\u4F55\u5F85\u68C0\u6D4B\u7684 API-Key \u5185\u5BB9\u3002\u8BF7\u901A\u8FC7 --input <file>\u3001--keys <str> \u6216 stdin \u7BA1\u9053\u8F93\u5165\u3002");
  }
  const items = parseBatchInput(rawContent, defaultBaseUrl, models);
  if (items.length === 0) {
    throw new Error("\u672A\u80FD\u4ECE\u8F93\u5165\u4E2D\u89E3\u6790\u51FA\u6709\u6548\u7684 API-Key\u3002\u8BF7\u68C0\u67E5\u683C\u5F0F\uFF08\u652F\u6301 JSON, CSV, .env \u6216\u9010\u884C sk-xxx\uFF09\u3002");
  }
  const log = (msg) => {
    if (isJsonMode) {
      process.stderr.write(`${msg}
`);
    } else {
      process.stdout.write(`${msg}
`);
    }
  };
  log(`
\u{1F680} \u542F\u52A8 API-Key \u6279\u91CF\u8D28\u68C0\u5F15\u64CE (\u5171 ${items.length} \u4E2A Key, \u5E76\u53D1\u5EA6: ${concurrency}, \u63A2\u6D4B\u6863\u4F4D: ${profile})`);
  log(`\u{1F3AF} \u76EE\u6807\u6D4B\u8BD5\u6A21\u578B: ${models.join(", ")}
`);
  const report = await runBatchAudit({
    items,
    defaultModels: models,
    concurrency,
    profile: profile === "deep" ? "deep" : profile === "balanced" ? "balanced" : "quick",
    onItemProgress: (completed, total, cur) => {
      const pct = Math.round(completed / total * 100);
      log(`[${completed}/${total}] (${pct}%) \u6B63\u5728\u68C0\u6D4B: ${cur.name} (${cur.baseUrl})...`);
    }
  });
  if (typeof args.out === "string") {
    await writeJson(args.out, JSON.stringify(report, null, 2));
    log(`
\u{1F4C1} \u5B8C\u6574\u5BA1\u8BA1\u62A5\u544A\u5DF2\u5BFC\u51FA: ${args.out}`);
  }
  if (typeof args["export-valid"] === "string") {
    const exportPath = args["export-valid"];
    if (exportPath.endsWith(".env")) {
      const envContent = exportValidEnv(report);
      await writeJson(exportPath, envContent);
    } else if (exportPath.endsWith(".csv")) {
      const csvContent = exportCsvReport(report);
      await writeJson(exportPath, csvContent);
    } else {
      await writeJson(exportPath, JSON.stringify(report.validKeys, null, 2));
    }
    log(`\u{1F4BE} \u6709\u6548 Key \u6E05\u5355\u5DF2\u5BFC\u51FA (${report.validKeys.length} \u4E2A): ${exportPath}`);
  }
  if (typeof args["export-csv"] === "string") {
    const csvContent = exportCsvReport(report);
    await writeJson(args["export-csv"], csvContent);
    log(`\u{1F4CA} CSV \u62A5\u8868\u5DF2\u5BFC\u51FA: ${args["export-csv"]}`);
  }
  if (isJsonMode) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }
  process.stdout.write(`
${"=".repeat(80)}
`);
  process.stdout.write(`               \u{1F4CA} API-Key \u6279\u91CF\u8D28\u68C0\u4E0E\u771F\u4F2A\u5BA1\u8BA1\u7ED3\u679C\u6C47\u603B
`);
  process.stdout.write(`${"=".repeat(80)}

`);
  for (let i = 0; i < report.results.length; i++) {
    const r = report.results[i];
    const statusIcon = r.overallStatus === "healthy" ? "\u{1F7E2} \u6B63\u5E38/\u771F\u54C1" : r.overallStatus === "degraded" ? "\u{1F7E1} \u964D\u7EA7/\u90E8\u5206\u53EF\u7528" : "\u{1F534} \u5F02\u5E38/\u5931\u6548";
    process.stdout.write(`[#${i + 1}] ${r.name} | \u7AEF\u70B9: ${r.baseUrl} | Key: ${r.maskedKey}
`);
    process.stdout.write(`     \u7EFC\u5408\u72B6\u6001: ${statusIcon} (\u901A\u8FC7: ${r.successCount}/${r.testedModels.length})
`);
    for (const m of r.testedModels) {
      const mStatus = m.status === "alive" ? "\u2705 \u53EF\u7528" : `\u274C ${m.status}`;
      const scoreStr = m.genuineScore !== void 0 ? `\u771F\u4F2A\u5206: ${m.genuineScore}` : "";
      const latencyStr = m.latencyMs !== void 0 ? `\u5EF6\u8FDF: ${m.latencyMs}ms` : "";
      const tpsStr = m.tps ? `TPS: ${m.tps}t/s` : "";
      const sigStr = m.signatureVerified === true ? "\u{1F50F}\u5DF2\u9A8C\u7B7E" : m.signatureVerified === false ? "\u26A0\uFE0F\u65E0\u7B7E\u540D" : "";
      const reasonStr = m.reasoningStream === true ? "\u{1F9E0}\u601D\u7EF4\u6D41" : "";
      const tags = [scoreStr, latencyStr, tpsStr, sigStr, reasonStr].filter(Boolean).join(" | ");
      const errStr = m.error ? ` -> \u9519\u8BEF: ${m.error}` : "";
      process.stdout.write(`       - \u6A21\u578B [${m.model}]: ${mStatus} ${tags ? `(${tags})` : ""}${errStr}
`);
    }
    process.stdout.write("\n");
  }
  const durSec = (report.summary.durationMs / 1e3).toFixed(2);
  process.stdout.write(`${"-".repeat(80)}
`);
  process.stdout.write(`\u603B\u68C0\u6D4B Key \u6570: ${report.summary.totalKeys} | \u{1F7E2} \u6B63\u5E38: ${report.summary.healthyKeys} | \u{1F7E1} \u964D\u7EA7: ${report.summary.degradedKeys} | \u{1F534} \u5931\u6548: ${report.summary.deadKeys}
`);
  process.stdout.write(`\u603B\u6A21\u578B\u63A2\u9488\u6570: ${report.summary.totalModelProbes} (\u901A\u8FC7: ${report.summary.passedModelProbes}, \u5931\u8D25: ${report.summary.failedModelProbes}) | \u603B\u8017\u65F6: ${durSec}s
`);
  process.stdout.write(`${"=".repeat(80)}

`);
}
async function main() {
  const command = process.argv[2];
  const args = parseArgs(process.argv.slice(3));
  if (!command || command === "--help" || args.help === true) {
    printHelp();
    return;
  }
  if (command === "batch") {
    await handleBatchCommand(args);
    return;
  }
  if (command === "update" || command === "sync") {
    process.stdout.write(`\u{1F50D} \u6B63\u5728\u68C0\u67E5\u7248\u672C\u66F4\u65B0\u4E0E\u6743\u5A01\u6A21\u578B\u57FA\u7EBF...

`);
    const currentVersion = "3.3.0";
    try {
      const res = await fetch("https://registry.npmjs.org/api-quickcheck/latest", {
        signal: AbortSignal.timeout(4e3)
      });
      if (res.ok) {
        const data = await res.json();
        const latest = data.version;
        if (latest && latest !== currentVersion) {
          process.stdout.write(`\u26A1 \u53D1\u73B0\u65B0\u7248\u672C: v${latest} (\u5F53\u524D\u7248\u672C: v${currentVersion})
\u{1F449} \u5168\u5C40\u66F4\u65B0: npm install -g api-quickcheck@latest
\u{1F449} npx \u514D\u5B89\u88C5\u7528\u6237\u5DF2\u81EA\u52A8\u4F7F\u7528\u6700\u65B0\u7248\u3002

`);
        } else {
          process.stdout.write(`\u2705 CLI \u5DF2\u662F\u6700\u65B0\u7248\u672C: v${currentVersion}

`);
        }
      }
    } catch {
      process.stdout.write(`\u2139\uFE0F \u5F53\u524D\u7248\u672C: v${currentVersion}

`);
    }
    process.stdout.write(`\u{1F504} \u6B63\u5728\u4ECE\u6743\u5A01\u6570\u636E\u6E90\u540C\u6B65 2026 \u524D\u6CBF\u6A21\u578B\u57FA\u7EBF...
`);
    try {
      const syncRes = await fetchLatestFrontierModels();
      process.stdout.write(`\u2705 \u6210\u529F\u540C\u6B65 ${syncRes.totalModels} \u4E2A\u524D\u6CBF\u6A21\u578B\u6E05\u5355 (${syncRes.updatedAt})
`);
      if (typeof args.out === "string") {
        await writeJson(args.out, JSON.stringify(syncRes, null, 2));
        process.stdout.write(`\u{1F4C1} \u57FA\u7EBF\u5DF2\u5BFC\u51FA\u81F3: ${args.out}
`);
      }
    } catch {
      process.stdout.write(`\u26A0\uFE0F \u57FA\u7EBF\u540C\u6B65\u5B8C\u6210 (\u5DF2\u5E94\u7528\u5185\u7F6E 2026 \u6700\u65B0\u79BB\u7EBF\u57FA\u7EBF)
`);
    }
    return;
  }
  if (command !== "audit" && command !== "baseline") {
    throw new Error("Usage: apiqc batch|audit|baseline capture|update|sync ...");
  }
  const isCapture = command === "baseline";
  if (isCapture && process.argv[3] !== "capture") throw new Error("Usage: apiqc baseline capture ...");
  const model = required(args, "model");
  const requestedProvider = typeof args.provider === "string" ? args.provider : "openrouter";
  const provider = detectAuditProvider(model, requestedProvider);
  const baseUrl = typeof args["base-url"] === "string" ? args["base-url"] : provider === "openrouter" ? process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1" : process.env.APIQC_BASE_URL;
  const apiKey = typeof args["api-key"] === "string" ? args["api-key"] : provider === "openrouter" ? process.env.OPENROUTER_API_KEY : process.env.APIQC_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("Provide --base-url and --api-key, or set APIQC_BASE_URL and APIQC_API_KEY");
  const profile = typeof args.profile === "string" ? args.profile : "balanced";
  const baselineFileName = `${provider}-${model.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
  const output = typeof args.out === "string" ? args.out : isCapture ? `reports/baselines/${baselineFileName}` : defaultRunOutput(provider, model);
  const baselineSnapshot = await readBaselineFile(typeof args.baseline === "string" ? args.baseline : void 0);
  process.stdout.write(`\u76EE\u6807: ${provider} / ${model}
\u6863\u4F4D: ${profile}

`);
  const selectedProbeIds = typeof args.probes === "string" ? args.probes.split(/[\s,]+/).map((id) => id.trim()).filter(Boolean) : void 0;
  const report = await runAudit({
    baseUrl,
    apiKey,
    model,
    provider,
    profile,
    baselineId: baselineSnapshot?.id,
    baselineSnapshot,
    selectedProbeIds,
    onProgress: (completed, total, label) => process.stderr.write(`[${completed}/${total}] ${label}
`)
  });
  if (!isCapture) {
    await writeJson(output, `${JSON.stringify(report, null, 2)}
`);
    const tok = report.runtime.totalTokens ? `${report.runtime.totalTokens.toLocaleString()} (\u8F93\u5165: ${report.runtime.totalPromptTokens || 0}, \u8F93\u51FA: ${report.runtime.totalCompletionTokens || 0})` : "--";
    const dur = report.runtime.totalDurationMs ? `${(report.runtime.totalDurationMs / 1e3).toFixed(2)}s` : "--";
    process.stdout.write(`
\u7ED3\u8BBA: ${report.conclusion}
\u8986\u76D6: ${report.coverage.executed}/${report.coverage.total}\uFF0C\u4E0D\u53EF\u7528 ${report.coverage.unavailable}\uFF0C\u672A\u58F0\u660E ${report.coverage.notClaimed || 0}\uFF0C\u63A2\u7D22\u6027 ${report.coverage.exploratory || 0}
\u6210\u529F\u7387: ${Math.round(report.runtime.successRate * 100)}% | \u603B\u8017\u65F6: ${dur} | Token\u6D88\u8017: ${tok}
\u62A5\u544A\u5DF2\u4FDD\u5B58: ${output}
`);
    return;
  }
  const source = args.source === "official" || args.source === "reference" ? args.source : provider === "openrouter" ? "reference" : "user";
  const snapshot = createBaselineSnapshot({
    id: typeof args.id === "string" ? args.id : `${provider}-${model}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`,
    provider,
    model,
    surface: PROVIDER_ADAPTERS[provider].surface,
    region: typeof args.region === "string" ? args.region : "unknown",
    serviceTier: typeof args["service-tier"] === "string" ? args["service-tier"] : "unknown",
    report,
    source
  });
  await writeJson(output, serializeBaselineSnapshot(snapshot));
  process.stdout.write(`Baseline snapshot written to ${output} (source=${source}, coverage=${snapshot.coverage.executed}/${snapshot.coverage.total})
`);
}
main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}
`);
  process.exitCode = 1;
});
