// TriniBuild Financial AI Agent System
// Autonomous tax handling, revenue distribution, compliance monitoring

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'operating' | 'tax_reserve' | 'affiliate_payout' | 'driver_payout' | 'merchant_payout';
  balance: number;
  currency: 'TTD' | 'USD';
  bank_details?: {
    institution: string;
    account_number: string;
    routing_number?: string;
  };
}

export interface RevenueStream {
  id: string;
  source: 'subscription' | 'delivery_commission' | 'marketplace_boost' | 'template_sales' | 'professional_services';
  amount: number;
  currency: 'TTD';
  merchant_id?: string;
  transaction_date: string;
  tax_collected?: number;
}

export interface RevenueDistribution {
  total_revenue: number;
  distributions: {
    operating_account: number; // Platform operations
    tax_reserve: number; // VAT, Corporation Tax, etc.
    affiliate_payouts: number; // Affiliate commissions
    driver_payouts: number; // Driver earnings
    merchant_payouts: number; // Merchant marketplace sales
  };
  calculated_at: string;
}

/**
 * Revenue Distribution Rules
 */
export const REVENUE_SPLIT_RULES = {
  // Subscription revenue
  subscription: {
    operating: 70, // 70% to operations
    tax_reserve: 30 // 30% for taxes (VAT 12.5% + Corp Tax ~17.5%)
  },
  
  // Delivery commission
  delivery: {
    operating: 100, // We keep 100% of our commission
    driver: 0 // Driver portion already paid separately
  },
  
  // Marketplace boost ads
  marketplace_boost: {
    operating: 70,
    tax_reserve: 30
  },
  
  // Template marketplace (30% platform commission)
  template_sales: {
    operating: 21, // 70% of our 30% cut (21% total)
    tax_reserve: 9, // 30% of our 30% cut (9% total)
    creator: 70 // Creator gets 70% (paid separately)
  },
  
  // Professional services
  professional_services: {
    operating: 50, // 50% to operations
    tax_reserve: 20, // 20% for taxes
    contractor: 30 // 30% to contractor (if outsourced)
  }
};

/**
 * Calculate revenue distribution
 */
export const calculateRevenueDistribution = (
  revenues: RevenueStream[]
): RevenueDistribution => {
  const distribution: RevenueDistribution = {
    total_revenue: 0,
    distributions: {
      operating_account: 0,
      tax_reserve: 0,
      affiliate_payouts: 0,
      driver_payouts: 0,
      merchant_payouts: 0
    },
    calculated_at: new Date().toISOString()
  };

  revenues.forEach(revenue => {
    distribution.total_revenue += revenue.amount;

    const rules = REVENUE_SPLIT_RULES[revenue.source as keyof typeof REVENUE_SPLIT_RULES];
    if (!rules) return;

    if (revenue.source === 'subscription') {
      distribution.distributions.operating_account += revenue.amount * (rules.operating / 100);
      distribution.distributions.tax_reserve += revenue.amount * (rules.tax_reserve / 100);
    } else if (revenue.source === 'delivery_commission') {
      distribution.distributions.operating_account += revenue.amount;
    } else if (revenue.source === 'marketplace_boost') {
      distribution.distributions.operating_account += revenue.amount * (rules.operating / 100);
      distribution.distributions.tax_reserve += revenue.amount * (rules.tax_reserve / 100);
    } else if (revenue.source === 'template_sales') {
      const templateRules = rules as typeof REVENUE_SPLIT_RULES.template_sales;
      distribution.distributions.operating_account += revenue.amount * (templateRules.operating / 100);
      distribution.distributions.tax_reserve += revenue.amount * (templateRules.tax_reserve / 100);
      // Creator payout tracked separately
    } else if (revenue.source === 'professional_services') {
      const serviceRules = rules as typeof REVENUE_SPLIT_RULES.professional_services;
      distribution.distributions.operating_account += revenue.amount * (serviceRules.operating / 100);
      distribution.distributions.tax_reserve += revenue.amount * (serviceRules.tax_reserve / 100);
      // Contractor payout tracked separately
    }
  });

  return distribution;
};

/**
 * Tax Liability Tracker
 */
export interface TaxLiability {
  period: string; // YYYY-MM
  vat_liability: number; // VAT collected - VAT paid
  corporation_tax_estimate: number; // 30% on net profit
  green_fund_levy: number; // 0.3% on gross sales
  business_levy: number; // 0.2% on gross sales > $360k
  total_due: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
}

/**
 * Calculate platform tax liability
 */
