// src/legal.js — Legal & compliance documents for Caribbean Trade Network.
// Operated by R&R Digital Platform Solutions Ltd. GDPR (EU 2016/679), ePrivacy (2002/58/EC),
// UK GDPR, and EU AI Act (2024/1689) aligned. Rendered via the shared UI shell.
'use strict';
const ui = require('./ui');

function docBody(sections){
  return '<section class="section"><div class="legal" style="max-width:760px;margin:0 auto;line-height:1.7">'
    + sections.map(s => `<h2 style="font-size:20px;margin:28px 0 10px;color:var(--primary)">${ui.esc(s.h)}</h2>${s.p.map(p=>`<p style="margin:10px 0;color:var(--on-surface-variant)">${ui.esc(p)}</p>`).join('')}`).join('')
    + '<p style="margin-top:30px;color:var(--on-surface-variant)"><em>Last updated: August 2026. Operated by R&amp;R Digital Platform Solutions Ltd.</em></p></div></section>';
}

const PRIVACY = [
 {h:'1. Who we are', p:['Caribbean Trade Network ("we", "us", "our") is operated by R&R Digital Platform Solutions Ltd., a company registered in Trinidad and Tobago, trading as the Caribbean Trade Network B2B marketplace.', 'We are the data controller for personal data we collect when you use our platform, subject to the EU General Data Protection Regulation (GDPR, Regulation (EU) 2016/679), the UK GDPR, and applicable Caribbean data-protection laws.']},
 {h:'2. What personal data we collect', p:['Account data: name, email address, password (hashed), company/organisation name, country, role, and billing/verification data.', 'Business & directory data: details you submit or that we source from public directories (business name, address, phone, website, category).', 'Transaction data: sourcing requests (RFQs), quotes, orders, escrow and payment records, and communications.', 'Technical data: IP address, browser/device type, pages visited, and cookies (see our Cookie Policy).', 'Advertising data: campaign settings and engagement metrics if you use or interact with our advertising platform.']},
 {h:'3. Lawful bases for processing (Art. 6 GDPR)', p:['We process personal data under the following legal bases:', 'Consent (Art. 6(1)(a)) — for marketing cookies, optional newsletters, and any special-category data.', 'Contract (Art. 6(1)(b)) — to provide the platform services, process orders, escrow and payments you request.', 'Legal obligation (Art. 6(1)(c)) — to comply with tax, anti-money-laundering and record-keeping laws.', 'Legitimate interests (Art. 6(1)(f)) — to operate, secure and improve the platform, prevent fraud, and to source public business-directory data.']},
 {h:'4. How we use your data', p:['To operate the marketplace: account management, search and matching, RFQs and quotes, orders, escrow settlement, and payments.', 'To verify businesses and publish source-backed profiles.', 'To display advertising and measure its performance on our platform.', 'To send service communications (not marketing) and, with consent, marketing.', 'To comply with legal obligations and protect rights and security.']},
 {h:'5. Data sharing', p:['We do not sell personal data. We share data only: (a) with counterparties to a transaction you initiate; (b) with payment/escrow and verification processors under contract; (c) with regulators or authorities where legally required; (d) with service providers processing on our behalf under a data-processing agreement.']},
 {h:'6. International transfers', p:['Your data may be transferred outside your country (including to the EU, UK, US, and other jurisdictions) to provide the service. We rely on adequacy decisions, Standard Contractual Clauses (Art. 46 GDPR), or other valid transfer mechanisms, and we ensure appropriate safeguards for every cross-border transfer.']},
 {h:'7. Retention', p:['We keep account data while your account is active and for a reasonable period after, transactional and financial records for the period required by law (typically 5–7 years), and technical logs for up to 24 months unless a longer legal duty applies. Directory and sourced data is retained until you successfully claim and request removal.']},
 {h:'8. Your data-subject rights', p:['Under the GDPR and UK GDPR you have the right to: access (Art.15), rectification (Art.16), erasure / "right to be forgotten" (Art.17), restriction of processing (Art.18), data portability (Art.20), and to object to processing (Art.21) including direct marketing.', 'You may withdraw consent at any time without affecting the lawfulness of processing based on consent before withdrawal.', 'You also have the right to lodge a complaint with a supervisory authority.']},
 {h:'9. AI features and the EU AI Act', p:['Our platform uses artificial intelligence (e.g., the AI concierge, automated search/matching, and profile optimisation). Where we use high-risk AI systems in the sense of Regulation (EU) 2024/1689 (EU AI Act), we implement the required risk-management, transparency, human-oversight and logging measures.', 'Automated decisions that produce legal or similarly significant effects will include human review on request, and you may object to or request review of such decisions.']},
 {h:'10. Cookies', p:['We use strictly necessary, functional, analytics and (with your consent) advertising cookies. You can manage preferences via our cookie banner and your browser settings. See the Cookie Policy for details.']},
 {h:'11. Children', p:['Our services are for business users aged 18 and over. We do not knowingly collect data from children under 16 without verifiable parental consent, and we will delete such data on discovery.']},
 {h:'12. Security', p:['We use appropriate technical and organisational measures — encryption in transit and at rest, access controls, and audit logging — to protect personal data. No method of transmission is 100% secure, and you should safeguard your account credentials.']},
 {h:'13. Data Protection Officer & contact', p:['For any privacy request, to exercise your rights, or to contact our Data Protection Officer, email: privacy@kunjaldigital.com, or write to R&R Digital Platform Solutions Ltd., Trinidad and Tobago.', 'We will respond to verifiable requests within the timeframes required by applicable law (typically 30 days).']},
];
const TERMS = [
 {h:'1. Agreement', p:['These Terms of Service govern your access to and use of the Caribbean Trade Network platform operated by R&R Digital Platform Solutions Ltd. By creating an account or using the platform, you agree to these Terms and our Privacy Policy.']},
 {h:'2. Eligibility', p:['You must be at least 18 years old and, if acting for an organisation, authorised to bind it. Business listings you claim must be genuinely owned or authorised by you.']},
 {h:'3. Accounts & verification', p:['You are responsible for the accuracy of your information and the security of your credentials. Public business profiles are marked "Unclaimed" until verified; we do not represent unclaimed listings as verified.']},
 {h:'4. Marketplace & transactions', p:['The platform facilitates sourcing requests, quotes, orders, escrow and settlement between parties. We are not a party to the underlying sale unless we state otherwise. Prices, taxes, duties and landed costs are estimates and must be confirmed by the parties.']},
 {h:'5. Acceptable use', p:['You agree not to misuse the platform, including: posting unlawful or infringing content, false information, spam, attempting unauthorised access, manipulating listings or payments, or using the platform to commit fraud. See the Acceptable Use Policy.']},
 {h:'6. Escrow & settlement', p:['Escrow services hold funds until agreed conditions (including buyer sign-off) are met. Disputes are resolved per the escrow terms; our role is administrative and subject to applicable financial-services laws.']},
 {h:'7. Fees & payments', p:['Fees for subscriptions and advertising are stated at checkout. We may use payment and escrow processors; you agree to their terms. Fees are non-refundable except where required by law.']},
 {h:'8. Intellectual property', p:['The platform, design, logo, and content are owned by R&R Digital Platform Solutions Ltd. or its licensors. You retain rights to content you submit and grant us a licence to host and display it to operate the service.']},
 {h:'9. AI & automated tools', p:['We use AI tools (concierge, matching, optimisation). AI outputs are informational and may contain errors; you must independently verify any business or trade facts before relying on them.']},
 {h:'10. Disclaimers & limitation of liability', p:['The platform is provided "as is". To the maximum extent permitted by law, we disclaim implied warranties and are not liable for indirect, incidental, or consequential damages, or for losses arising from transactions between users. Our total liability is limited to the amounts you paid us in the 12 months preceding the claim. Nothing limits liability that cannot be limited by law.']},
 {h:'11. Termination', p:['We may suspend or terminate access for breach of these Terms or applicable law. You may close your account at any time; we will honour obligations already entered into.']},
 {h:'12. Governing law & disputes', p:['These Terms are governed by the laws of Trinidad and Tobago, without regard to conflict-of-laws rules. Disputes are subject to the exclusive jurisdiction of the courts of Trinidad and Tobago, subject to mandatory consumer protections and applicable law where you reside.']},
 {h:'13. Changes & contact', p:['We may update these Terms; material changes will be notified. Continued use after changes constitutes acceptance. Contact: legal@kunjaldigital.com.']},
];
const COOKIES = [
 {h:'1. What cookies are', p:['Cookies are small text files placed on your device when you visit a website. They help the site function, remember preferences, and understand usage.']},
 {h:'2. Strictly necessary', p:['Required for core functionality (e.g., session cookies, security, escrow/payment flows). These cannot be disabled and do not require consent under ePrivacy (2002/58/EC).']},
 {h:'3. Functional & preference', p:['Remember your settings, region, currency, and choices. We use these on the basis of your preferences.']},
 {h:'4. Analytics', p:['We may use analytics (e.g., first-party logs and, with consent, third-party tools) to understand usage and improve the platform.']},
 {h:'5. Advertising & marketing', p:['With your consent, we may use cookies to serve and measure ads and to personalise content. You may opt in or out at any time.']},
 {h:'6. Managing consent', p:['You control cookies via our cookie banner (withdrawable at any time) and your browser settings. Blocking some cookies may affect functionality. We retain a record of your consent choices for audit purposes.']},
];
const DPA = [
 {h:'1. Scope', p:['This Data Processing Agreement applies where a user or processor ("Processor") processes personal data on behalf of R&R Digital Platform Solutions Ltd. ("Controller") in connection with the platform, or where we process data as a processor for you.']},
 {h:'2. Roles', p:['Each party acts as an independent controller for its own data; where we process data on your documented instructions, we act as a processor.']},
 {h:'3. Instructions & purposes', p:['The Processor processes personal data only on documented instructions from the Controller and for the agreed purposes, never for its own unrelated purposes unless independently permitted.']},
 {h:'4. Confidentiality & security', p:['The Processor ensures confidentiality (personnel bound by confidentiality) and implements appropriate technical and organisational measures per Art.32 GDPR to protect data against loss, unauthorised access, and breach.']},
 {h:'5. Sub-processors', p:['The Processor may engage sub-processors only with the Controller\'s authorisation and under written terms imposing the same obligations. A current list of sub-processors is available on request.']},
 {h:'6. Data-subject rights & assistance', p:['The Processor assists the Controller in responding to data-subject requests (access, rectification, erasure, etc.) and in complying with its obligations.']},
 {h:'7. Breach notification', p:['The Processor notifies the Controller without undue delay of any personal-data breach that risks the rights and freedoms of individuals, so the Controller can notify authorities and affected persons as required.']},
 {h:'8. International transfers', p:['Where data is transferred outside the EEA/UK, the Processor applies appropriate safeguards, including Standard Contractual Clauses, and records any sub-processor transfers.']},
 {h:'9. Deletion & return', p:['On termination, the Processor returns or securely deletes personal data at the Controller\'s choice, unless law requires retention.']},
 {h:'10. Audits', p:['The Processor allows the Controller to audit compliance, subject to reasonable notice and confidentiality.']},
 {h:'11. Liabilities & duration', p:['Each party is liable for its own processing obligations. This DPA survives termination of the underlying agreement while data is processed.']},
];
const AU = [
 {h:'1. Purpose', p:['This Acceptable Use Policy sets out the conduct we prohibit on the Caribbean Trade Network. Breach may result in removal of content or termination of access.']},
 {h:'2. Prohibited conduct', p:['Posting unlawful, infringing, fraudulent, defamatory, obscene, or misleading content; false business claims; unsolicited bulk messaging; scraping or crawling beyond permitted use; attempting unauthorised access or disrupting the platform; facilitating money laundering or prohibited trade.']},
 {h:'3. Authenticity', p:['You must not misrepresent your identity, authority, or the status (claimed/verified) of a business profile. Claimed profiles must be genuinely owned or authorised.']},
 {h:'4. Advertising content', p:['Ads must comply with applicable advertising standards and must not be misleading, deceptive, or target prohibited products or audiences. We may reject or remove any ad.']},
 {h:'5. Enforcement', p:['We may remove content, suspend accounts, withhold or reverse payments, or refer matters to authorities, in our reasonable discretion.']},
 {h:'6. Reporting', p:['Report abuse or suspected misuse to abuse@kunjaldigital.com. We will review reports promptly and confidentially.']},
];

function render(slug, active){
  const map = { privacy:['Privacy Policy',PRIVACY], terms:['Terms of Service',TERMS], cookies:['Cookie Policy',COOKIES], dpa:['Data Processing Agreement',DPA], 'acceptable-use':['Acceptable Use Policy',AU] };
  const [title, sections] = map[slug] || map.privacy;
  return ui.shell(title, docBody(sections), active);
}
module.exports = { render, PRIVACY, TERMS, COOKIES, DPA, AU, docBody };
