import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../../api/payment.api';
import Card from '../../components/ui/Card';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import Badge from '../../components/ui/Badge';
import { AlertCircle, CreditCard, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Payments = () => {
  const [page, setPage] = useState(1);

  // Fetch all payment transactions
  const { data, isLoading, error } = useQuery({
    queryKey: ['globalPayments', page],
    queryFn: () => getPayments({ page, limit: 10 }),
  });

  const payments = data?.data?.payments || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Payments Ledger</h2>
        <p className="text-slate-400 text-sm mt-1">Review all income transactions, UPI details, and receipts.</p>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-white/[0.01] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">Error loading payment ledger</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">No transactions recorded</p>
            <p className="text-sm mt-1">Payments recorded against invoices will appear here.</p>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice #</TH>
                  <TH>Customer</TH>
                  <TH>Payment Method</TH>
                  <TH>Transaction ID</TH>
                  <TH>Notes</TH>
                  <TH>Date Recorded</TH>
                  <TH className="text-right">Amount Paid</TH>
                </TR>
              </THead>
              <TBody>
                {payments.map((pay) => (
                  <TR key={pay._id}>
                    <TD className="font-bold text-brand-light">
                      {pay.invoiceId ? (
                        <Link
                          to={`/invoices/details/${pay.invoiceId._id || pay.invoiceId}`}
                          className="hover:text-fuchsia-400 flex items-center space-x-1"
                        >
                          <span>{pay.invoiceId.invoiceNumber || 'View Invoice'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="italic text-slate-500">N/A</span>
                      )}
                    </TD>
                    <TD className="font-semibold text-slate-200">
                      {pay.invoiceId?.customer?.name || (
                        <span className="italic text-slate-500">Deleted Customer</span>
                      )}
                    </TD>
                    <TD>
                      <Badge variant="slate">{pay.paymentMethod}</Badge>
                    </TD>
                    <TD className="font-mono text-xs text-slate-400">
                      {pay.transactionId || <span className="text-slate-600">-</span>}
                    </TD>
                    <TD className="text-slate-400 text-xs truncate max-w-[160px]">
                      {pay.notes || '-'}
                    </TD>
                    <TD className="text-slate-400 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(pay.createdAt).toLocaleDateString()}</span>
                      </div>
                    </TD>
                    <TD className="text-right font-extrabold text-emerald-400 font-sans">
                      {formatCurrency(pay.amount)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <Pagination
              page={page}
              pages={pagination.pages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Payments;
