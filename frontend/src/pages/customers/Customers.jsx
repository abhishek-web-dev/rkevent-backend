import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, deleteCustomer } from '../../api/customer.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import Pagination from '../../components/tables/Pagination';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Trash,
  AlertCircle,
  Building,
  Mail,
  Phone,
} from 'lucide-react';

const Customers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search input change handler with simple timeout debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1); // Reset page to first
    
    // Set a debounce timeout
    const timeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 400);
    return () => clearTimeout(timeout);
  };

  // Fetch active customers
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', page, debouncedSearch],
    queryFn: () => getCustomers({ page, limit: 10, search: debouncedSearch }),
  });

  const activeCustomers = data?.data?.customers || [];
  const pagination = data?.data?.pagination || { total: 0, pages: 1 };

  // Soft delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success('Customer soft-deleted successfully');
      queryClient.invalidateQueries(['customers']);
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header and top buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Customers</h2>
          <p className="text-slate-400 text-sm mt-1">Manage event planners, entities, and clients.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/customers/trash">
            <Button variant="glass" className="rounded-2xl flex items-center space-x-2">
              <Trash className="w-4.5 h-4.5 text-slate-400" />
              <span>Trash Bin</span>
            </Button>
          </Link>
          <Link to="/customers/add">
            <Button className="rounded-2xl flex items-center space-x-2">
              <Plus className="w-4.5 h-4.5" />
              <span>Add Customer</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid listing and Search filter */}
      <Card className="p-0">
        <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5">
          {/* Search bar */}
          <div className="w-full md:max-w-md">
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search customers by name, company, email..."
              icon={Search}
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
            <p className="font-semibold text-slate-300">Error loading customer files</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        ) : activeCustomers.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-slate-300">No active customer records</p>
            <p className="text-sm mt-1">Click "Add Customer" to start registering clients.</p>
          </div>
        ) : (
          <div className="p-6">
            <Table>
              <THead>
                <TR>
                  <TH>Customer Name</TH>
                  <TH>Company</TH>
                  <TH>Email</TH>
                  <TH>Phone</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {activeCustomers.map((cust) => (
                  <TR key={cust._id}>
                    <TD className="font-semibold text-white">{cust.name}</TD>
                    <TD className="flex items-center space-x-2 text-slate-400">
                      {cust.companyName ? (
                        <>
                          <Building className="w-3.5 h-3.5" />
                          <span>{cust.companyName}</span>
                        </>
                      ) : (
                        <span className="italic text-slate-600">Individual</span>
                      )}
                    </TD>
                    <TD>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.email}</span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{cust.phone}</span>
                      </div>
                    </TD>
                    <TD className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link to={`/customers/edit/${cust._id}`}>
                          <Button
                            variant="glass"
                            size="sm"
                            className="rounded-xl p-2 hover:text-brand-light hover:border-brand-light/30"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={() => setDeleteId(cust._id)}
                          className="rounded-xl p-2 hover:text-rose-400 hover:border-rose-500/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            
            {/* Pagination Controls */}
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
            Are you sure you want to delete this customer? The record will be sent to the **Trash Bin**, from which it can be restored or permanently purged.
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} isLoading={deleting}>
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
