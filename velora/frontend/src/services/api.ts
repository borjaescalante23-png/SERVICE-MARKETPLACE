import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('velora_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('velora_token')
      localStorage.removeItem('velora_refresh_token')
      localStorage.removeItem('velora_user')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
}

export const tutorsApi = {
  list: (params?: Record<string, string>) => api.get('/tutors', { params }),
  getById: (id: string) => api.get(`/tutors/${id}`),
  getMe: () => api.get('/tutors/me'),
  update: (data: any) => api.patch('/tutors/me', data),
  activate: (data: any) => api.post('/tutors/me/activate', data),
}

export const classesApi = {
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.patch(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
}

export const bookingsApi = {
  create: (data: any) => api.post('/bookings', data),
  list: (params?: Record<string, string>) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
}

export const favoritesApi = {
  add: (tutorId: string) => api.post('/favorites', { tutorId }),
  remove: (tutorId: string) => api.delete(`/favorites/${tutorId}`),
  list: () => api.get('/favorites'),
}

export default api
