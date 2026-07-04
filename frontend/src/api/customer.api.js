import api from './axios';

export const getCustomers = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const response = await api.get('/api/customers', {
    params: { page, limit, search },
  });
  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await api.get(`/api/customers/${id}`);
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await api.post('/api/customers', customerData);
  return response.data;
};

export const updateCustomer = async (id, customerData) => {
  const response = await api.put(`/api/customers/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await api.delete(`/api/customers/${id}`);
  return response.data;
};

export const getTrashCustomers = async ({ page = 1, limit = 10 } = {}) => {
  const response = await api.get('/api/customers/trash', {
    params: { page, limit },
  });
  return response.data;
};

export const restoreCustomer = async (id) => {
  const response = await api.post(`/api/customers/${id}/restore`);
  return response.data;
};

export const deleteCustomerPermanent = async (id) => {
  const response = await api.delete(`/api/customers/${id}/permanent`);
  return response.data;
};
