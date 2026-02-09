import db from '#config/database'
import AuthService from '#services/auth_service'
import { Role, SupplierCategory, RiskLevel, SupplierStatus } from '@mindlapse/shared'
import { randomUUID } from 'node:crypto'

export default class DevSeeder {
  async run() {
    console.log('🌱 Starting dev seeder...')

    // Nettoyer les données existantes
    console.log('🧹 Cleaning existing data...')
    await db.deleteFrom('suppliers').execute()
    await db.deleteFrom('users').execute()
    await db.deleteFrom('organizations').execute()
    console.log('✅ Database cleaned')

    // Mot de passe commun pour tous les comptes (dev only)
    const commonPassword = 'Password123!'
    const passwordHash = await AuthService.hashPassword(commonPassword)

    // ========================================
    // 1. Créer les organisations
    // ========================================
    console.log('📦 Creating organizations...')

    const org1Id = randomUUID()
    const org2Id = randomUUID()

    await db
      .insertInto('organizations')
      .values([
        {
          id: org1Id,
          name: 'Acme Corp',
        },
        {
          id: org2Id,
          name: 'TechStart Inc',
        },
      ])
      .execute()

    console.log('✅ Created 2 organizations')

    // ========================================
    // 2. Créer les utilisateurs
    // ========================================
    console.log('👤 Creating users...')

    const users = [
      {
        id: randomUUID(),
        email: 'owner@acme.com',
        password_hash: passwordHash,
        full_name: 'Alice Owner',
        role: Role.OWNER,
        organization_id: org1Id,
      },
      {
        id: randomUUID(),
        email: 'admin@acme.com',
        password_hash: passwordHash,
        full_name: 'Bob Admin',
        role: Role.ADMIN,
        organization_id: org1Id,
      },
      {
        id: randomUUID(),
        email: 'analyst@acme.com',
        password_hash: passwordHash,
        full_name: 'Charlie Analyst',
        role: Role.ANALYST,
        organization_id: org1Id,
      },
      {
        id: randomUUID(),
        email: 'auditor@techstart.com',
        password_hash: passwordHash,
        full_name: 'Diana Auditor',
        role: Role.AUDITOR,
        organization_id: org2Id,
      },
    ]

    await db.insertInto('users').values(users).execute()

    console.log('✅ Created 4 users:')
    console.log('   - owner@acme.com (Owner, Acme Corp)')
    console.log('   - admin@acme.com (Admin, Acme Corp)')
    console.log('   - analyst@acme.com (Analyst, Acme Corp)')
    console.log('   - auditor@techstart.com (Auditor, TechStart Inc)')
    console.log(`   - Password for all: ${commonPassword}`)

    // ========================================
    // 3. Créer les fournisseurs
    // ========================================
    console.log('🏢 Creating suppliers...')

    const suppliers = [
      // Acme Corp suppliers (10)
      {
        id: randomUUID(),
        name: 'Amazon Web Services',
        domain: 'aws.amazon.com',
        category: SupplierCategory.INFRASTRUCTURE,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2025-12-31',
        notes: 'Cloud infrastructure provider. SOC2 Type II certified.',
        organization_id: org1Id,
        ai_risk_score: 25,
        ai_analysis: JSON.stringify({
          score: 25,
          factors: ['SOC2 certified', 'Enterprise SLA', 'Global infrastructure'],
          recommendations: ['Monitor compliance reports quarterly'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Stripe',
        domain: 'stripe.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-06-30',
        notes: 'Payment processing. PCI DSS Level 1 compliant.',
        organization_id: org1Id,
        ai_risk_score: 20,
        ai_analysis: JSON.stringify({
          score: 20,
          factors: ['PCI DSS compliant', 'Strong security track record'],
          recommendations: ['Review transaction logs monthly'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Slack Technologies',
        domain: 'slack.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2025-08-15',
        notes: 'Team communication platform. Data residency in US.',
        organization_id: org1Id,
        ai_risk_score: 45,
        ai_analysis: JSON.stringify({
          score: 45,
          factors: ['Third-party integrations', 'User data exposure risk'],
          recommendations: ['Enable 2FA for all users', 'Review app permissions'],
        }),
      },
      {
        id: randomUUID(),
        name: 'MongoDB Atlas',
        domain: 'mongodb.com',
        category: SupplierCategory.INFRASTRUCTURE,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-03-31',
        notes: 'Database as a Service. SOC2 Type II certified.',
        organization_id: org1Id,
        ai_risk_score: 40,
        ai_analysis: JSON.stringify({
          score: 40,
          factors: ['Database encryption at rest', 'Network isolation'],
          recommendations: ['Enable audit logs', 'Review access controls'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Acme Consulting Group',
        domain: 'acmeconsulting.example.com',
        category: SupplierCategory.CONSULTING,
        risk_level: RiskLevel.HIGH,
        status: SupplierStatus.UNDER_REVIEW,
        contract_end_date: '2025-05-20',
        notes: 'Security consulting. Currently under compliance review.',
        organization_id: org1Id,
        ai_risk_score: 65,
        ai_analysis: JSON.stringify({
          score: 65,
          factors: ['Access to sensitive data', 'No formal SLA'],
          recommendations: ['Request NDA renewal', 'Conduct background checks'],
        }),
      },
      {
        id: randomUUID(),
        name: 'SendGrid',
        domain: 'sendgrid.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-01-15',
        notes: 'Email delivery service. GDPR compliant.',
        organization_id: org1Id,
        ai_risk_score: 30,
        ai_analysis: JSON.stringify({
          score: 30,
          factors: ['GDPR compliant', 'SOC2 Type II certified'],
          recommendations: ['Review email templates for data leakage'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Cloudflare',
        domain: 'cloudflare.com',
        category: SupplierCategory.INFRASTRUCTURE,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-09-30',
        notes: 'CDN and DDoS protection. Enterprise plan.',
        organization_id: org1Id,
        ai_risk_score: 22,
        ai_analysis: JSON.stringify({
          score: 22,
          factors: ['DDoS protection', 'Global edge network', 'ISO 27001 certified'],
          recommendations: ['Review firewall rules quarterly'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Datadog',
        domain: 'datadoghq.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2025-11-30',
        notes: 'Monitoring and analytics. Access to application logs.',
        organization_id: org1Id,
        ai_risk_score: 50,
        ai_analysis: JSON.stringify({
          score: 50,
          factors: ['Access to logs and metrics', 'Data retention policy'],
          recommendations: ['Mask sensitive data in logs', 'Review retention settings'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Offshore Dev Shop',
        domain: 'offshoredev.example.com',
        category: SupplierCategory.CONSULTING,
        risk_level: RiskLevel.CRITICAL,
        status: SupplierStatus.INACTIVE,
        contract_end_date: '2024-12-31',
        notes: 'Former development partner. Contract terminated due to security concerns.',
        organization_id: org1Id,
        ai_risk_score: 90,
        ai_analysis: JSON.stringify({
          score: 90,
          factors: ['Security incidents', 'No compliance certifications', 'Contract terminated'],
          recommendations: ['Revoke all access immediately', 'Audit code contributions'],
        }),
      },
      {
        id: randomUUID(),
        name: 'GitHub',
        domain: 'github.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-07-31',
        notes: 'Source code hosting. Enterprise plan with SSO.',
        organization_id: org1Id,
        ai_risk_score: 28,
        ai_analysis: JSON.stringify({
          score: 28,
          factors: ['SOC2 certified', 'SSO enabled', 'Code scanning enabled'],
          recommendations: ['Review repository access permissions monthly'],
        }),
      },

      // TechStart Inc suppliers (5)
      {
        id: randomUUID(),
        name: 'Google Cloud Platform',
        domain: 'cloud.google.com',
        category: SupplierCategory.INFRASTRUCTURE,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-12-31',
        notes: 'Cloud infrastructure and AI services. ISO 27001 certified.',
        organization_id: org2Id,
        ai_risk_score: 23,
        ai_analysis: JSON.stringify({
          score: 23,
          factors: ['ISO 27001 certified', 'SOC2 Type II', 'GDPR compliant'],
          recommendations: ['Enable security command center', 'Review IAM policies'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Notion',
        domain: 'notion.so',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2025-10-15',
        notes: 'Workspace and documentation. Contains sensitive product roadmaps.',
        organization_id: org2Id,
        ai_risk_score: 48,
        ai_analysis: JSON.stringify({
          score: 48,
          factors: ['Sensitive data storage', 'Limited audit logs'],
          recommendations: ['Classify and label sensitive pages', 'Enable workspace audit log'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Zoom',
        domain: 'zoom.us',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.MEDIUM,
        status: SupplierStatus.UNDER_REVIEW,
        contract_end_date: '2025-06-30',
        notes: 'Video conferencing. Recent privacy policy changes under review.',
        organization_id: org2Id,
        ai_risk_score: 55,
        ai_analysis: JSON.stringify({
          score: 55,
          factors: ['Privacy policy changes', 'Recording storage concerns'],
          recommendations: [
            'Review data retention policy',
            'Disable cloud recording for sensitive meetings',
          ],
        }),
      },
      {
        id: randomUUID(),
        name: 'Figma',
        domain: 'figma.com',
        category: SupplierCategory.SAAS,
        risk_level: RiskLevel.LOW,
        status: SupplierStatus.ACTIVE,
        contract_end_date: '2026-04-30',
        notes: 'Design collaboration. SOC2 Type II certified.',
        organization_id: org2Id,
        ai_risk_score: 32,
        ai_analysis: JSON.stringify({
          score: 32,
          factors: ['SOC2 Type II certified', 'Link sharing controls'],
          recommendations: ['Review shared link permissions', 'Enable SSO'],
        }),
      },
      {
        id: randomUUID(),
        name: 'Unverified Vendor',
        domain: 'unverified-vendor.example.com',
        category: SupplierCategory.OTHER,
        risk_level: RiskLevel.CRITICAL,
        status: SupplierStatus.UNDER_REVIEW,
        contract_end_date: null,
        notes: 'New vendor. No compliance certifications. Awaiting security questionnaire.',
        organization_id: org2Id,
        ai_risk_score: 85,
        ai_analysis: JSON.stringify({
          score: 85,
          factors: ['No certifications', 'Unknown security posture', 'No contract'],
          recommendations: [
            'Complete vendor risk assessment',
            'Request SOC2 report',
            'Do not grant production access',
          ],
        }),
      },
    ]

    await db.insertInto('suppliers').values(suppliers).execute()

    console.log(`✅ Created ${suppliers.length} suppliers:`)
    console.log(
      `   - ${suppliers.filter((s) => s.organization_id === org1Id).length} for Acme Corp`
    )
    console.log(
      `   - ${suppliers.filter((s) => s.organization_id === org2Id).length} for TechStart Inc`
    )
    console.log('   - Risk levels: Critical (2), High (1), Medium (5), Low (7)')

    console.log('\n🎉 Dev seeder completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   - 2 organizations')
    console.log('   - 4 users (1 per role)')
    console.log(`   - ${suppliers.length} suppliers`)
    console.log(`   - Password for all accounts: ${commonPassword}`)
    console.log('\n🔐 Login credentials:')
    console.log('   - owner@acme.com / Password123!')
    console.log('   - admin@acme.com / Password123!')
    console.log('   - analyst@acme.com / Password123!')
    console.log('   - auditor@techstart.com / Password123!')
  }
}
