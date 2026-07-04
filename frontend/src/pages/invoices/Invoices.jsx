import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, deleteInvoice, downloadInvoicePdf, emailInvoice } from '../../api/invoice.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  FileText,
  Trash2,
  Trash,
  AlertCircle,
  Download,
  Mail,
  Send,
  Eye,
} from 'lucide-react';

const Invoices = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Confirmation state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Simple search debounce timeout helper
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);

    const timeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 400);
    return () => clearTimeout(timeout);
  };

  // Fetch active invoices
  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, status, debouncedSearch],
    queryFn: () => getInvoices({ page, limit: 10, status, search: debouncedSearch }),
  });

  const invoices = data?.data?.invoices || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  // Soft delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      toast.success('Invoice soft-deleted successfully');
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardStats']);
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Delete operation failed');
    },
    onSettled: () => setDeleting(false),
  });

  const handleDeleteConfirm = () => {
    if (!deleteId) return;
    setDeleting(true);
    deleteMutation.mutate(deleteId);
  };

  // Trigger PDF Download
  const handleDownloadPdf = async (id, number) => {
    const loadingToast = toast.loading('Generating invoice PDF...');
    try {
      const pdfBlob = await downloadInvoicePdf(id);
      const url = window.URL.createObjectURL(new Blob([pdfBlob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('PDF downloaded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to download invoice PDF', { id: loadingToast });
    }
  };

  // Trigger Email Dispatch
  const handleSendEmail = async (id) => {
    const loadingToast = toast.loading('Dispatching email to customer...');
    try {
      await emailInvoice(id);
      toast.success('Invoice email successfully sent!', { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch email', { id: loadingToast });
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val || 0);
  };

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Partial', value: 'Partial' },
    { label: 'Overdue', value: 'Overdue' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and create invoice button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Invoices</h2>
          <p className="text-slate-400 text-sm mt-1">Review event records, balances, and trigger PDF delivery.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/invoices/trash">
            <Button variant="glass" className="rounded-2xl flex items-center space-x-2">
              <Trash className="w-4.5 h-4.5 text-slate-400" />
              <span>Trash Bin</span>
            </Button>
          </Link>
          <Link to="/invoices/create">
            <Button className="rounded-2xl flex items-center space-x-2">
              <Plus className="w-4.5 h-4.5" />
              <span>Create Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-0">
        {/* Search bar and Filters */}
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5">
          <div className="w-full md:max-w-md">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by invoice number..."
              icon={Search}
              className="rounded-2xl py-2.5"
            />
          </div>
          <div className="w-full md:w-56">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={statusOptions}
              className="rounded-2xl py-2.5"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3.5">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-white/[0.01] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">Error loading invoice database</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">No active invoices found</p>
            <p className="text-sm mt-1">Try relaxing filters or click "Create Invoice" to start.</p>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice #</TH>
                  <TH>Customer</TH>
                  <TH>Date Issued</TH>
                  <TH>Total</TH>
                  <TH>Balance Due</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {invoices.map((inv) => (
                  <TR key={inv._id}>
                    <TD className="font-semibold text-brand-light">
                      <Link to={`/invoices/details/${inv._id}`} className="hover:text-fuchsia-400">
                        {inv.invoiceNumber}
                      </Link>
                    </TD>
                    <TD className="font-semibold text-slate-200">
                      {inv.customer?.name || <span className="italic text-slate-500">Deleted Customer</span>}
                    </TD>
                    <TD className="text-slate-400 text-xs">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </TD>
                    <TD className="font-bold text-slate-200 font-sans">
                      {formatCurrency(inv.totalAmount)}
                    </TD>
                    <TD className="font-semibold text-slate-300 font-sans">
                      {formatCurrency(inv.pendingAmount)}
                    </TD>
                    <TD>
                      <Badge>{inv.status}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end space-x-1.5">
                        <Link to={`/invoices/details/${inv._id}`}>
                          <Button
                            variant="glass"
                            size="sm"
                            className="rounded-xl p-2 hover:text-brand-light hover:border-brand-light/30"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleDownloadPdf(inv._id, inv.invoiceNumber)}
                          className="rounded-xl p-2 hover:text-emerald-400 hover:border-emerald-500/30"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => handleSendEmail(inv._id)}
                          className="rounded-xl p-2 hover:text-indigo-400 hover:border-indigo-500/30"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setDeleteId(inv._id)}
                          className="rounded-xl p-2 hover:text-rose-450 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Confirm Soft Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Are you sure you want to soft delete this invoice? It will be sent to the **Trash Bin**, from which it can be restored or permanently purged.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={deleting}>
              Delete Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Invoices;
