import type { AiAnalysisResult, AiAnalysisJobData } from '@mindlapse/shared'

export class MockAiService {
  async analyzeSupplierRisk(_data: AiAnalysisJobData): Promise<AiAnalysisResult> {
    // Simulate API latency (2-3 seconds)
    await this.delay(2000 + Math.random() * 1000)

    return {
      riskScore: 58,
      analysis:
        "Based on the analysis of this third-party supplier, several cybersecurity risks have been identified. As a SaaS provider, the organization handles sensitive customer data which creates potential exposure to data breaches, API vulnerabilities, and compliance violations. The infrastructure relies on cloud services which introduces shared responsibility model considerations. Key concerns include inadequate access controls, insufficient encryption standards, and limited visibility into the vendor's security incident response capabilities. The supplier demonstrates moderate security maturity with some certifications in place, but lacks comprehensive security monitoring and proactive threat detection capabilities. Regular security assessments and continuous monitoring are recommended to maintain acceptable risk levels.",
      keyRisks: [
        'Data breach through API vulnerabilities or misconfigurations',
        'Insufficient access controls and authentication mechanisms',
        'Lack of encryption for data at rest and in transit',
        'Limited incident response and disaster recovery capabilities',
        'Third-party dependencies introducing supply chain risks',
      ],
      recommendations: [
        'Require SOC2 Type II or ISO 27001 certification within 6 months',
        'Implement multi-factor authentication (MFA) for all user accounts',
        'Conduct quarterly security audits and penetration testing',
        'Establish SLA with defined security incident notification timelines',
        'Review and verify encryption standards for data storage and transmission',
      ],
      confidence: 75,
      generatedAt: new Date().toISOString(),
      model: 'mock-v1',
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
