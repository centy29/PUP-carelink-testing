import api from './api';

const authService = {
  // Nurse/Admin Login
  async adminLogin(email, password) {
    const response = await api.post('/auth/admin-login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Student Login
  async login(student_id, password, birthday) {
    const response = await api.post('/auth/login', { student_id, password, birthday });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Register
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore token invalidation errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Check if current user is nurse/admin
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'nurse' || user.role === 'admin');
  },

  // Check if current user is student
  isStudent() {
    const user = this.getCurrentUser();
    return user && user.role === 'student';
  },

  // Get token
  getToken() {
    return localStorage.getItem('token');
  },

  // Verify email OTP
  async verifyEmail(student_id, otp) {
    const response = await api.post('/auth/verify-email', { student_id, otp });
    return response.data;
  },

  // Resend OTP
  async resendOTP(student_id) {
    const response = await api.post('/auth/resend-otp', { student_id });
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(email, otp, password, password_confirmation) {
    const response = await api.post('/auth/reset-password', {
      email, otp, password, password_confirmation
    });
    return response.data;
  },

  // Refresh token
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    return response.data;
  },

  // Get authenticated user from server
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;