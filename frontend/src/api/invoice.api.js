import api from './axios';

export const getInvoices = async ({ page = 1, limit = 10, status = '', search = '' } = {}) => {
  const response = await api.get('/api/invoices', {
    params: { page, limit, status, search },
  });
  return response.data;
};

export const getInvoiceById = async (id) => {
  const response = await api.get(`/api/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (invoiceData) => {
  const response = await api.post('/api/invoices', invoiceData);
  return response.data;
};

export const updateInvoice = async (id, invoiceData) => {
  const response = await api.put(`/api/invoices/${id}`, invoiceData);
  return response.data;
};

export const deleteInvoice = async (id) => {
  const response = await api.delete(`/api/invoices/${id}`);
  return response.data;
};

export const downloadInvoicePdf = async (id) => {
  const response = await api.get(`/api/invoices/${id}/pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

export const emailInvoice = async (id) => {
  const response = await api.post(`/api/invoices/${id}/email`);
  return response.data;
};

export const getWhatsAppLink = async (id) => {
  const response = await api.get(`/api/invoices/${id}/share-whatsapp`);
  return response.data;
};

export const getTrashInvoices = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get('/api/invoices/trash', {
    params: { page, limit },
  });
  return response.data;
};

export const restoreInvoice = async (id) => {
  const response = await api.post(`/api/invoices/${id}/restore`);
  return response.data;
};

export const deleteInvoicePermanent = async (id) => {
  const response = await api.delete(`/api/invoices/${id}/permanent`);
  return response.data;
};
