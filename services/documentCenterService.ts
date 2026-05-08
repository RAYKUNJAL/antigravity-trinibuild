/**
 * documentCenterService.ts — AI Banking & Visa Document System
 * Generates: Proof of Income, Bank Account Letter, Visa Support,
 * Job Letters, Loan Support, Financial Statements, VAT Certificates
 * Uses GPT-4o mini via VITE_OPENAI_API_KEY
 */

import { supabase } from './supabaseClient';

export const DOCUMENT_CATALOG = [
  {
    id: 'proof_of_income',
    title: 'Proof of Income',
    subtitle: 'For bank accounts & visa applications',
    description: 'Official letter verifying your TriniBuild store earnings, accepted by T&T banks and embassies.',
    icon: '💰',
    color: '#10B981',
    price_ttd: 0,
    is_free: true,
    category: 'banking',
    fields: [
      { key: 'owner_name', label: 'Your Full Legal Name', type: 'text', required: true },
      { key: 'business_name', label: 'Business / Store Name', type: 'text', required: true },
      { key: 'monthly_income', label: 'Average Monthly Income (TTD)', type: 'number', required: true },
      { key: 'income_period', label: 'Income Period (e.g. Jan 2025 – Apr 2026)', type: 'text', required: true },
      { key: 'id_number', label: 'National ID / Passport Number', type: 'text', required: true },
    ],
  },
  {
    id: 'bank_account_letter',
    title: 'Bank Account Support Letter',
    subtitle: 'Open a business bank account',
    description: 'Reference letter for opening a business bank account at any T&T commercial bank.',
    icon: '🏦',
    color: '#2563EB',
    price_ttd: 50,
    is_free: false,
    category: 'banking',
    fields: [
      { key: 'owner_name', label: 'Full Legal Name', type: 'text', required: true },
      { key: 'business_name', label: 'Business Name', type: 'text', required: true },
      { key: 'bank_name', label: 'Target Bank', type: 'select', required: true, options: ['Republic Bank', 'First Citizens Bank', 'Scotiabank T&T', 'RBC Royal Bank', 'JMMB Bank', 'Unit Trust Corporation'] },
      { key: 'business_type', label: 'Business Type', type: 'select', required: true, options: ['Sole Trader', 'Partnership', 'Limited Liability Company', 'Cooperative'] },
      { key: 'monthly_turnover', label: 'Expected Monthly Turnover (TTD)', type: 'number', required: true },
    ],
  },
  {
    id: 'visa_support_letter',
    title: 'Visa Support Letter',
    subtitle: 'US, UK, Canada, Schengen',
    description: 'Business sponsorship or personal financial support letter for visa applications.',
    icon: '✈️',
    color: '#7C3AED',
    price_ttd: 75,
    is_free: false,
    category: 'visa',
    fields: [
      { key: 'applicant_name', label: 'Applicant Full Name', type: 'text', required: true },
      { key: 'passport_number', label: 'Passport Number', type: 'text', required: true },
      { key: 'destination_country', label: 'Destination Country', type: 'text', required: true },
      { key: 'embassy', label: 'Embassy / Consulate', type: 'text', required: false },
      { key: 'travel_purpose', label: 'Purpose of Travel', type: 'select', required: true, options: ['Tourism', 'Business', 'Medical Treatment', 'Education', 'Family Visit', 'Conference/Event'] },
      { key: 'travel_dates', label: 'Planned Travel Dates', type: 'text', required: true },
      { key: 'sponsor_type', label: 'Sponsor Type', type: 'select', required: true, options: ['Self-Sponsored (Business Owner)', 'Company Sponsored', 'Family Sponsored'] },
      { key: 'monthly_income', label: 'Monthly Business Income (TTD)', type: 'number', required: true },
    ],
  },
  {
    id: 'job_letter',
    title: 'Job Offer / Employment Letter',
    subtitle: 'Hire staff professionally',
    description: 'Formal employment letter compliant with T&T labour law.',
    icon: '📋',
    color: '#E61E2B',
    price_ttd: 0,
    is_free: true,
    category: 'employment',
    fields: [
      { key: 'employer_name', label: 'Employer / Company Name', type: 'text', required: true },
      { key: 'employee_name', label: 'Employee Full Name', type: 'text', required: true },
      { key: 'position', label: 'Job Title / Position', type: 'text', required: true },
      { key: 'salary_ttd', label: 'Monthly Salary (TTD)', type: 'number', required: true },
      { key: 'start_date', label: 'Start Date', type: 'date', required: true },
      { key: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: ['Full-Time Permanent', 'Part-Time', 'Contract', 'Probationary'] },
    ],
  },
  {
    id: 'loan_support_letter',
    title: 'Loan Support Letter',
    subtitle: 'For business or personal loans',
    description: 'Business financial statement to support loan applications at T&T banks and credit unions.',
    icon: '🏛️',
    color: '#F59E0B',
    price_ttd: 100,
    is_free: false,
    category: 'banking',
    fields: [
      { key: 'owner_name', label: 'Full Legal Name', type: 'text', required: true },
      { key: 'business_name', label: 'Business Name', type: 'text', required: true },
      { key: 'loan_amount', label: 'Loan Amount Requested (TTD)', type: 'number', required: true },
      { key: 'loan_purpose', label: 'Purpose of Loan', type: 'text', required: true },
      { key: 'monthly_revenue', label: 'Average Monthly Revenue (TTD)', type: 'number', required: true },
      { key: 'years_in_business', label: 'Years in Business', type: 'number', required: true },
      { key: 'bank_name', label: 'Lending Institution', type: 'text', required: true },
    ],
  },
  {
    id: 'financial_statement',
    title: 'Financial Statement',
    subtitle: 'Profit & Loss for BIR / banks',
    description: 'Simple financial statement from your TriniBuild store data for tax or banking purposes.',
    icon: '📊',
    color: '#0891B2',
    price_ttd: 150,
    is_free: false,
    category: 'banking',
    fields: [
      { key: 'business_name', label: 'Business Name', type: 'text', required: true },
      { key: 'owner_name', label: "Owner's Full Name", type: 'text', required: true },
      { key: 'period', label: 'Statement Period (e.g. Jan 2025 – Dec 2025)', type: 'text', required: true },
      { key: 'total_revenue', label: 'Total Revenue (TTD)', type: 'number', required: true },
      { key: 'total_expenses', label: 'Total Expenses (TTD)', type: 'number', required: true },
      { key: 'bir_number', label: 'BIR Number (optional)', type: 'text', required: false },
    ],
  },
  {
    id: 'vat_certificate',
    title: 'VAT Registration Application',
    subtitle: 'BIR VAT registration support',
    description: 'Supporting documentation for VAT registration with the Board of Inland Revenue.',
    icon: '📝',
    color: '#DC2626',
    price_ttd: 75,
    is_free: false,
    category: 'tax',
    fields: [
      { key: 'business_name', label: 'Business Name', type: 'text', required: true },
      { key: 'owner_name', label: "Owner's Full Name", type: 'text', required: true },
      { key: 'bir_number', label: 'BIR File Number', type: 'text', required: true },
      { key: 'business_address', label: 'Business Address', type: 'text', required: true },
      { key: 'annual_turnover', label: 'Annual Turnover (TTD)', type: 'number', required: true },
      { key: 'registration_date', label: 'Business Registration Date', type: 'date', required: true },
    ],
  },
];

