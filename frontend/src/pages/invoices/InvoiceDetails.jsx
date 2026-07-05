import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { getInvoiceById, downloadInvoicePdf, emailInvoice, getWhatsAppLink } from '../../api/invoice.api';
import { getPayments, addPayment } from '../../api/payment.api';
import { getCompanySettings } from '../../api/company.api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import {
  ArrowLeft,
  Calendar,
  User,
  Download,
  Mail,
  Share2,
  IndianRupee,
  PlusCircle,
  CreditCard,
  AlertTriangle,
  Loader2,
  Info,
} from 'lucide-react';

// Validation Schema for recording invoice payments
const paymentSchema = (maxAmount) =>
  zod.object({
    amount: zod.coerce
      .number()
      .positive('Payment amount must be greater than 0')
      .max(maxAmount, `Payment amount cannot exceed invoice pending balance (₹${maxAmount.toFixed(2)})`),
    paymentMethod: zod.string().min(1, 'Please select a payment method'),
    transactionId: zod.string().optional(),
    notes: zod.string().optional(),
    paymentDate: zod.string().min(1, 'Please select a payment date'),
  });

const InvoiceDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();

  // State for recording payment popup modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // 1. Retrieve Invoice Details
  const { data: invoiceRes, isLoading: invoiceLoading, error: invoiceError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id),
  });

  const invoice = invoiceRes?.data;

  // 2. Retrieve Payments Applied to this Invoice
  const { data: paymentsRes, isLoading: paymentsLoading } = useQuery({
    queryKey: ['invoicePayments', id],
    queryFn: () => getPayments({ invoiceId: id, limit: 100 }),
    enabled: !!invoice,
  });

  const payments = paymentsRes?.data?.payments || [];

  // 3. Retrieve Company profile configuration (for company header data)
  const { data: companyRes } = useQuery({
    queryKey: ['companySettings'],
    queryFn: getCompanySettings,
  });

  const company = companyRes?.data || {
    companyName: 'RK Event Group',
    email: 'info@rkevent.com',
    phone: '+91 99999 99999',
    address: 'RK Event Headquarters, New Delhi, India',
    website: 'https://rkevent.com',
  };

  // Form setups for recording payments
  const maxBalance = invoice?.pendingAmount || 0;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema(maxBalance)),
    values: {
      amount: maxBalance,
      paymentMethod: 'UPI',
      transactionId: '',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0]
    },
  });

  // Record payment mutation
  const paymentMutation = useMutation({
    mutationFn: addPayment,
    onSuccess: () => {
      toast.success('Payment recorded successfully!');
      queryClient.invalidateQueries(['invoice', id]);
      queryClient.invalidateQueries(['invoicePayments', id]);
      queryClient.invalidateQueries(['dashboardStats']);
      setPayModalOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    },
    onSettled: () => setSubmittingPayment(false),
  });

  const onPaymentSubmit = (data) => {
    setSubmittingPayment(true);
    paymentMutation.mutate({
      invoiceId: id,
      ...data,
    });
  };

  // Trigger PDF Download
  const handleDownloadPdf = async () => {
    const loadingToast = toast.loading('Generating invoice PDF...');
    try {
      const pdfBlob = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF downloaded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to download invoice PDF', { id: loadingToast });
    }
  };

  // Trigger Email Dispatch
  const handleSendEmail = async () => {
    const loadingToast = toast.loading('Dispatching email to customer...');
    try {
      await emailInvoice(id);
      toast.success('Invoice email successfully sent!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch email', { id: loadingToast });
    }
  };

  // Trigger WhatsApp share
  const handleWhatsAppShare = async () => {
    try {
      const res = await getWhatsAppLink(id);
      const link = res.data.whatsappLink;
      window.open(link, '_blank');
    } catch (err) {
      toast.error('Failed to generate WhatsApp sharing details');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val || 0);
  };

  if (invoiceLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-light animate-spin" />
      </div>
    );
  }

  if (invoiceError) {
    return (
      <div className="text-center text-slate-500 py-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
        <p className="font-semibold text-slate-350">Failed to load invoice file</p>
        <p className="text-sm mt-1">{invoiceError.message}</p>
        <Link to="/invoices" className="text-brand-light text-sm mt-4 hover:underline block">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and back button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Link to="/invoices" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3.5">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {invoice.invoiceNumber}
              </h2>
              <Badge>{invoice.status}</Badge>
            </div>
            <p className="text-slate-400 text-sm mt-1">Issued: {new Date(invoice.invoiceDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex flex-wrap gap-2.5">
          <Button variant="glass" onClick={handleDownloadPdf} className="rounded-xl px-4 py-2 flex items-center space-x-2 text-xs">
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </Button>
          <Button variant="glass" onClick={handleSendEmail} className="rounded-xl px-4 py-2 flex items-center space-x-2 text-xs">
            <Mail className="w-4 h-4" />
            <span>Email Client</span>
          </Button>
          <Button variant="glass" onClick={handleWhatsAppShare} className="rounded-xl px-4 py-2 flex items-center space-x-2 text-xs hover:text-emerald-400">
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </Button>
          {invoice.pendingAmount > 0 && (
            <Button onClick={() => setPayModalOpen(true)} className="rounded-xl px-4 py-2 flex items-center space-x-2 text-xs">
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Payment</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Invoice Items Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing Client Profile Card */}
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From (Company Settings)</p>
              <h4 className="text-sm font-bold text-white">{company.companyName}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{company.address}</p>
              <p className="text-xs text-slate-400">Email: {company.email}</p>
              <p className="text-xs text-slate-400">Phone: {company.phone}</p>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billed To (Customer Profile)</p>
              {invoice.customer ? (
                <>
                  <h4 className="text-sm font-bold text-white">{invoice.customer.name}</h4>
                  {invoice.customer.companyName && (
                    <p className="text-xs text-slate-300 font-semibold">{invoice.customer.companyName}</p>
                  )}
                  <p className="text-xs text-slate-400 leading-relaxed">{invoice.customer.address}</p>
                  <p className="text-xs text-slate-400">Email: {invoice.customer.email}</p>
                  <p className="text-xs text-slate-400">Phone: {invoice.customer.phone}</p>
                </>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-300 font-semibold">Client profile deleted/missing</span>
                </div>
              )}
            </div>
          </Card>

          {/* Line Items table list */}
          <Card className="p-0">
            <div className="p-5 border-b border-white/5">
              <h3 className="text-base font-bold text-white">Event Items Breakdown</h3>
            </div>
            <div className="p-5">
              <Table>
                <THead>
                  <TR>
                    <TH>Item Title</TH>
                    <TH>Description</TH>
                    <TH>Qty</TH>
                    <TH>Price</TH>
                    <TH className="text-right">Total Amount</TH>
                  </TR>
                </THead>
                <TBody>
                  {invoice.items.map((item) => (
                    <TR key={item._id}>
                      <TD className="font-semibold text-white">{item.title}</TD>
                      <TD className="text-slate-400 text-xs">{item.description || 'N/A'}</TD>
                      <TD className="text-slate-300">{item.quantity}</TD>
                      <TD className="text-slate-300 font-sans">{formatCurrency(item.price)}</TD>
                      <TD className="text-right font-bold text-slate-200 font-sans">
                        {formatCurrency(item.quantity * item.price)}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </Card>

          {/* Payment Ledger / History */}
          <Card className="p-0">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-4.5 h-4.5 text-brand-light" />
                <span>Payment Transactions Ledger</span>
              </h3>
              <Badge variant="slate">Total Payments: {payments.length}</Badge>
            </div>
            <div className="p-5">
              {paymentsLoading ? (
                <div className="space-y-2.5">
                  <div className="h-10 bg-white/[0.01] animate-pulse rounded-xl" />
                  <div className="h-10 bg-white/[0.01] animate-pulse rounded-xl" />
                </div>
              ) : payments.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 text-center">
                  No payment transactions recorded for this invoice yet.
                </div>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Amount</TH>
                      <TH>Payment Mode</TH>
                      <TH>Notes</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {payments.map((pay) => (
                      <TR key={pay._id}>
                        <TD className="text-slate-300 text-xs">
                          {new Date(pay.paymentDate || pay.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TD>
                        <TD className="font-extrabold text-emerald-400 font-sans">
                          {formatCurrency(pay.amount)}
                        </TD>
                        <TD className="font-bold text-white text-xs uppercase">{pay.paymentMethod}</TD>
                        <TD className="text-slate-400 text-xs">
                          {pay.notes || '-'} {pay.transactionId ? `(Txn: ${pay.transactionId})` : ''}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Billing summary sheet */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-base font-bold text-white pb-3 border-b border-white/5"> Tally Summary</h3>
            <div className="space-y-3.5 text-sm font-sans">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="text-white font-semibold">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Discount:</span>
                <span className="text-rose-450 font-semibold">-{formatCurrency(invoice.discount)}</span>
              </div>
              <div className="border-t border-white/5 pt-3.5 flex justify-between text-slate-400">
                <span>Grand Total:</span>
                <span className="text-white font-bold">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Paid Amount:</span>
                <span className="text-emerald-400 font-semibold">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="border-t border-white/5 pt-3.5 flex justify-between font-bold text-white">
                <span>Balance Due:</span>
                <span className="text-lg text-brand-light font-extrabold">
                  {formatCurrency(invoice.pendingAmount)}
                </span>
              </div>
            </div>
          </Card>

          {invoice.notes && (
            <Card className="bg-white/[0.005] border border-white/5 p-4.5">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-brand-light" />
                <span>Invoice Terms</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed italic">{invoice.notes}</p>
            </Card>
          )}
        </div>
      </div>

      {/* Record Payment Popup Modal Form */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title="Record Payment Transaction"
        size="md"
      >
        <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-5">
          <Input
            {...register('amount')}
            type="number"
            step="0.01"
            label="Payment Amount (₹) *"
            placeholder="0.00"
            icon={IndianRupee}
            error={errors.amount?.message}
          />

          <Input
            {...register('paymentDate')}
            type="date"
            label="Payment Date *"
            icon={Calendar}
            error={errors.paymentDate?.message}
          />

          <Select
            {...register('paymentMethod')}
            label="Payment Mode *"
            options={[
              { label: 'UPI / NetBanking', value: 'UPI' },
              { label: 'Card Payment (Credit/Debit)', value: 'Card' },
              { label: 'Cash Payment', value: 'Cash' },
              { label: 'Bank Check / Draft', value: 'Check' },
              { label: 'Direct Wire Transfer', value: 'Wire' },
            ]}
            error={errors.paymentMethod?.message}
          />

          <Input
            {...register('transactionId')}
            label="Transaction ID / Check Number"
            placeholder="e.g. TXN998822"
            icon={CreditCard}
            error={errors.transactionId?.message}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="UPI reference number or physical collection details..."
              className="w-full px-4 py-2.5 rounded-2xl glass-input text-white text-sm outline-none placeholder:text-slate-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <Button variant="secondary" onClick={() => setPayModalOpen(false)} disabled={submittingPayment}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submittingPayment}>
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetails;
