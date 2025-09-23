import { laravelClient } from './client';

export const patientsApi = {
  async getAll() {
    const res = await laravelClient.get('/patients');
    return res.data;
  },
  async list(params) {
    const res = await laravelClient.get('/patients', { params });
    // If paginated, Laravel returns { data: [...], links, meta }
    // If not, it returns an array. Normalize to { data, meta }
    if (Array.isArray(res.data)) {
      return { data: res.data, meta: null };
    }
    return { data: res.data.data, meta: res.data.meta };
  },
  async getById(id) {
    const res = await laravelClient.get(`/patients/${id}`);
    // Laravel Resource wraps single items in { data: {...} }
    return res.data?.data ?? res.data;
  },
};
