import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrashInvoices, restoreInvoice, deleteInvoicePermanent } from '../../api/invoice.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, RotateCcw, AlertTriangle, XCircle, Trash } from 'lucide-react';

const InvoiceTrash = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Dialog confirmation states
  const [restoreId, setRestoreId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [purgeId, setPurgeId] = useState(null);
  const [purging, setPurging] = useState(false);

  // Fetch trash records
  const { data, isLoading, error } = useQuery({
    queryKey: ['trashInvoices', page],
    queryFn: () => getTrashInvoices({ page, limit: 10 }),
  });

  const trashList = data?.data?.invoices || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: restoreInvoice,
    onSuccess: () => {
      toast.success('Invoice restored successfully!');
      queryClient.invalidateQueries(['trashInvoices']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['dashboardStats']);
      setRestoreId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to restore invoice');
    },
    onSettled: () => setRestoring(false),
  });

  // Permanent delete mutation
  const purgeMutation = useMutation({
    mutationFn: deleteInvoicePermanent,
    onSuccess: () => {
      toast.success('Invoice permanently deleted from DB');
      queryClient.invalidateQueries(['trashInvoices']);
      setPurgeId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Purge operation failed');
    },
    onSettled: () => setPurging(false),
  });

  const handleRestoreConfirm = () => {
    if (!restoreId) return;
    setRestoring(true);
    restoreMutation.mutate(restoreId);
  };

  const handlePurgeConfirm = () => {
    if (!purgeId) return;
    setPurging(true);
    purgeMutation.mutate(purgeId);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and back button */}
      <div className="flex items-center space-x-3">
        <Link to="/invoices" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Invoice Trash Bin</h2>
          <p className="text-slate-400 text-sm mt-1">Restore soft-deleted invoices or permanently purge files.</p>
        </div>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-3.5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-12 bg-white/[0.01] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-slate-500">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">Error loading deleted items</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : trashList.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Trash className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">Trash Bin is empty</p>
            <p className="text-sm mt-1">Deleted invoices will appear here.</p>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <THead>
                <TR>
                  <TH>Invoice #</TH>
                  <TH>Customer</TH>
                  <TH>Total</TH>
                  <TH>Deleted Date</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {trashList.map((inv) => (
                  <TR key={inv._id}>
                    <TD className="font-semibold text-slate-200">{inv.invoiceNumber}</TD>
                    <TD className="text-slate-300">{inv.customer?.name || 'Deleted Customer'}</TD>
                    <TD className="font-bold text-slate-200 font-sans">{formatCurrency(inv.totalAmount)}</TD>
                    <TD className="text-slate-400 text-xs">
                      {new Date(inv.deletedAt).toLocaleString()}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setRestoreId(inv._id)}
                          className="rounded-xl p-2 hover:text-emerald-400 hover:border-emerald-500/30"
                        >
                          <RotateCcw className="w-4.5 h-4.5" />
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setPurgeId(inv._id)}
                          className="rounded-xl p-2 hover:text-rose-450 hover:border-rose-500/30"
                        >
                          <XCircle className="w-4.5 h-4.5" />
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

      {/* Restore Dialog */}
      <Modal
        isOpen={!!restoreId}
        onClose={() => setRestoreId(null)}
        title="Restore Invoice"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Are you sure you want to restore this invoice? It will return to the active database list and update dashboard aggregations.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setRestoreId(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestoreConfirm} isLoading={restoring}>
              Restore Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purge Dialog */}
      <Modal
        isOpen={!!purgeId}
        onClose={() => setPurgeId(null)}
        title="Permanently Delete Invoice"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">Danger Zone</p>
              <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">
                This action is irreversible. The invoice sheet and all recorded payments ledger items will be permanently deleted from the system.
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setPurgeId(null)} disabled={purging}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handlePurgeConfirm} isLoading={purging}>
              Erase Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceTrash;
