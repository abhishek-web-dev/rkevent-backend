import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrashCustomers, restoreCustomer, deleteCustomerPermanent } from '../../api/customer.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, RotateCcw, AlertTriangle, XCircle, Trash } from 'lucide-react';

const CustomerTrash = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  
  // Dialog confirmation states
  const [restoreId, setRestoreId] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [purgeId, setPurgeId] = useState(null);
  const [purging, setPurging] = useState(false);

  // Fetch trash records
  const { data, isLoading, error } = useQuery({
    queryKey: ['trashCustomers', page],
    queryFn: () => getTrashCustomers({ page, limit: 10 }),
  });

  const trashList = data?.data?.customers || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: restoreCustomer,
    onSuccess: () => {
      toast.success('Customer profile restored successfully');
      queryClient.invalidateQueries(['trashCustomers']);
      queryClient.invalidateQueries(['customers']);
      setRestoreId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Restore failed');
    },
    onSettled: () => setRestoring(false),
  });

  // Permanent purge mutation
  const purgeMutation = useMutation({
    mutationFn: deleteCustomerPermanent,
    onSuccess: () => {
      toast.success('Customer profile permanently deleted');
      queryClient.invalidateQueries(['trashCustomers']);
      setPurgeId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Purge failed');
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and back button */}
      <div className="flex items-center space-x-3">
        <Link to="/customers" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Customer Trash Bin</h2>
          <p className="text-slate-400 text-sm mt-1">Restore soft-deleted profiles or permanently erase records.</p>
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
            <p className="text-sm mt-1">Deleted customers will appear here.</p>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <THead>
                <TR>
                  <TH>Customer Name</TH>
                  <TH>Company</TH>
                  <TH>Deleted Date</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {trashList.map((cust) => (
                  <TR key={cust._id}>
                    <TD className="font-semibold text-white">{cust.name}</TD>
                    <TD className="text-slate-400">{cust.companyName || 'Individual'}</TD>
                    <TD className="text-slate-400 text-xs">
                      {new Date(cust.deletedAt).toLocaleString()}
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setRestoreId(cust._id)}
                          className="rounded-xl p-2 hover:text-emerald-400 hover:border-emerald-500/30"
                        >
                          <RotateCcw className="w-4.5 h-4.5" />
                        </Button>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setPurgeId(cust._id)}
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
        title="Restore Customer Profile"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            Are you sure you want to restore this customer? The profile will return to the active database list and invoice links will be reactivated.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setRestoreId(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestoreConfirm} isLoading={restoring}>
              Restore Profile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Purge Dialog */}
      <Modal
        isOpen={!!purgeId}
        onClose={() => setPurgeId(null)}
        title="Permanently Delete Customer"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wide">Danger Zone</p>
              <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">
                This action is irreversible. The customer and all of their historical profile details will be permanently erased from the system database.
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

export default CustomerTrash;