export const calculatePlatformTax = (
  grossRevenue: number,
  expensesPaid: number,
  vatCollected: number,
  vatPaid: number,
  period: string
): TaxLiability => {
  // VAT liability
  const vatLiability = Math.max(0, vatCollected - vatPaid);

  // Green Fund Levy (0.3% on gross revenue)
  const greenFundLevy = grossRevenue * 0.003;

  // Business Levy (0.2% if > $360k/month)
  const businessLevy = grossRevenue > 360000 ? grossRevenue * 0.002 : 0;

  // Net profit
  const netProfit = grossRevenue - expensesPaid - vatLiability - greenFundLevy - businessLevy;

  // Corporation Tax (30% on net profit)
  const corporationTaxEstimate = Math.max(0, netProfit * 0.30);

  // Calculate due date (15th of following month)
  const [year, month] = period.split('-').map(Number);
  const dueDate = new Date(year, month, 15); // Next month, 15th

  return {
    period,
    vat_liability: vatLiability,
    corporation_tax_estimate: corporationTaxEstimate,
    green_fund_levy: greenFundLevy,
    business_levy: businessLevy,
    total_due: vatLiability + greenFundLevy + businessLevy,
    due_date: dueDate.toISOString(),
    paid: false
  };
};

/**
 * AI Financial Agent Actions
 */
export interface AIAgentAction {
  id: string;
  type: 'distribute_revenue' | 'pay_tax' | 'pay_affiliate' | 'pay_driver' | 'flag_compliance_issue';
  description: string;
  amount?: number;
  from_account: string;
  to_account?: string;
  status: 'pending' | 'approved' | 'executed' | 'failed';
  created_at: string;
  executed_at?: string;
  requires_approval: boolean;
  approval_threshold: number; // TTD amount requiring manual approval
}

export const AI_AGENT_THRESHOLDS = {
  auto_approve_under: 10000, // Auto-approve transactions under TTD $10,000
  flag_for_review_over: 50000, // Flag transactions over TTD $50,000
  require_dual_approval_over: 100000 // Require 2 approvals over TTD $100,000
};

/**
 * AI Agent: Automatic Revenue Distribution
 */
export const scheduleRevenueDistribution = (
  revenues: RevenueStream[],
  accounts: FinancialAccount[]
): AIAgentAction[] => {
  const distribution = calculateRevenueDistribution(revenues);
  const actions: AIAgentAction[] = [];

  // Operating account distribution
  if (distribution.distributions.operating_account > 0) {
    actions.push({
      id: `dist-op-${Date.now()}`,
      type: 'distribute_revenue',
      description: `Transfer TTD $${distribution.distributions.operating_account.toFixed(2)} to Operating Account`,
      amount: distribution.distributions.operating_account,
      from_account: 'revenue_holding',
      to_account: 'operating',
      status: distribution.distributions.operating_account < AI_AGENT_THRESHOLDS.auto_approve_under ? 'approved' : 'pending',
      created_at: new Date().toISOString(),
      requires_approval: distribution.distributions.operating_account >= AI_AGENT_THRESHOLDS.auto_approve_under,
      approval_threshold: AI_AGENT_THRESHOLDS.auto_approve_under
    });
  }

  // Tax reserve distribution
  if (distribution.distributions.tax_reserve > 0) {
    actions.push({
      id: `dist-tax-${Date.now()}`,
      type: 'distribute_revenue',
      description: `Transfer TTD $${distribution.distributions.tax_reserve.toFixed(2)} to Tax Reserve Account`,
      amount: distribution.distributions.tax_reserve,
      from_account: 'revenue_holding',
      to_account: 'tax_reserve',
      status: 'approved', // Tax reserves always auto-approved
      created_at: new Date().toISOString(),
      requires_approval: false,
      approval_threshold: AI_AGENT_THRESHOLDS.auto_approve_under
    });
  }

  return actions;
};

/**
 * AI Agent: Automatic Tax Payment
 */
export const scheduleTaxPayment = (
  liability: TaxLiability,
  taxReserveAccount: FinancialAccount
): AIAgentAction | null => {
  // Check if payment is due (within 5 days of deadline)
  const dueDate = new Date(liability.due_date);
  const today = new Date();
  const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue > 5) return null; // Not due yet

  // Check if sufficient funds
  if (taxReserveAccount.balance < liability.total_due) {
    return {
      id: `tax-flag-${Date.now()}`,
      type: 'flag_compliance_issue',
      description: `URGENT: Insufficient funds for tax payment. Need TTD $${liability.total_due.toFixed(2)}, have TTD $${taxReserveAccount.balance.toFixed(2)}`,
      amount: liability.total_due,
      from_account: 'tax_reserve',
      status: 'pending',
      created_at: new Date().toISOString(),
      requires_approval: true,
      approval_threshold: 0
    };
  }

  // Schedule payment
  return {
    id: `tax-pay-${Date.now()}`,
    type: 'pay_tax',
    description: `Pay ${liability.period} tax liability to BIR (VAT: TTD $${liability.vat_liability.toFixed(2)}, Green Fund: TTD $${liability.green_fund_levy.toFixed(2)}, Business Levy: TTD $${liability.business_levy.toFixed(2)})`,
    amount: liability.total_due,
    from_account: 'tax_reserve',
    to_account: 'trinidad_bir',
    status: liability.total_due < AI_AGENT_THRESHOLDS.flag_for_review_over ? 'approved' : 'pending',
    created_at: new Date().toISOString(),
    requires_approval: liability.total_due >= AI_AGENT_THRESHOLDS.flag_for_review_over,
    approval_threshold: AI_AGENT_THRESHOLDS.flag_for_review_over
  };
};

