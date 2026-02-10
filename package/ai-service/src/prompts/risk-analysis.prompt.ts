import validator from 'validator'
import type { SupplierCategory, SupplierStatus } from '@mindlapse/shared'

export interface PromptVariables {
  name: string
  domain: string
  category: SupplierCategory
  status: SupplierStatus
  contractEndDate: string | null
  notes: string | null
}

export function sanitizeDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') {
    return 'unknown'
  }

  let clean = domain.replace(/^https?:\/\//i, '')

  clean = clean.split('/')[0]
  clean = clean.split('?')[0]
  clean = clean.split('#')[0]

  if (validator.isFQDN(clean)) {
    return clean
  }

  return sanitizeInput(domain).slice(0, 100)
}

export function buildRiskAnalysisPrompt(variables: PromptVariables): string {
  const { name, domain, category, status, contractEndDate, notes } = variables

  // Sanitize all user inputs
  const safeName = sanitizeInput(name)
  const safeDomain = sanitizeDomain(domain)
  const safeNotes = notes ? sanitizeInput(notes) : 'None'
  const safeContractDate = contractEndDate || 'Not specified'

  return `You are a cybersecurity risk analyst specializing in third-party vendor assessment. Your task is to evaluate the cyber risk level of a supplier based on the following information:

**Supplier Information:**
- Name: ${safeName}
- Domain: ${safeDomain}
- Category: ${category}
- Current Status: ${status}
- Contract End Date: ${safeContractDate}
- Additional Notes: ${safeNotes}

**Analysis Requirements:**

1. **Risk Score (0-100):**
   - 0-25: LOW - Minimal cyber risk
   - 26-50: MEDIUM - Moderate risk, some concerns
   - 51-75: HIGH - Significant risk, requires attention
   - 76-100: CRITICAL - Severe risk, immediate action needed

2. **Risk Analysis (narrative):**
   Provide a concise analysis (150-300 words) covering:
   - Industry-specific cyber risks for this category
   - Potential attack vectors and vulnerabilities
   - Supply chain risk implications
   - Recommended security controls and mitigations

3. **Key Risks (array):**
   Identify 3-5 specific risks, each as a short phrase (e.g., "Data breach via API vulnerability")

4. **Recommendations (array):**
   Provide 3-5 actionable recommendations (e.g., "Require SOC2 Type II certification")

5. **Confidence Level:**
   - 0 to 100% confidence in the analysis based on available information
   - 0 -> low confidence, 100 -> high confidence

**Output Format (JSON only, no markdown):**
{
  "riskScore": <number 0-100>,
  "analysis": "<narrative analysis>",
  "keyRisks": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "confidence": "<number 0-100>"
}

**Important:**
- Return ONLY valid JSON, no markdown code blocks
- Be objective and data-driven
- Avoid speculation without factual basis
- If information is insufficient, indicate LOW confidence
- Focus on actionable insights
- Consider the supplier category when assessing risks (SaaS vs Infrastructure vs Consulting)

Provide your analysis now:`
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  let sanitized = input

  sanitized = validator.stripLow(sanitized, true)
  sanitized = validator.escape(sanitized)
  sanitized = sanitized.replace(/```[\s\S]*?```/g, '')
  sanitized = sanitized.replace(/`{1,3}[^`]+`{1,3}/g, '')
  sanitized = sanitized.replace(/[{}[\]]/g, '')

  const injectionPatterns = [
    /(ignore|disregard|forget|override|replace|substitute|cancel|stop)\s+(previous|all|above|prior|earlier|system|instruction)/gi,
    /(repeat|show|display|print|reveal|output)\s+(the\s+)?(instructions|prompt|system|rules)/gi,
    /(you\s+are\s+now|from\s+now\s+on|new\s+instructions?|act\s+as|pretend\s+to\s+be)/gi,
    /\[INST\]|\[\/INST\]|<\|system\|>|<\|user\|>|<\|assistant\|>/gi, // LLM special tokens
  ]

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '')
  }

  sanitized = sanitized.replace(/[!?]{3,}/g, '!')
  sanitized = sanitized.replace(/\.{4,}/g, '...')

  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')
  sanitized = sanitized.replace(/\s{3,}/g, ' ')
  sanitized = sanitized.trim().slice(0, 1000)

  return sanitized
}
