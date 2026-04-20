// Trinidad & Tobago Tax Compliance & Accounting System
// Automatic tax tracking for TriniBuild merchants (Paid tiers only)

export interface TrinidadTaxRates {
  vat_rate: number; // 12.5% in Trinidad
  corporation_tax_rate: number; // 30% standard
  green_fund_levy: number; // 0.3% on gross sales
  business_levy_threshold: number; // TTD $360,000 threshold
  business_levy_rate: number; // 0.2% on gross sales > threshold
}

export const TRINIDAD_TAX_RATES: TrinidadTaxRates = {
  vat_rate: 12.5,
  corporation_tax_rate: 30.0,
  green_fund_levy: 0.3,
  business_levy_threshold: 360000,
  business_levy_rate: 0.2
};

export interface TaxCalculation {
  period: string; // YYYY-MM
  gross_sales: number;
  vat_collected: number;
  vat_paid: number;
  net_vat_due: number;
  green_fund_levy: number;
  business_levy: number;
  total_tax_liability: number;
  net_profit: number;
  corporation_tax_estimate: number;
}

export interface InventoryTransaction {
  id: string;
  store_id: string;
  product_id: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'return';
  quantity: number;
  unit_cost: number;
  selling_price: number;
  vat_amount: number;
  transaction_date: string;
  customer_id?: string;
  supplier_id?: string;
  notes?: string;
}

export interface MonthlyTaxReport {
  store_id: string;
  period: string;
  calculations: TaxCalculation;
  transactions: InventoryTransaction[];
  ready_for_filing: boolean;
  generated_at: string;
}

/**
 * Calculate VAT on a sale
 */
export const calculateVAT = (amount: number, includesVAT: boolean = false): {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
} => {
  if (includesVAT) {
    // Amount already includes VAT - extract it
    const netAmount = amount / (1 + TRINIDAD_TAX_RATES.vat_rate / 100);
    const vatAmount = amount - netAmount;
    return {
      netAmount,
      vatAmount,
      grossAmount: amount
    };
  } else {
    // Add VAT to amount
    const vatAmount = amount * (TRINIDAD_TAX_RATES.vat_rate / 100);
    return {
      netAmount: amount,
      vatAmount,
      grossAmount: amount + vatAmount
    };
  }
};

/**
 * Calculate monthly tax liability
 */
export const calculateMonthlyTax = (
  sales: InventoryTransaction[],
  purchases: InventoryTransaction[],
  period: string
): TaxCalculation => {
  // Calculate gross sales
  const grossSales = sales.reduce((sum, sale) => {
    const { grossAmount } = calculateVAT(sale.selling_price * sale.quantity, false);
    return sum + grossAmount;
  }, 0);

  // VAT collected on sales
  const vatCollected = sales.reduce((sum, sale) => {
    const { vatAmount } = calculateVAT(sale.selling_price * sale.quantity, false);
    return sum + vatAmount;
  }, 0);

  // VAT paid on purchases (can be claimed back)
  const vatPaid = purchases.reduce((sum, purchase) => {
    const { vatAmount } = calculateVAT(purchase.unit_cost * purchase.quantity, true);
    return sum + vatAmount;
  }, 0);

  // Net VAT due (collected - paid)
  const netVatDue = Math.max(0, vatCollected - vatPaid);

  // Green Fund Levy (0.3% on gross sales)
  const greenFundLevy = grossSales * (TRINIDAD_TAX_RATES.green_fund_levy / 100);

  // Business Levy (0.2% on gross sales over $360,000)
  let businessLevy = 0;
  if (grossSales > TRINIDAD_TAX_RATES.business_levy_threshold) {
    businessLevy = grossSales * (TRINIDAD_TAX_RATES.business_levy_rate / 100);
  }

  // Total tax liability for the month
  const totalTaxLiability = netVatDue + greenFundLevy + businessLevy;

  // Calculate net profit (simplified)
  const costOfGoodsSold = sales.reduce((sum, sale) => {
    return sum + (sale.unit_cost * sale.quantity);
  }, 0);
  const netProfit = grossSales - costOfGoodsSold - totalTaxLiability;

  // Estimate corporation tax (30% on net profit, paid annually)
  const corporationTaxEstimate = Math.max(0, netProfit * (TRINIDAD_TAX_RATES.corporation_tax_rate / 100));

  return {
    period,
    gross_sales: grossSales,
    vat_collected: vatCollected,
    vat_paid: vatPaid,
    net_vat_due: netVatDue,
    green_fund_levy: greenFundLevy,
    business_levy: businessLevy,
    total_tax_liability: totalTaxLiability,
    net_profit: netProfit,
    corporation_tax_estimate: corporationTaxEstimate
  };
};

