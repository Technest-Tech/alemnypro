import axios from 'axios';
import { clearAuth } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('alemnypro_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const locale = localStorage.getItem('alemnypro_locale') || 'ar';
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

// Handle auth errors globally — clear auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        clearAuth(); // clears both localStorage AND cookies
        const path = window.location.pathname;
        if (path.includes('/admin')) {
          window.location.href = '/admin/login';
        } else if (path.includes('/dashboard')) {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;


// ─── Public API ─────────────────────────────────────────────────────────────

export const publicApi = {
  searchTutors: (params: Record<string, string>) =>
    api.get('/public/search/tutors', { params }),
  getFeaturedTutors: () =>
    api.get('/public/tutors/featured'),
  getTutor: (slug: string) =>
    api.get(`/public/tutors/${slug}`),
  getCategories: () =>
    api.get('/public/categories'),
  getSubjects: () =>
    api.get('/public/subjects'),
  getSubjectsByCategory: (slug: string) =>
    api.get(`/public/subjects/${slug}`),
  searchSubjects: (q: string) =>
    api.get('/public/subjects/search', { params: { q } }),
  getSearchCategories: () =>
    api.get('/public/search/categories'),
  getGovernorates: () =>
    api.get('/public/locations/governorates'),
  getCities: (governorateId: number) =>
    api.get(`/public/locations/cities/${governorateId}`),
  getNeighborhoods: (cityId: number) =>
    api.get(`/public/locations/neighborhoods/${cityId}`),
  getGroupSessions: (params?: Record<string, string>) =>
    api.get('/public/group-sessions', { params }),
  getGroupSession: (id: number) =>
    api.get(`/public/group-sessions/${id}`),
  // Payment page (token-based)
  getPaymentPage: (token: string) => api.get(`/public/payment/${token}`),
  processPayment: (token: string, method: string) => api.post(`/public/payment/${token}/pay`, { method }),
};

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: Record<string, string>) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () =>
    api.post('/auth/logout'),
  me: () =>
    api.get('/auth/me'),
  upgradeToTutor: () =>
    api.post('/auth/upgrade-to-tutor'),
};

// ─── Tutor API ───────────────────────────────────────────────────────────────

