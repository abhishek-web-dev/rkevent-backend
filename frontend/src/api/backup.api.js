import api from './axios';

export const triggerBackup = async () => {
  const response = await api.post('/api/system/backup');
  return response.data;
};

export const getBackups = async () => {
  const response = await api.get('/api/system/backups');
  return response.data;
};

export const restoreBackup = async (filename) => {
  const response = await api.post('/api/system/restore', { file: filename });
  return response.data;
};