/**
 * Generate monthly tax report for BIR (Board of Inland Revenue)
 */
export const generateMonthlyTaxReport = async (
  storeId: string,
  year: number,
  month: number
): Promise<MonthlyTaxReport> => {
  const period = `${year}-${String(month).padStart(2, '0')}`;
  
  // Fetch transactions from Supabase (implement actual query)
  const sales: InventoryTransaction[] = []; // TODO: Query sales
  const purchases: InventoryTransaction[] = []; // TODO: Query purchases

  const calculations = calculateMonthlyTax(sales, purchases, period);

  return {
    store_id: storeId,
    period,
    calculations,
    transactions: [...sales, ...purchases],
    ready_for_filing: true,
    generated_at: new Date().toISOString()
  };
};

/**
 * Export tax report for accountant/BIR
 */
export const exportTaxReportCSV = (report: MonthlyTaxReport): string => {
  const lines: string[] = [];
  
  // Header
  lines.push('Trinidad & Tobago Tax Report');
  lines.push(`Period: ${report.period}`);
  lines.push(`Store ID: ${report.store_id}`);
  lines.push(`Generated: ${report.generated_at}`);
  lines.push('');
  
  // Summary
  lines.push('TAX SUMMARY');
  lines.push('Category,Amount (TTD)');
  lines.push(`Gross Sales,${report.calculations.gross_sales.toFixed(2)}`);
  lines.push(`VAT Collected,${report.calculations.vat_collected.toFixed(2)}`);
  lines.push(`VAT Paid,${report.calculations.vat_paid.toFixed(2)}`);
  lines.push(`Net VAT Due,${report.calculations.net_vat_due.toFixed(2)}`);
  lines.push(`Green Fund Levy (0.3%),${report.calculations.green_fund_levy.toFixed(2)}`);
  lines.push(`Business Levy (0.2%),${report.calculations.business_levy.toFixed(2)}`);
  lines.push(`Total Tax Liability,${report.calculations.total_tax_liability.toFixed(2)}`);
  lines.push(`Net Profit,${report.calculations.net_profit.toFixed(2)}`);
  lines.push(`Corporation Tax Estimate (30%),${report.calculations.corporation_tax_estimate.toFixed(2)}`);
  lines.push('');
  
  // Transactions
  lines.push('TRANSACTIONS');
  lines.push('Date,Type,Product ID,Quantity,Unit Cost,Selling Price,VAT,Notes');
  report.transactions.forEach(tx => {
    lines.push([
      tx.transaction_date,
      tx.type,
      tx.product_id,
      tx.quantity,
      tx.unit_cost.toFixed(2),
      tx.selling_price.toFixed(2),
      tx.vat_amount.toFixed(2),
      tx.notes || ''
    ].join(','));
  });
  
  return lines.join('\n');
};

/**
 * Tax filing deadlines for Trinidad & Tobago
 */
export interface TaxDeadline {
  type: 'vat' | 'corporation' | 'business_levy' | 'green_fund';
  description: string;
  due_date: string; // Day of month
  frequency: 'monthly' | 'quarterly' | 'annually';
}

export const TRINIDAD_TAX_DEADLINES: TaxDeadline[] = [
  {
    type: 'vat',
    description: 'VAT Return Filing',
    due_date: '15th of following month',
    frequency: 'monthly'
  },
  {
    type: 'business_levy',
    description: 'Business Levy Filing',
    due_date: '15th of following month',
    frequency: 'monthly'
  },
  {
    type: 'green_fund',
    description: 'Green Fund Levy Filing',
    due_date: '15th of following month',
    frequency: 'monthly'
  },
  {
    type: 'corporation',
    description: 'Corporation Tax Filing',
    due_date: '4 months after fiscal year end',
    frequency: 'annually'
  }
];

/**
 * Check if merchant is VAT registered (threshold: TTD $500,000 annually)
 */
export const shouldRegisterForVAT = (annualSales: number): boolean => {
  return annualSales >= 500000;
};

/**
 * Get upcoming tax deadlines
 */
export const getUpcomingDeadlines = (): Array<{ deadline: TaxDeadline; dueDate: Date }> => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  
  return TRINIDAD_TAX_DEADLINES
    .filter(d => d.frequency === 'monthly')
    .map(deadline => ({
      deadline,
      dueDate: nextMonth
    }));
};
