import apiClient from './apiClient';

export const createCrudService = (resource) => ({
  getAll: (params = '') =>
    apiClient(`/${resource}${params}`),

  getById: (id) =>
    apiClient(`/${resource}/${id}`),

  create: (data) =>
    apiClient(`/${resource}`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiClient(`/${resource}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  remove: (id) =>
    apiClient(`/${resource}/${id}`, {
      method: 'DELETE'
    })
});
