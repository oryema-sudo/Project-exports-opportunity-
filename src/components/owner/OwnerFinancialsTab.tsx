import React, { useState } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  DollarSign, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { OwnerOverviewMetrics, OwnerRevenueData, BusinessExpense, PaymentRecord, ExpenseCategory } from '../../types';
import { api } from '../../services/api';

interface OwnerFinancialsTabProps {
  overview: OwnerOverviewMetrics | null;
  revenueData: OwnerRevenueData | null;
  expenses: BusinessExpense[];
  timeframe: '30d' | '90d' | '365d';
  setTimeframe: (tf: '30d' | '90d' | '365d') => void;
  expenseCategoryFilter: string;
  setExpenseCategoryFilter: (cat: string) => void;
  onOpenAddExpense: () => void;
  onDeleteExpense: (id: string, vendor: string) => void;
  onExportFinancials: () => void;
  onRefresh: () => void;
}

export const OwnerFinancialsTab: React.FC<OwnerFinancialsTabProps> = ({
  overview,
  revenueData,
  expenses,
  timeframe,
  setTimeframe,
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  onOpenAddExpense,
  onDeleteExpense,
  onExportFinancials,
  onRefresh
}) => {
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const handleRefundPayment = async (paymentId: string, amountUgx: number) => {
    const reason = window.prompt(`Confirm refund of UGX ${amountUgx.toLocaleString()}? Enter refund justification:`);
    if (reason === null) return;

    try {
      setRefundingId(paymentId);
      const res = await fetch(`/api/owner/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Customer requested refund' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Refund failed');
      }
      alert('Payment successfully refunded and audited in the cryptographic ledger.');
      onRefresh();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    } finally {
      setRefundingId(null);
    }
  };

  const filteredExpenses = expenseCategoryFilter === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.category === expenseCategoryFilter);

  const categories: ExpenseCategory[] = [
    'Cloud Infrastructure',
    'UCDA Field Operations',
    'Telecom & Mobile Money',
    'Legal & Compliance',
    'Salaries & Contractors',
    'Office & Admin',
    'Marketing',
    'Other'
  ];

  return (
    <div id="owner-financials-container" className="space-y-6">
      
      {/* Timeframe selector and action bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">Accounting Window:</span>
          <div className="flex rounded-lg bg-stone-950 p-1 border border-stone-800 text-xs">
            {(['30d', '90d', '365d'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  timeframe === tf 
                    ? 'bg-amber-500 text-stone-950 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tf === '30d' ? 'Last 30 Days' : tf === '90d' ? 'Quarter (90d)' : 'Year (365d)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddExpense}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={onExportFinancials}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Cash Collections & Revenue Streams Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-1.5">
          <span className="text-stone-400 text-xs font-medium">Gross Cash Collected ({timeframe})</span>
          <div className="text-2xl font-black text-emerald-400">
            UGX {(revenueData?.summary.totalCashReceived || overview?.cashReceivedUgx || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400">
            Realized cash settlements from customer organizations
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-1.5">
          <span className="text-stone-400 text-xs font-medium">Operating Expenses Logged ({timeframe})</span>
          <div className="text-2xl font-black text-stone-100">
            UGX {(revenueData?.summary.totalExpenses || overview?.totalExpensesUgx || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400">
            Across {expenses.length} operating ledger entries
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-1.5">
          <span className="text-stone-400 text-xs font-medium">Net Operating Profit ({timeframe})</span>
          <div className={`text-2xl font-black ${(revenueData?.summary.totalNetProfit || overview?.operatingProfitUgx || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            UGX {(revenueData?.summary.totalNetProfit || overview?.operatingProfitUgx || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400">
            Gross Collections minus Verified Expenses
          </div>
        </div>
      </div>

      {/* 2. Business Expenses Ledger */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Platform Operating Expenses Ledger</span>
            </h3>
            <p className="text-xs text-stone-400">
              Audited operational costs: cloud hosting, mobile money aggregator fees, compliance audits, and contractor fees.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Category:</span>
            <select
              value={expenseCategoryFilter}
              onChange={e => setExpenseCategoryFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Vendor & Description</th>
                <th className="py-2.5 px-3">Amount (UGX)</th>
                <th className="py-2.5 px-3">Recurrence</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                    No expense entries found in this category.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">
                      {expense.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300 border border-stone-700">
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-100">{expense.vendor}</div>
                      <div className="text-[11px] text-stone-400">{expense.description}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-100">
                      UGX {expense.amount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      {expense.recurring ? (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Monthly Recurring
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400">One-time</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onDeleteExpense(expense.id, expense.vendor)}
                        className="text-stone-400 hover:text-red-400 p-1 rounded hover:bg-stone-800 transition-colors"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Live Payment Transactions & Refund Controls */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Payment Transactions & Settlement Ledger</span>
            </h3>
            <p className="text-xs text-stone-400">
              Authoritative transaction logs directly mapped to Mobile Money and Bank settlements.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Organization & Description</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Amount (UGX)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {(!overview?.recentPayments || overview.recentPayments.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                    No payment transaction records found.
                  </td>
                </tr>
              ) : (
                overview.recentPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px]">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-stone-100">{payment.organizationName || 'Customer'}</div>
                      <div className="text-[11px] text-stone-400">{payment.description}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-stone-300">{payment.paymentMethod}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                      UGX {Number(payment.amountUgx).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        payment.status === 'successful' 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : payment.status === 'refunded'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {payment.status === 'successful' && (
                        <button
                          onClick={() => handleRefundPayment(payment.id, Number(payment.amountUgx))}
                          disabled={refundingId === payment.id}
                          className="px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-[11px] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                          title="Authorize refund"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-400" />
                          <span>Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
