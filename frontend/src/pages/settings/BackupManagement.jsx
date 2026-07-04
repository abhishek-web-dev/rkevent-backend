import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBackups, triggerBackup, restoreBackup } from '../../api/backup.api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../../components/tables/Table';
import SettingsTabs from '../../components/layout/SettingsTabs';
import toast from 'react-hot-toast';
import { Database, PlusCircle, RotateCcw, AlertTriangle, Info, ShieldCheck, Loader2 } from 'lucide-react';

const BackupManagement = () => {
  const queryClient = useQueryClient();
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoring, setRestoring] = useState(false);
  const [creating, setCreating] = useState(false);

  // 1. Fetch Backups
  const { data: backupsRes, isLoading, error } = useQuery({
    queryKey: ['systemBackups'],
    queryFn: getBackups,
  });

  const backupList = backupsRes?.data || [];

  // Create backup mutation
  const createMutation = useMutation({
    mutationFn: triggerBackup,
    onSuccess: (res) => {
      toast.success(`Backup generated successfully: ${res.data.file}`);
      queryClient.invalidateQueries(['systemBackups']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate backup');
    },
    onSettled: () => setCreating(false),
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: restoreBackup,
    onSuccess: () => {
      toast.success('System database successfully restored!');
      queryClient.invalidateQueries(['dashboardStats']);
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['customers']);
      setRestoreFile(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Restoration failed');
    },
    onSettled: () => setRestoring(false),
  });

  const handleCreateBackup = () => {
    setCreating(true);
    createMutation.mutate();
  };

  const handleRestoreConfirm = () => {
    if (!restoreFile) return;
    setRestoring(true);
    restoreMutation.mutate(restoreFile);
  };

  // Helper to parse date from YYYY-MM-DD-HH-mm-backup.json
  const parseBackupDate = (filename) => {
    try {
      const parts = filename.split('-');
      if (parts.length >= 5) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const hour = parts[3];
        const minute = parts[4];
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toLocaleString();
      }
    } catch (_) {}
    return 'Unknown';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h2>
          <p className="text-slate-400 text-sm mt-1">Configure company profiles, active prefixes, and user details.</p>
        </div>
        <Button
          onClick={handleCreateBackup}
          isLoading={creating}
          className="rounded-2xl flex items-center space-x-2 text-xs py-2 px-4 shadow shadow-brand/20 self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Generate Backup</span>
        </Button>
      </div>

      <SettingsTabs />

      {/* Database back up ledger */}
      <Card className="p-0">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-4.5 h-4.5 text-brand-light" />
            <span>Database Backup History Logs</span>
          </h3>
        </div>

        <div className="p-5">
          <div className="mb-6 p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start space-x-3">
            <Info className="w-5 h-5 text-brand-light shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 leading-relaxed">
              Snapshots contain full tables for users, settings, invoices, customers, and payments. Backups are stored locally as structural JSON configurations.
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3.5">
              <div className="h-12 bg-white/[0.01] animate-pulse rounded-xl" />
              <div className="h-12 bg-white/[0.01] animate-pulse rounded-xl" />
            </div>
          ) : error ? (
            <div className="text-center text-slate-500 py-6">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
              <p className="font-semibold text-slate-350">Failed to load system backups</p>
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          ) : backupList.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              <Database className="w-10 h-10 text-slate-600 mx-auto mb-4" />
              <p className="font-semibold text-slate-350">No backups registered yet</p>
              <p className="text-xs mt-1">Click "Generate Backup" to save your first snapshot.</p>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Backup Filename</TH>
                  <TH>Date Generated</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {backupList.map((file) => (
                  <TR key={file}>
                    <TD className="font-mono text-xs text-slate-200">{file}</TD>
                    <TD className="text-slate-400 text-xs">{parseBackupDate(file)}</TD>
                    <TD className="text-right">
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => setRestoreFile(file)}
                        className="rounded-xl px-3 py-1.5 hover:text-brand-light hover:border-brand-light/30 flex items-center space-x-1 ml-auto"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Restore System</span>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </Card>

      {/* Restore Confirmation Dialog Modal */}
      <Modal
        isOpen={!!restoreFile}
        onClose={() => setRestoreFile(null)}
        title="Restore Database Snapshot"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wide">Critical Operation Warning</h4>
              <p className="text-[11px] text-amber-300 mt-1 leading-relaxed">
                Restoring database from snapshot **{restoreFile}** will overwrite all active invoices, customer details, and payment histories with the file's data. Active sessions are kept.
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-xs font-medium">Are you sure you want to proceed with the restoration?</p>

          <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
            <Button variant="secondary" onClick={() => setRestoreFile(null)} disabled={restoring}>
              Cancel
            </Button>
            <Button onClick={handleRestoreConfirm} isLoading={restoring} className="shadow shadow-brand/20">
              Confirm Restore
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BackupManagement;