/**
 * AI Agent: Compliance Monitoring
 */
export interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'tax_deadline' | 'insufficient_reserve' | 'unusual_transaction' | 'regulatory_change';
  description: string;
  action_required: string;
  deadline?: string;
  resolved: boolean;
}

export const checkCompliance = (
  liabilities: TaxLiability[],
  accounts: FinancialAccount[]
): ComplianceIssue[] => {
  const issues: ComplianceIssue[] = [];
  const today = new Date();

  // Check upcoming tax deadlines
  liabilities.filter(l => !l.paid).forEach(liability => {
    const dueDate = new Date(liability.due_date);
    const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= 0) {
      issues.push({
        id: `overdue-${liability.period}`,
        severity: 'critical',
        type: 'tax_deadline',
        description: `Tax payment for ${liability.period} is OVERDUE by ${Math.abs(daysUntilDue)} days`,
        action_required: `Pay TTD $${liability.total_due.toFixed(2)} immediately to BIR`,
        deadline: liability.due_date,
        resolved: false
      });
    } else if (daysUntilDue <= 5) {
      issues.push({
        id: `due-soon-${liability.period}`,
        severity: 'high',
        type: 'tax_deadline',
        description: `Tax payment for ${liability.period} due in ${daysUntilDue} days`,
        action_required: `Prepare TTD $${liability.total_due.toFixed(2)} for BIR payment`,
        deadline: liability.due_date,
        resolved: false
      });
    }
  });

  // Check tax reserve sufficiency
  const taxReserve = accounts.find(a => a.type === 'tax_reserve');
  const upcomingTaxTotal = liabilities
    .filter(l => !l.paid)
    .reduce((sum, l) => sum + l.total_due, 0);

  if (taxReserve && taxReserve.balance < upcomingTaxTotal) {
    issues.push({
      id: 'insufficient-reserve',
      severity: 'critical',
      type: 'insufficient_reserve',
      description: `Tax reserve insufficient. Need TTD $${upcomingTaxTotal.toFixed(2)}, have TTD $${taxReserve.balance.toFixed(2)}`,
      action_required: `Transfer TTD $${(upcomingTaxTotal - taxReserve.balance).toFixed(2)} to tax reserve immediately`,
      resolved: false
    });
  }

  return issues;
};

/**
 * AI Agent: Daily Automated Tasks
 */
export const runDailyAutomation = async (): Promise<{
  revenue_distributed: boolean;
  taxes_checked: boolean;
  compliance_issues: ComplianceIssue[];
  actions_taken: AIAgentAction[];
}> => {
  // TODO: Fetch actual data from database
  const revenues: RevenueStream[] = [];
  const accounts: FinancialAccount[] = [];
  const liabilities: TaxLiability[] = [];

  // Distribute revenue
  const distributionActions = scheduleRevenueDistribution(revenues, accounts);

  // Check tax payments
  const taxReserve = accounts.find(a => a.type === 'tax_reserve')!;
  const taxActions = liabilities
    .map(l => scheduleTaxPayment(l, taxReserve))
    .filter(a => a !== null) as AIAgentAction[];

  // Check compliance
  const complianceIssues = checkCompliance(liabilities, accounts);

  return {
    revenue_distributed: distributionActions.length > 0,
    taxes_checked: true,
    compliance_issues: complianceIssues,
    actions_taken: [...distributionActions, ...taxActions]
  };
};

/**
 * Export financial summary for admin dashboard
 */
export interface FinancialSummary {
  period: string;
  total_revenue: number;
  account_balances: Record<string, number>;
  tax_liabilities: {
    current_month: number;
    next_month_estimate: number;
    annual_estimate: number;
  };
  pending_actions: number;
  compliance_status: 'good' | 'warning' | 'critical';
  last_updated: string;
}

export const generateFinancialSummary = (
  revenues: RevenueStream[],
  accounts: FinancialAccount[],
  liabilities: TaxLiability[],
  actions: AIAgentAction[]
): FinancialSummary => {
  const distribution = calculateRevenueDistribution(revenues);
  const complianceIssues = checkCompliance(liabilities, accounts);

  // Determine compliance status
  let complianceStatus: 'good' | 'warning' | 'critical' = 'good';
  if (complianceIssues.some(i => i.severity === 'critical')) {
    complianceStatus = 'critical';
  } else if (complianceIssues.some(i => i.severity === 'high' || i.severity === 'medium')) {
    complianceStatus = 'warning';
  }

  return {
    period: new Date().toISOString().slice(0, 7),
    total_revenue: distribution.total_revenue,
    account_balances: accounts.reduce((acc, account) => {
      acc[account.type] = account.balance;
      return acc;
    }, {} as Record<string, number>),
    tax_liabilities: {
      current_month: liabilities.find(l => !l.paid)?.total_due || 0,
      next_month_estimate: distribution.distributions.tax_reserve,
      annual_estimate: distribution.distributions.tax_reserve * 12
    },
    pending_actions: actions.filter(a => a.status === 'pending').length,
    compliance_status: complianceStatus,
    last_updated: new Date().toISOString()
  };
};
