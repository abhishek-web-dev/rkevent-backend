import api from './axios';

export const getPayments = async ({ page = 1, limit = 10, invoiceId = '' } = {}) => {
  const response = await api.get('/api/payments', {
    params: { page, limit, invoiceId },
  });
  return response.data;
};

export const addPayment = async (paymentData) => {
  const response = await api.post('/api/payments', paymentData);
  return response.data;
};
