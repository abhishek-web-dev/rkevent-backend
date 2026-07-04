import api from './axios';

export const getCompanySettings = async () => {
  const response = await api.get('/api/company');
  return response.data;
};

export const updateCompanySettings = async (formData) => {
  const response = await api.put('/api/company', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
