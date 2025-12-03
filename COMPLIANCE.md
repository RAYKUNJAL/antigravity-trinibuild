# TriniBuild Compliance Documentation

**Last Updated:** December 2025  
**Version:** 1.0  
**Classification:** Public

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Compliance Framework](#compliance-framework)
- [Data Governance](#data-governance)
- [Privacy & Data Protection](#privacy--data-protection)
- [Industry Standards](#industry-standards)
- [Regulatory Compliance](#regulatory-compliance)
- [Data Handling Practices](#data-handling-practices)
- [User Rights](#user-rights)
- [Audit & Reporting](#audit--reporting)
- [Contact Information](#contact-information)

---

## Executive Summary

TriniBuild is committed to maintaining the highest standards of compliance, data protection, and privacy. This document outlines our comprehensive compliance framework, data handling practices, and adherence to international standards and regulations.

### Core Compliance Commitments

✅ **SOC 2 Type 2** - Built on certified infrastructure  
✅ **GDPR Compliant** - EU data protection standards  
✅ **Privacy by Design** - Data protection from inception  
✅ **Transparent Operations** - Clear data practices  
✅ **User Control** - Comprehensive data rights

---

## Compliance Framework

### Infrastructure Compliance

TriniBuild leverages **Supabase** as our primary backend infrastructure provider. Supabase maintains multiple compliance certifications:

#### Active Certifications

| Standard | Status | Scope | Audit Frequency |
|----------|--------|-------|----------------|
| **SOC 2 Type 2** | ✅ Active | Security, Availability, Confidentiality | Annual |
| **ISO 27001** | ✅ Active | Information Security Management | Annual |
| **GDPR** | ✅ Active | EU Data Protection | Continuous |
| **HIPAA** | ✅ Ready | Healthcare Data (configurable) | As needed |
| **PCI DSS** | ✅ Level 1 | Payment Card Data (via PayPal) | Annual |

### Compliance Attestations

- **SOC 2 Type 2 Report** - Available upon request to enterprise clients
- **ISO 27001 Certificate** - Available via infrastructure provider
- **GDPR Data Processing Agreement** - Executed with Supabase
- **Sub-processor List** - Maintained and updated quarterly

---

## Data Governance

### Data Governance Framework

```
┌─────────────────────────────────────────┐
│         Data Governance Council         │
│   (Privacy, Security, Legal, Product)   │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌─────────────┐    ┌──────────────┐
│   Privacy   │    │   Security   │
│   Officer   │    │     Team     │
└─────────────┘    └──────────────┘
    │                     │
    └──────────┬──────────┘
               ▼
    ┌──────────────────────┐
    │   Data Stewards      │
    │ (Engineering Teams)  │
    └──────────────────────┘
```

### Data Classification Policy

#### Classification Levels

**PUBLIC** - No restrictions
- Marketing materials
- Public store listings
- Blog posts and articles
- Product catalogs

**INTERNAL** - Company use only
- Analytics reports
- Performance metrics
- Aggregated statistics
- Internal documentation

**CONFIDENTIAL** - Restricted access
- User profiles and preferences
- Order history and transactions
- Communication records
- Business partnerships data

**RESTRICTED** - Highest protection
- Payment information (tokenized)
- Government-issued IDs (for verification)
- Health information (where applicable)
- Legal documents and contracts

### Data Lifecycle Management

#### Data Collection
- **Consent Required** - Explicit opt-in for non-essential data
- **Purpose Limitation** - Data collected only for stated purposes
- **Minimization** - Only collect what's necessary
- **Transparency** - Clear disclosure of collection practices

#### Data Processing
- **Lawful Basis** - Legitimate purpose for all processing
- **Security Controls** - Encryption and access controls
- **Quality Assurance** - Regular data accuracy checks
- **Documentation** - All processing activities logged

#### Data Storage
- **Encryption at Rest** - AES-256 for all stored data
- **Geographic Controls** - Data residency requirements honored
- **Retention Policies** - Automatic deletion after retention period
- **Backup Procedures** - Encrypted backups with 30-day retention

#### Data Deletion
- **User-Initiated** - Self-service account deletion
- **Automated Cleanup** - Scheduled deletion of expired data
- **Verification** - Confirmation of complete deletion
- **Backup Purging** - Removal from all backup systems

---

## Privacy & Data Protection

### GDPR Compliance (General Data Protection Regulation)

#### Legal Basis for Processing

| Purpose | Legal Basis | Examples |
|---------|-------------|----------|
| Account Creation | Contract Performance | User registration, authentication |
| Service Delivery | Contract Performance | Store creation, order processing |
| Marketing | Consent | Newsletter, promotional emails |
| Analytics | Legitimate Interest | Platform improvement, bug fixing |
| Legal Obligations | Legal Requirement | Tax records, fraud prevention |

#### Data Protection Principles

1. **Lawfulness, Fairness, Transparency**
   - Clear privacy policy in plain language
   - Transparent data collection practices
   - User-friendly consent mechanisms

2. **Purpose Limitation**
   - Data used only for stated purposes
   - No secondary use without consent
   - Clear communication of any changes

3. **Data Minimization**
   - Collect only necessary information
   - Regular review of data collection
   - Remove unnecessary fields

4. **Accuracy**
   - Users can update their information
   - Regular data quality checks
   - Prompt correction of errors

5. **Storage Limitation**
   - Clear retention periods
   - Automated deletion processes
   - Regular data purges

6. **Integrity & Confidentiality**
   - Encryption in transit and at rest
   - Access controls and authentication
   - Regular security audits

7. **Accountability**
   - Data Protection Impact Assessments (DPIA)
   - Records of processing activities
   - Privacy by design and by default

### Privacy by Design

TriniBuild implements privacy protection throughout the entire development lifecycle:

#### Development Phase
- Privacy requirements in user stories
- Data minimization in feature design
- Security review before deployment

#### Default Settings
- Most privacy-protective settings by default
- Opt-in for non-essential features
- Clear privacy controls

#### User Interface
- Privacy dashboard for data management
- Easy-to-understand privacy settings
- One-click data download and deletion

---

## Industry Standards

### OWASP Compliance

We follow **OWASP Top 10** guidelines for web application security:

1. ✅ **Broken Access Control** - Comprehensive RLS policies
2. ✅ **Cryptographic Failures** - Strong encryption everywhere
3. ✅ **Injection** - Parameterized queries, input validation
4. ✅ **Insecure Design** - Threat modeling, security patterns
5. ✅ **Security Misconfiguration** - Hardened defaults, security headers
6. ✅ **Vulnerable Components** - Regular dependency updates
7. ✅ **Authentication Failures** - MFA, secure session management
8. ✅ **Software/Data Integrity** - Code signing, integrity checks
9. ✅ **Logging Failures** - Comprehensive audit logs
10. ✅ **SSRF** - Input validation, network segmentation

### PCI DSS (Payment Card Industry Data Security Standard)

#### Level 1 Compliance (via PayPal Integration)

We achieve PCI DSS compliance through our payment processor:

- **No Card Data Storage** - Never store card numbers
- **Tokenization** - Payment tokens only
- **Secure Gateway** - PayPal handles all card processing
- **Encryption** - TLS 1.3 for all payment communication
- **Access Control** - Restricted merchant access

#### Payment Security Controls

```
Customer
    ↓ (Initiates Payment)
TriniBuild Frontend
    ↓ (Redirects to PayPal)
PayPal Gateway (PCI DSS Level 1)
    ↓ (Processes Payment)
PayPal API (Returns Token)
    ↓
TriniBuild Backend (Stores Token Only)
```

### ISO 27001 Alignment

Our information security management aligns with ISO 27001:

- **Risk Assessment** - Regular threat analysis
- **Security Policies** - Documented and enforced
- **Asset Management** - Inventory of all IT assets
- **Access Control** - Role-based access control (RBAC)
- **Cryptography** - Encryption standards enforced
- **Operations Security** - Change management processes
- **Communications Security** - Secure channels only
- **Supplier Relationships** - Vendor security assessments
- **Incident Management** - Defined response procedures
- **Business Continuity** - Disaster recovery planning

---

## Regulatory Compliance

### Trinidad & Tobago Data Protection

#### Data Protection Act 2011

TriniBuild complies with Trinidad & Tobago's Data Protection Act:

- **Registration** - Data controller registration maintained
- **Consent** - Explicit consent for data collection
- **Purpose** - Clear purpose specification
- **Access Rights** - User access to their data
- **Security** - Appropriate security measures
- **Transfers** - Controlled international transfers
- **Retention** - Defined retention periods
- **Notification** - Breach notification procedures

#### Local Compliance Officer

- **Name:** [To be assigned]
- **Contact:** compliance@trinibuild.com
- **Registration:** [ODPP Registration Number]

### Caribbean Data Protection

We extend GDPR-level protection to all Caribbean users:

- **Regional Data Residency** - Data processing locations disclosed
- **Local Privacy Rights** - GDPR rights extended regionally
- **Language Support** - Privacy notices in English
- **Contact Methods** - Local support channels

### International Data Transfers

#### Standard Contractual Clauses (SCCs)

For EU data transfers, we use EC-approved SCCs:

- **Controller-to-Processor** - Executed with Supabase
- **Transfer Impact Assessment** - Documented safeguards
- **Supplementary Measures** - Encryption, access controls
- **Monitoring** - Quarterly compliance review

#### Adequacy Decisions

We process data in jurisdictions with EU adequacy decisions where possible:
- United Kingdom
- Canada
- New Zealand
- Switzerland

---

## Data Handling Practices

### Personal Data We Collect

#### Account Information
- Email address (required)
- Full name (required)
- Phone number (optional)
- Profile photo (optional)
- Business information (for vendors)

#### Transaction Data
- Order history
- Payment tokens (not card numbers)
- Delivery addresses
- Purchase preferences

#### Usage Data
- Login times and IP addresses
- Page views and clicks
- Feature usage patterns
- Device information (browser, OS)

#### Communication Data
- Support ticket messages
- In-app chat conversations
- Email communications
- Survey responses

### How We Use Data

#### Service Provision
- Account authentication and management
- Order processing and fulfillment
- Customer support and communication
- Platform functionality

#### Business Operations
- Fraud prevention and security
- Legal compliance and obligations
- Analytics and performance monitoring
- Platform improvement

#### Marketing (with consent)
- Promotional emails and offers
- Personalized recommendations
- Newsletter subscriptions
- Product announcements

### Data Sharing & Disclosure

We **DO NOT sell** user data. Limited sharing occurs for:

#### Service Providers
- **Supabase** - Backend infrastructure and database
- **PayPal** - Payment processing
- **Google Cloud** - AI/ML services for platform features
- **Cloudflare** - CDN and DDoS protection

#### Legal Requirements
- Court orders and subpoenas
- Law enforcement requests (with valid warrant)
- Protection of rights and property
- Emergency situations

#### Business Transfers
- Mergers or acquisitions (with user notification)
- Asset sales (data protection maintained)
- Bankruptcy proceedings (as required by law)

### Data Security Measures

#### Technical Controls
- **Encryption:** AES-256 at rest, TLS 1.3 in transit
- **Authentication:** Multi-factor authentication available
- **Access Control:** Role-based permissions (RBAC)
- **Monitoring:** 24/7 security monitoring
- **Backups:** Encrypted daily backups

#### Organizational Controls
- **Security Training:** All employees trained on data protection
- **Background Checks:** For employees with data access
- **Access Reviews:** Quarterly access permission audits
- **Vendor Management:** Annual vendor security assessments
- **Incident Response:** Documented procedures and drills

#### Physical Controls (via Infrastructure Provider)
- **Data Centers:** SOC 2 certified facilities
- **Access Control:** Biometric and card access
- **Surveillance:** 24/7 video monitoring
- **Environmental:** Fire suppression, climate control
- **Redundancy:** Multiple availability zones

---

## User Rights

### GDPR Rights (Extended to All Users)

#### Right to Access
- **Request:** privacy@trinibuild.com
- **Response Time:** Within 30 days
- **Format:** JSON or PDF export
- **Cost:** Free for first request

#### Right to Rectification
- **Method:** Self-service in Settings page
- **Support:** Contact support@trinibuild.com
- **Timeline:** Immediate for most data

#### Right to Erasure ("Right to be Forgotten")
- **Process:** Account deletion in Settings
- **Timeline:** 30-day soft delete, then permanent
- **Exceptions:** Legal retention requirements
- **Confirmation:** Email notification upon completion

#### Right to Data Portability
- **Format:** Machine-readable JSON export
- **Scope:** All personal data
- **Delivery:** Secure download link
- **Timeline:** Within 30 days

#### Right to Restrict Processing
- **Request:** privacy@trinibuild.com
- **Options:** Marketing opt-out, analytics opt-out
- **Timeline:** Immediate upon request

#### Right to Object
- **Profiling:** Opt-out of automated decisions
- **Marketing:** Unsubscribe from all marketing
- **Processing:** Object to specific data uses

#### Right to Withdraw Consent
- **Method:** Settings page or email request
- **Effect:** Immediate cessation of consent-based processing
- **Account:** May limit platform functionality

### Additional User Controls

#### Privacy Dashboard
- View all collected data
- Download data export
- Manage cookie preferences
- Control marketing communications
- Delete account

#### Communication Preferences
- Email frequency settings
- Notification preferences
- SMS opt-in/opt-out
- Third-party sharing controls

---

## Audit & Reporting

### Internal Compliance Audits

#### Quarterly Reviews
- **Data Processing Activities** - Review all processing
- **Vendor Compliance** - Assess sub-processor compliance
- **Access Controls** - Audit user permissions
- **Data Retention** - Verify deletion schedules

#### Annual Assessments
- **Privacy Impact Assessment** - For new features
- **Compliance Gap Analysis** - Identify deficiencies
- **Policy Updates** - Revise as needed
- **Training Effectiveness** - Staff knowledge testing

### External Audits

#### SOC 2 Audit (Infrastructure)
- **Frequency:** Annual
- **Auditor:** Third-party CPA firm
- **Scope:** Security, availability, confidentiality
- **Report:** Available to enterprise clients

#### Penetration Testing
- **Frequency:** Annual minimum
- **Scope:** Full platform assessment
- **Report:** Remediation tracking
- **Retest:** After critical findings

### Breach Notification

#### Detection & Assessment
- **Timeline:** Continuous monitoring
- **Severity Assessment:** Within 4 hours
- **Scope Determination:** Within 24 hours

#### Notification Process
- **Regulatory:** Within 72 hours (GDPR requirement)
- **Affected Users:** Without undue delay
- **Content:** Nature, impact, remediation steps
- **Public Disclosure:** If high risk to users

#### Documentation
- All breaches logged in incident register
- Root cause analysis conducted
- Corrective actions implemented
- Lessons learned documented

---

## Compliance Roadmap

### Current State (2025)

✅ GDPR Compliant  
✅ SOC 2 Infrastructure  
✅ PCI DSS (via PayPal)  
✅ Trinidad Data Protection Act  

### Planned Certifications (2026)

🔄 **SOC 2 Type 2** - Direct certification (Q2 2026)  
🔄 **ISO 27001** - Information security (Q3 2026)  
🔄 **Privacy Shield** - US-EU data transfers (Q4 2026)  

### Continuous Improvement

- **Quarterly** - Privacy policy reviews
- **Bi-annual** - Security awareness training
- **Annual** - Compliance framework assessment
- **Continuous** - Monitoring regulatory changes

---

## Policies & Procedures

### Published Documents

1. **Privacy Policy** - [Link to website]
2. **Terms of Service** - [Link to website]
3. **Cookie Policy** - [Link to website]
4. **Data Processing Agreement** - Available on request
5. **Vendor Security Questionnaire** - For enterprise clients

### Internal Procedures

- Data Breach Response Plan
- Data Retention and Deletion Schedule
- Privacy Impact Assessment Template
- Vendor Risk Assessment Framework
- Employee Data Protection Training

---

## Contact Information

### Data Protection

**Data Protection Officer:** privacy@trinibuild.com  
**Privacy Inquiries:** privacy@trinibuild.com  
**Data Subject Requests:** privacy@trinibuild.com  

**Mailing Address:**  
TriniBuild Data Protection Office  
[Physical Address]  
Trinidad & Tobago

### Security

**Security Team:** security@trinibuild.com  
**Vulnerability Reports:** security@trinibuild.com  
**Emergency Hotline:** [Phone number for enterprise clients]

### Compliance

**Compliance Officer:** compliance@trinibuild.com  
**Regulatory Inquiries:** legal@trinibuild.com  
**Enterprise Support:** enterprise@trinibuild.com

### Support

**General Support:** support@trinibuild.com  
**Technical Support:** tech@trinibuild.com  
**Business Inquiries:** business@trinibuild.com

---

## Supervisory Authorities

### Trinidad & Tobago

**Office of the Data Protection Commissioner**  
[Address]  
Email: [Email]  
Website: [Website]

### European Union (for EU users)

Users in EU member states can contact their local data protection authority.  
**EU Data Protection Authorities:** https://edpb.europa.eu/about-edpb/board/members_en

---

## Document Control

### Version History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | Dec 2025 | Initial compliance documentation | Legal & Compliance Team |

### Review & Approval

- **Reviewed By:** Privacy Officer, Legal Counsel, Security Team
- **Approved By:** Chief Executive Officer
- **Next Review:** March 2026 (Quarterly)

### Updates & Amendments

This document is reviewed and updated:
- **Quarterly** - Regular compliance review
- **As Needed** - Regulatory or operational changes
- **Annual** - Comprehensive policy review

Users will be notified of material changes via email.

---

## Appendices

### Appendix A: Data Processing Activities Register

Maintained separately and available to regulatory authorities upon request.

### Appendix B: Sub-processor List

| Sub-processor | Service | Location | Safeguards |
|--------------|---------|----------|------------|
| Supabase | Database & Backend | USA | SCC, SOC 2 |
| PayPal | Payment Processing | Global | PCI DSS Level 1 |
| Google Cloud | AI/ML Services | USA | SCC, ISO 27001 |
| Cloudflare | CDN & Security | Global | SOC 2, ISO 27001 |

### Appendix C: Data Retention Schedule

| Data Category | Retention Period | Legal Basis |
|--------------|------------------|-------------|
| Active Accounts | Duration of relationship | Contract |
| Inactive Accounts | 2 years | Legitimate interest |
| Deleted Accounts | 30 days (soft delete) | User request |
| Transaction Records | 7 years | Tax law |
| Access Logs | 90 days | Security |
| Backups | 30 days | Business continuity |

### Appendix D: Cookie Policy Summary

**Essential Cookies:** Required for platform functionality (no consent needed)  
**Analytics Cookies:** Opt-in required for non-EU, opt-out for EU  
**Marketing Cookies:** Explicit consent required  
**Third-Party Cookies:** Listed in cookie policy, consent required

---

**Disclaimer:** This document provides an overview of TriniBuild's compliance framework and data handling practices. It does not constitute legal advice. For specific legal questions, please consult with qualified legal counsel.

**Last Updated:** December 2025  
**Effective Date:** January 1, 2026

**© 2025 TriniBuild. All rights reserved.**
