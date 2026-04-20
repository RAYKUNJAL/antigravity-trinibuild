'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, Calendar, TrendingUp, AlertCircle, 
  CheckCircle, FileText, DollarSign, PieChart 
} from 'lucide-react';

interface TaxReport {
  id: string;
  period: string; // YYYY-MM
  grossSales: number;
  vatCollected: number;
  vatPaid: number;
  netVatDue: number;
  greenFundLevy: number;
  businessLevy: number;
  totalTaxLiability: number;
  netProfit: number;
  corporationTaxEstimate: number;
  readyForFiling: boolean;
  generatedAt: string;
}

interface TaxDeadline {
  type: 'vat' | 'business_levy' | 'green_fund' | 'corporation';
  description: string;
  dueDate: string;
  amount?: number;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'paid';
}

export default function MerchantTaxDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-04');
  const [report, setReport] = useState<TaxReport | null>(null);
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaxData();
  }, [selectedPeriod]);

  const loadTaxData = async () => {
    setLoading(true);
    // TODO: Replace with actual Supabase query
    setTimeout(() => {
      setReport({
        id: '1',
        period: selectedPeriod,
        grossSales: 45000,
        vatCollected: 5000,
        vatPaid: 1200,
        netVatDue: 3800,
        greenFundLevy: 135,
        businessLevy: 0,
        totalTaxLiability: 3935,
        netProfit: 8565,
        corporationTaxEstimate: 2569.50,
        readyForFiling: true,
        generatedAt: new Date().toISOString()
      });

      setDeadlines([
        {
          type: 'vat',
          description: 'VAT Return Filing',
          dueDate: '2026-05-15',
          amount: 3800,
          status: 'due_soon'
        },
        {
          type: 'green_fund',
          description: 'Green Fund Levy',
          dueDate: '2026-05-15',
          amount: 135,
          status: 'due_soon'
        }
      ]);
      
      setLoading(false);
    }, 500);
  };

  const exportToBIR = () => {
    if (!report) return;
    
    const csv = generateBIRReport(report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BIR_Tax_Report_${report.period}.csv`;
    a.click();
  };

  const generateBIRReport = (report: TaxReport): string => {
    return `Trinidad & Tobago Tax Report
Period: ${report.period}
Generated: ${new Date(report.generatedAt).toLocaleDateString()}

TAX SUMMARY
Gross Sales,TTD $${report.grossSales.toFixed(2)}
VAT Collected,TTD $${report.vatCollected.toFixed(2)}
VAT Paid,TTD $${report.vatPaid.toFixed(2)}
Net VAT Due,TTD $${report.netVatDue.toFixed(2)}
Green Fund Levy,TTD $${report.greenFundLevy.toFixed(2)}
Business Levy,TTD $${report.businessLevy.toFixed(2)}
Total Tax Liability,TTD $${report.totalTaxLiability.toFixed(2)}
Net Profit,TTD $${report.netProfit.toFixed(2)}
Corporation Tax Estimate,TTD $${report.corporationTaxEstimate.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8">
        <div className="max-w-7xl mx-auto">
          {/* Skeleton Loader */}
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            🇹🇹 Tax Dashboard
          </h1>
          <p className="text-gray-600">
            Automatic Trinidad tax tracking - No accountant needed!
          </p>
        </motion.div>

        {/* Period Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-4"
        >
          <label className="text-sm font-semibold text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg font-semibold focus:outline-none focus:border-red-500 transition-colors"
          >
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-02">February 2026</option>
            <option value="2026-01">January 2026</option>
          </select>
          
          <button
            onClick={exportToBIR}
            className="ml-auto flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download size={20} />
            Export for BIR
          </button>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<DollarSign />}
            label="Total Tax Due"
            value={`TTD $${report?.totalTaxLiability.toFixed(2)}`}
            change="+12.5% from last month"
            color="red"
            delay={0.2}
          />
          <StatCard
            icon={<TrendingUp />}
            label="Net Profit"
            value={`TTD $${report?.netProfit.toFixed(2)}`}
            change="+8.3% from last month"
            color="green"
            delay={0.3}
          />
          <StatCard
            icon={<FileText />}
            label="Gross Sales"
            value={`TTD $${report?.grossSales.toFixed(2)}`}
            change="+15.2% from last month"
            color="blue"
            delay={0.4}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tax Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              Tax Breakdown
            </h2>
            
            <div className="space-y-4">
              <TaxLine
                label="VAT Collected"
                amount={report?.vatCollected || 0}
                sublabel="12.5% on sales"
                color="green"
              />
              <TaxLine
                label="VAT Paid"
                amount={report?.vatPaid || 0}
                sublabel="On purchases (claimable)"
                color="blue"
              />
              <TaxLine
                label="Net VAT Due"
                amount={report?.netVatDue || 0}
                sublabel="Collected - Paid"
                color="red"
                bold
              />
              
              <div className="border-t-2 border-gray-200 my-4"></div>
              
              <TaxLine
                label="Green Fund Levy"
                amount={report?.greenFundLevy || 0}
                sublabel="0.3% on gross sales"
                color="green"
              />
              <TaxLine
                label="Business Levy"
                amount={report?.businessLevy || 0}
                sublabel="0.2% (if > $360k)"
                color="orange"
              />
              
              <div className="border-t-2 border-gray-900 my-4"></div>
              
              <TaxLine
                label="TOTAL TAX DUE"
                amount={report?.totalTaxLiability || 0}
                sublabel={`Due: May 15, 2026`}
                color="red"
                bold
                large
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Corporation Tax Estimate (Annual):</strong> TTD ${report?.corporationTaxEstimate.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                30% on net profit - Paid annually (4 months after fiscal year end)
              </p>
            </div>
          </motion.div>

          {/* Tax Calendar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="text-red-600" />
              <h2 className="text-2xl font-black text-gray-900">
                Deadlines
              </h2>
            </div>

            <div className="space-y-4">
              {deadlines.map((deadline, index) => (
                <DeadlineCard
                  key={index}
                  deadline={deadline}
                  delay={0.7 + index * 0.1}
                />
              ))}
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                <div>
                  <p className="text-sm font-bold text-yellow-900">
                    Payment Due Soon
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    2 tax payments due in 25 days. Mark your calendar!
                  </p>
                </div>
              </div>
            </div>

            {report?.readyForFiling && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-green-600 mt-0.5" size={20} />
                  <div>
                    <p className="text-sm font-bold text-green-900">
                      Ready to File
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your report is complete and BIR-ready. Export above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Save Money Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 p-6 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black mb-2">
                💰 Saving You $400-700 TTD/month!
              </h3>
              <p className="text-red-100">
                No accountant needed for basic tax tracking. No QuickBooks subscription required.
              </p>
            </div>
            <PieChart size={64} className="opacity-50" />
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, change, color, delay }: any) {
  const colors = {
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-gray-200 transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 mb-2">{value}</p>
      <p className="text-xs text-green-600 font-semibold">{change}</p>
    </motion.div>
  );
}

// Tax Line Component
function TaxLine({ label, amount, sublabel, color, bold, large }: any) {
  const colors = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    orange: 'text-orange-600'
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`${bold ? 'font-black' : 'font-semibold'} ${large ? 'text-xl' : 'text-base'} text-gray-900`}>
          {label}
        </p>
        <p className="text-sm text-gray-500">{sublabel}</p>
      </div>
      <p className={`${bold ? 'font-black' : 'font-bold'} ${large ? 'text-2xl' : 'text-lg'} ${colors[color]}`}>
        ${amount.toFixed(2)}
      </p>
    </div>
  );
}

// Deadline Card Component
function DeadlineCard({ deadline, delay }: { deadline: TaxDeadline; delay: number }) {
  const statusColors = {
    upcoming: 'bg-blue-50 border-blue-200 text-blue-700',
    due_soon: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    overdue: 'bg-red-50 border-red-200 text-red-700',
    paid: 'bg-green-50 border-green-200 text-green-700'
  };

  const statusIcons = {
    upcoming: '📅',
    due_soon: '⚠️',
    overdue: '🚨',
    paid: '✅'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`p-4 rounded-lg border-2 ${statusColors[deadline.status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{statusIcons[deadline.status]}</span>
        <p className="text-xs font-bold uppercase">{deadline.status.replace('_', ' ')}</p>
      </div>
      <p className="font-bold text-sm mb-1">{deadline.description}</p>
      <p className="text-xs mb-2">Due: {new Date(deadline.dueDate).toLocaleDateString()}</p>
      {deadline.amount && (
        <p className="text-sm font-black">TTD ${deadline.amount.toFixed(2)}</p>
      )}
    </motion.div>
  );
}