const SYSTEM_PROMPTS: Record<string, string> = {
  proof_of_income: `You are a professional document writer for Trinidad & Tobago businesses. 
Generate a formal Proof of Income letter on behalf of TriniBuild / R&R Digital Solutions Ltd.
The letter should: state the business owner's name, business name, average monthly income in TTD,
reference the income period, note that earnings are from verified e-commerce activity on TriniBuild,
and be signed by the TriniBuild Platform Management team. Use formal British English. Include current date.
Format as a proper business letter with letterhead reference to TriniBuild (trinibuild.com).
DO NOT include any placeholder text — use only the data provided.`,

  bank_account_letter: `Generate a formal Bank Account Reference Letter for a TriniBuild merchant.
The letter supports opening a business bank account at a T&T commercial bank.
Include: business verification, platform membership status, estimated monthly transactions in TTD,
character reference. Use formal British English. Sign as TriniBuild Platform, R&R Digital Solutions Ltd.`,

  visa_support_letter: `Generate a professional Visa Support / Sponsorship Letter for a TriniBuild business owner.
The letter confirms: the person's business on TriniBuild, their income, the travel purpose,
and provides financial sponsorship confirmation. Tailor to the destination country's embassy requirements.
Use formal language. Include R&R Digital Solutions Ltd company details as the issuer.`,

  job_letter: `Generate a formal Job Offer Letter compliant with Trinidad & Tobago labour law.
Include: position details, salary in TTD, start date, employment type, benefits if any,
reporting structure, probation period (if applicable). Reference the Industrial Relations Act where relevant.
Use formal British English. The employer signs as the business owner.`,

  loan_support_letter: `Generate a Business Loan Support Letter for a Trinidad & Tobago bank.
The letter should: describe the business, its revenue on TriniBuild, the loan purpose,
repayment capacity based on monthly revenue, and character reference.
Include financial highlights showing the business can service the loan. Formal British English.`,

  financial_statement: `Generate a simple Profit & Loss Financial Statement for a TriniBuild merchant.
Include: revenue summary, expenses summary, net profit, gross margin percentage.
Format as a proper accounting document with a balance at the bottom.
Note it is an internally prepared statement and advise professional audit for official purposes.`,

  vat_certificate: `Generate a VAT Registration Support Document for the Board of Inland Revenue T&T.
Include: business details, BIR number, turnover confirmation, registration date, reason for registration.
Format as supporting documentation for a VAT registration application. Formal British English.`,
};

