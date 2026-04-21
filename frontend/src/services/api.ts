import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me'),
};

export const professionalsApi = {
  list: (params?: any) => api.get('/professionals', { params }),
  getById: (id: string) => api.get(`/professionals/${id}`),
  getMyProfile: () => api.get('/professionals/me'),
  updateBio: (bio: string) => api.patch('/professionals/me/bio', { bio }),
  addExperience: (formData: FormData) => api.post('/professionals/me/experience', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteExperience: (entryId: string) => api.delete(`/professionals/me/experience/${entryId}`),
  uploadDocument: (formData: FormData) => api.post('/professionals/me/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getReviews: (professionalId: string, params?: any) =>
    api.get(`/professionals/${professionalId}/reviews`, { params }),
};

export const bookingsApi = {
  list: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  pay: (id: string) => api.post(`/bookings/${id}/pay`),
  accept: (id: string) => api.post(`/bookings/${id}/accept`),
  start: (id: string) => api.post(`/bookings/${id}/start`),
  complete: (id: string) => api.post(`/bookings/${id}/complete`),
  cancel: (id: string, reason: string) => api.post(`/bookings/${id}/cancel`, { reason }),
  dispute: (id: string, data: any) => api.post(`/bookings/${id}/dispute`, data),
};

export const reviewsApi = {
  create: (bookingId: string, data: any) => api.post(`/bookings/${bookingId}/review`, data),
};

export const messagesApi = {
  list: (bookingId: string) => api.get(`/bookings/${bookingId}/messages`),
  send: (bookingId: string, content: string) => api.post(`/bookings/${bookingId}/messages`, { content }),
};

export const servicesApi = {
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.patch(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  pendingProfessionals: () => api.get('/admin/professionals/pending'),
  approveProfessional: (id: string) => api.post(`/admin/professionals/${id}/approve`),
  rejectProfessional: (id: string, reason: string) =>
    api.post(`/admin/professionals/${id}/reject`, { reason }),
  suspendUser: (id: string, reason: string) => api.post(`/admin/users/${id}/suspend`, { reason }),
  disputes: () => api.get('/admin/disputes'),
  resolveDispute: (id: string, data: any) => api.post(`/admin/disputes/${id}/resolve`, data),
  fraudEvents: () => api.get('/admin/fraud-events'),
};
