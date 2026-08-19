import { AuditConclusion, AuditReportV4 } from '../../types/audit';

export interface AuditReportAssessment {
  conclusion: AuditConclusion;
  title: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  explanation: string;
  evidence: string;
  nextStep: string;
  passCount: number;
  failCount: number;
  unavailableCount: number;
  judgedCount: number;
  complianceRate: number;
}

export function assessAuditReport(report: AuditReportV4): AuditReportAssessment {
  const totalCount = report.protocol.length;
  const passCount = report.protocol.filter((item) => item.status === 'pass').length;
  const failCount = report.protocol.filter((item) => item.status === 'fail').length;
  const unavailableCount = report.protocol.filter((item) => item.status === 'unavailable').length;
  const judgedCount = passCount + failCount;
  const complianceRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
  const hasClaudeSignature = report.target.provider === 'anthropic'
    && report.protocol.some((item) => item.id === 'p1-signature-continuity' && item.status === 'pass');

  if (report.conclusion === 'suspect_downgraded') {
    return {
      conclusion: report.conclusion,
      title: '发现协议或能力退化信号',
      tone: 'danger',
      explanation: '经自动化探针交叉审计，当前中转端点在多个独立能力域（如思考链封装、工具调用协议、结构化 JSON 输出或流式事件流）中检测到不可逆的格式漂移与断言失败。该结果表明中转服务链路可能存在模型混用、低配降级转发或使用了不合规的协议代理转换中间件，可能导致下游 Agent 应用或流式输出异常。',
      evidence: '已判定 ' + judgedCount + ' 项用例：通过 ' + passCount + ' 项，未通过 ' + failCount + ' 项；未响应或跳过 ' + unavailableCount + ' 项。',
      nextStep: '请点击下方「具体执行检测」展开查看标红探针的原始返回证据与报错原因，建议切换至其他中转信道或联系服务商反馈。',
      passCount, failCount, unavailableCount, judgedCount, complianceRate,
    };
  }

  // 100% All Probes Passed
  if (failCount === 0 && passCount === totalCount && totalCount > 0) {
    return {
      conclusion: 'consistent',
      title: hasClaudeSignature ? 'Claude Signature 连续性通过' : '基线协议检测全部通过',
      tone: 'success',
      explanation: hasClaudeSignature
        ? 'Anthropic Messages 的 thinking 块与 signature 签名已成功捕获并完成多轮会话连续性回传。当前中转端点完整保留了官方原生协议封装与推理凭据，未出现中转层截断或改包，通信保真度达到 100%。'
        : '当前中转端点对目标模型发起的所有原生路由与协议探针（共 ' + totalCount + ' 项）均已 100% 满分通过检验。返回的响应 Envelope 封装、Token Usage 统计结构、流式事件状态流以及固定夹具数据均严格符合官方协议规范基线，无中转层注入改包或格式降级迹象。',
      evidence: '共审计 ' + totalCount + ' 项协议探针全部通过（P50 中位延迟 ' + (report.runtime?.p50LatencyMs ? report.runtime.p50LatencyMs + ' ms' : '--') + '，通过率 100%）。',
      nextStep: '当前接口在协议层面表现优异，可放心接入业务生产系统；如需验证极限表现，可进一步测试超长上下文或高并发场景。',
      passCount, failCount, unavailableCount, judgedCount, complianceRate,
    };
  }

  // Partial Pass (Some probes passed, but others were unavailable/skipped)
  if (failCount === 0 && passCount > 0 && passCount < totalCount) {
    return {
      conclusion: 'inconclusive',
      title: '部分协议探针通过 (' + passCount + '/' + totalCount + ' 项)',
      tone: 'warning',
      explanation: '当前端点成功通过了 ' + passCount + ' 项基础路由/协议探针，但其余 ' + unavailableCount + ' 项高级探针（如深度思考解析、结构化输出或状态流）因服务端未开放、超时或未声明而未能完成测试。这表明接口具备基础通讯能力，但高级协议完整度仍待完善。',
      evidence: '计划测试 ' + totalCount + ' 项：通过 ' + passCount + ' 项，' + unavailableCount + ' 项未响应或跳过（通过率 ' + complianceRate + '%）。',
      nextStep: '请展开下方「具体执行检测」核实未通过探针的具体原因，并在使用高级特性（如工具调用与流式解析）前进行充分测试。',
      passCount, failCount, unavailableCount, judgedCount, complianceRate,
    };
  }

  if (failCount > 0) {
    return {
      conclusion: 'inconclusive',
      title: '发现协议或能力异常',
      tone: 'warning',
      explanation: '当前端点在大部分常规对话请求中表现正常，但在特定高级协议或边界探针（如深度思考解析、严格模式 JSON 校验等）中未能通过一致性断言。这通常由中转站前置网关字段过滤、中间件代理转换不完善或模型上游短时异常所导致。',
      evidence: '已判定 ' + judgedCount + ' 项用例：通过 ' + passCount + ' 项，异常 ' + failCount + ' 项；未响应 ' + unavailableCount + ' 项。',
      nextStep: '建议展开下方「具体执行检测」核实失败探针是否影响您的核心业务，或重新执行单次复测以排除网络偶发抖动。',
      passCount, failCount, unavailableCount, judgedCount, complianceRate,
    };
  }

  return {
    conclusion: 'inconclusive',
    title: '探针无法连通或端点不可用',
    tone: 'neutral',
    explanation: '当前端点未能在限定时间内建立连接或未返回有效数据，可能是由于中转站网络拥塞或该端点未配置所测模型路由。',
    evidence: '共执行 ' + unavailableCount + ' 项探针，全部无可用响应。',
    nextStep: '请检查网络连接、Base URL 接口地址与 API Key 是否有效，或联系中转服务商核实。',
    passCount, failCount, unavailableCount, judgedCount, complianceRate,
  };
}

export function buildAuditSummary(report: AuditReportV4): string {
  const assessment = assessAuditReport(report);
  return `${assessment.title}。${assessment.explanation} ${assessment.evidence} 下一步：${assessment.nextStep}`;
}