export const documentCenterService = {
  getCatalog() {
    return DOCUMENT_CATALOG;
  },

  getDocument(id: string) {
    return DOCUMENT_CATALOG.find(d => d.id === id);
  },

  async generateDocument(
    document_type: string,
    fields: Record<string, string | number>,
    user_id: string
  ): Promise<{ content: string; order_id: string }> {
    const doc = DOCUMENT_CATALOG.find(d => d.id === document_type);
    if (!doc) throw new Error('Document type not found');

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) throw new Error('AI service not configured');

    const systemPrompt = SYSTEM_PROMPTS[document_type] || 'Generate a professional business document.';
    const today = new Date().toLocaleDateString('en-TT', { day: 'numeric', month: 'long', year: 'numeric' });

    const userPrompt = `Generate the document using these details:
Date: ${today}
${Object.entries(fields).map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`).join('\n')}

Generate the complete, print-ready document. No placeholders, no instructions — only the final document text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    if (!content) throw new Error('AI generation failed');

    // Save to database
    const { data: order, error } = await supabase
      .from('document_orders')
      .insert({
        user_id,
        document_type,
        fields,
        generated_content: content,
        status: 'complete',
        is_free: doc.is_free,
        price_ttd: doc.price_ttd,
        paid: doc.is_free,
      })
      .select()
      .single();

    if (error) console.warn('Could not save document order:', error);

    return { content, order_id: order?.id || '' };
  },

  async getUserDocuments(user_id: string) {
    const { data } = await supabase
      .from('document_orders')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  formatDocumentForPrint(content: string, document_type: string): string {
    const doc = DOCUMENT_CATALOG.find(d => d.id === document_type);
    return `
TRINIBUILD PLATFORM — OFFICIAL DOCUMENT
R&R Digital Solutions Ltd | trinibuild.com | info@trinibuild.com
════════════════════════════════════════════════════════════════

${content}

════════════════════════════════════════════════════════════════
Document Type: ${doc?.title || document_type}
Generated: ${new Date().toLocaleString('en-TT')}
Platform: TriniBuild (trinibuild.com)
Note: This document is generated by TriniBuild AI and represents
accurate information provided by the business owner. For legal 
proceedings, obtain a notarized version from a T&T notary public.
════════════════════════════════════════════════════════════════
    `.trim();
  },
};