export const tutorApi = {
  getProfile: () => api.get('/tutor/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/tutor/profile', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/tutor/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getSubjects: () => api.get('/tutor/subjects'),
  addSubject: (data: { subject_id: number; levels?: string[]; hourly_rate?: number }) =>
    api.post('/tutor/subjects', data),
  updateSubject: (id: number, data: { levels?: string[]; hourly_rate?: number }) =>
    api.put(`/tutor/subjects/${id}`, data),
  removeSubject: (id: number) => api.delete(`/tutor/subjects/${id}`),
  requestSubject: (data: { subject_name: string; category_suggestion?: string }) =>
    api.post('/tutor/subjects/request', data),
  getSubjectRequests: () => api.get('/tutor/subjects/requests'),
  getAvailability: () => api.get('/tutor/availability'),
  syncAvailability: (slots: Record<string, unknown>[]) => api.post('/tutor/availability', { slots }),
  getBookings: (params?: Record<string, string>) => api.get('/tutor/bookings', { params }),
  acceptBooking: (id: number) => api.put(`/tutor/bookings/${id}/accept`),
  rejectBooking: (id: number) => api.put(`/tutor/bookings/${id}/reject`),
  uploadVerification: (formData: FormData) =>
    api.post('/tutor/verification/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getVerificationStatus: () => api.get('/tutor/verification/status'),
  getDashboardStats: () => api.get('/tutor/dashboard/stats'),
  getOnboardingStatus: () => api.get('/tutor/dashboard/onboarding'),
  // Contact verification
  sendEmailOtp: () => api.post('/tutor/contact/send-email-otp'),
  verifyEmailOtp: (otp: string) => api.post('/tutor/contact/verify-email', { otp }),
  sendPhoneOtp: (phone?: string) => api.post('/tutor/contact/send-phone-otp', phone ? { phone } : {}),
  verifyPhoneOtp: (otp: string) => api.post('/tutor/contact/verify-phone', { otp }),
  // Get auth user (for verification status)
  getMe: () => api.get('/auth/me'),
  // Group Sessions
  getGroupSessions: () => api.get('/tutor/group-sessions'),
  createGroupSession: (data: Record<string, unknown>) => api.post('/tutor/group-sessions', data),
  getGroupSession: (id: number) => api.get(`/tutor/group-sessions/${id}`),
  updateGroupSession: (id: number, data: Record<string, unknown>) => api.put(`/tutor/group-sessions/${id}`, data),
  confirmGroupSession: (id: number) => api.put(`/tutor/group-sessions/${id}/confirm`),
  cancelGroupSession: (id: number, reason: string) => api.put(`/tutor/group-sessions/${id}/cancel`, { reason }),
  completeGroupSession: (id: number, report: string) => api.post(`/tutor/group-sessions/${id}/complete`, { report }),
  // Sessions (1-on-1 lessons)
  getSessions: (params?: Record<string, string>) => api.get('/tutor/sessions', { params }),
  getSession: (id: number) => api.get(`/tutor/sessions/${id}`),
  scheduleSessions: (bookingId: number, sessions: { scheduled_at: string; duration_minutes: number; meeting_link?: string }[]) =>
    api.post(`/tutor/bookings/${bookingId}/sessions`, { sessions }),
  updateSession: (id: number, data: Record<string, unknown>) => api.put(`/tutor/sessions/${id}`, data),
  completeSession: (id: number, data: { recording_link: string; tutor_notes?: string }) =>
    api.post(`/tutor/sessions/${id}/complete`, data),
  cancelSession: (id: number, reason: string) => api.put(`/tutor/sessions/${id}/cancel`, { reason }),
  // Earnings & Payouts
  getEarnings: () => api.get('/tutor/earnings'),
  getInvoices: (page = 1) => api.get('/tutor/earnings/invoices', { params: { page } }),
  getPayoutPreferences: () => api.get('/tutor/payout-preferences'),
  savePayoutPreferences: (data: { method: string; account_number: string; account_name?: string }) =>
    api.post('/tutor/payout-preferences', data),
  // Conversations / Messaging
  getConversations: () => api.get('/tutor/conversations'),
  getConversationMessages: (bookingId: number) => api.get(`/tutor/conversations/${bookingId}/messages`),
  sendMessage: (bookingId: number, body: string) => api.post(`/tutor/conversations/${bookingId}/messages`, { body }),
  acceptBookingChat: (bookingId: number) => api.post(`/tutor/conversations/${bookingId}/accept`),
  rejectBookingChat: (bookingId: number, reason?: string) => api.post(`/tutor/conversations/${bookingId}/reject`, { reason }),
  proposeDate: (bookingId: number, data: { proposed_date: string; proposed_time: string }) =>
    api.post(`/tutor/conversations/${bookingId}/propose-date`, data),
  confirmDate: (bookingId: number) => api.post(`/tutor/conversations/${bookingId}/confirm-date`),
  setLessonType: (bookingId: number, data: { lesson_type: string; lessons_count?: number; hourly_rate?: number }) =>
    api.post(`/tutor/conversations/${bookingId}/set-lesson-type`, data),
  generatePaymentLink: (bookingId: number) => api.post(`/tutor/conversations/${bookingId}/generate-payment-link`),
  markConversationRead: (bookingId: number) => api.post(`/tutor/conversations/${bookingId}/mark-read`),
  // Reviews
  getReviews: (page = 1, perPage = 10) => api.get('/tutor/reviews', { params: { page, per_page: perPage } }),
};

// ─── Student API ─────────────────────────────────────────────────────────────

export const studentApi = {
  createBooking: (data: Record<string, unknown>) => api.post('/student/bookings', data),
  getBookings: (params?: Record<string, string>) => api.get('/student/bookings', { params }),
  cancelBooking: (id: number) => api.put(`/student/bookings/${id}/cancel`),
  getDashboardStats: () => api.get('/student/dashboard/stats'),
  // Payment
  payBooking: (id: number) => api.post(`/student/bookings/${id}/pay`),
  getPaymentStatus: (id: number) => api.get(`/student/bookings/${id}/payment-status`),
  // Sessions
  getSessions: (params?: Record<string, string>) => api.get('/student/sessions', { params }),
  getSession: (id: number) => api.get(`/student/sessions/${id}`),
  disputeSession: (id: number, data: { reason: string; evidence_link?: string }) =>
    api.post(`/student/sessions/${id}/dispute`, data),
  // Group Sessions
  getGroupSessions: () => api.get('/student/group-sessions'),
  enrollGroupSession: (id: number) => api.post(`/student/group-sessions/${id}/enroll`),
  cancelGroupSession: (id: number) => api.put(`/student/group-sessions/${id}/cancel`),
  // Conversations / Messaging
  getConversations: () => api.get('/student/conversations'),
  getConversationMessages: (bookingId: number) => api.get(`/student/conversations/${bookingId}/messages`),
  sendMessage: (bookingId: number, body: string) => api.post(`/student/conversations/${bookingId}/messages`, { body }),
  proposeDate: (bookingId: number, data: { proposed_date: string; proposed_time: string }) =>
    api.post(`/student/conversations/${bookingId}/propose-date`, data),
  confirmDate: (bookingId: number) => api.post(`/student/conversations/${bookingId}/confirm-date`),
  markConversationRead: (bookingId: number) => api.post(`/student/conversations/${bookingId}/mark-read`),
  // Reviews
  submitReview: (data: { tutor_id: number; booking_id?: number; rating: number; comment?: string }) =>
    api.post('/student/reviews', data),
  // Profile
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/student/profile', data),
  uploadAvatar: (formData: FormData) => api.post('/student/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.post('/student/profile/change-password', data),
};

// ─── Admin API ───────────────────────────────────────────────────────────────

export const adminApi = {
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardChart: (days = 30) => api.get('/admin/dashboard/chart', { params: { days } }),
  getVerificationQueue: (params?: Record<string, string>) => api.get('/admin/verifications', { params }),
  getVerificationFile: (id: number) => api.get(`/admin/verifications/${id}/file`, { responseType: 'blob' }),
  approveVerification: (id: number, data?: { notes?: string }) => api.put(`/admin/verifications/${id}/approve`, data),
  rejectVerification: (id: number, data: { notes: string }) => api.put(`/admin/verifications/${id}/reject`, data),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  updateUser: (id: number, data: Record<string, unknown>) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  toggleUserActive: (id: number) => api.put(`/admin/users/${id}/toggle-active`),
  bulkActionUsers: (ids: number[], action: 'activate' | 'suspend' | 'delete') => api.post('/admin/users/bulk', { ids, action }),
  exportUsers: (params?: Record<string, unknown>) => api.get('/admin/users/export', { params, responseType: 'blob' }),
  impersonateUser: (id: number) => api.post(`/admin/users/${id}/impersonate`),
  getUserActivity: (id: number) => api.get(`/admin/users/${id}/activity`),
  getSubjects: () => api.get('/admin/subjects'),
  createSubject: (data: Record<string, unknown>) => api.post('/admin/subjects', data),
  updateSubject: (id: number, data: Record<string, unknown>) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id: number) => api.delete(`/admin/subjects/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: Record<string, unknown>) => api.post('/admin/categories', data),
  // Platform settings
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (key: string, value: unknown) => api.put(`/admin/settings/${key}`, { value }),
  // Disputes
  getDisputes: (params?: Record<string, string>) => api.get('/admin/disputes', { params }),
  getDispute: (id: number) => api.get(`/admin/disputes/${id}`),
  resolveDispute: (id: number, data: { resolution: 'tutor' | 'student'; admin_note: string }) =>
    api.put(`/admin/disputes/${id}/resolve`, data),
  // Sessions overview
  getSessions: (params?: Record<string, string>) => api.get('/admin/sessions', { params }),
  getSession:  (id: number) => api.get(`/admin/sessions/${id}`),
  getSessionFinancials: () => api.get('/admin/sessions/financials'),
};

// ─── Onboarding API ──────────────────────────────────────────────────────────

export const onboardingApi = {
  getStatus: () =>
    api.get('/tutor/onboarding/status'),
  saveStep1: (data: {
    subjects: { subject_id: number; levels: string[]; hourly_rate?: number }[];
    experience_years?: number;
    education_level?: string;
  }) =>
    api.patch('/tutor/onboarding/step-1', data),
  saveStep2: (data: {
    headline_ar?: string;
    headline_en?: string;
    bio_ar?: string;
    bio_en?: string;
    bio_method_ar?: string;
    bio_method_en?: string;
    video_url?: string;
  }) =>
    api.patch('/tutor/onboarding/step-2', data),
  saveStep3: (data: Record<string, unknown>) =>
    api.patch('/tutor/onboarding/step-3', data),
  saveStep4: (data: {
    hourly_rate: number;
    hourly_rate_online?: number | null;
    pack_5h_price?: number | null;
    pack_10h_price?: number | null;
    travel_expenses?: number | null;
    is_first_lesson_free?: boolean;
    first_lesson_duration?: number;
    group_sessions_enabled?: boolean;
    group_price_per_seat?: number | null;
    group_max_capacity?: number | null;
    group_min_threshold?: number | null;
  }) =>
    api.patch('/tutor/onboarding/step-4', data),
  saveStep5: (formData: FormData) =>
    api.post('/tutor/onboarding/step-5', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  saveStep6: (data: { slots: { day: string; start_time: string; end_time: string; is_recurring: boolean }[] }) =>
    api.patch('/tutor/onboarding/step-6', data),
  submit: () =>
    api.post('/tutor/onboarding/submit'),
};
