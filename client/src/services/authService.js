import api from './api';

const authService = {
  /**
   * Login user with email, password, and role
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (tutor or student)
   * @returns {Promise<Object>} Response with token and user data
   */
  login: async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      const { token, user } = response.data;

      if (token) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', user?.role || role);
        localStorage.setItem('userEmail', user?.email || email);
        if (user) {
          localStorage.setItem('userData', JSON.stringify(user));
        }
      }

      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        message: 'Could not connect to backend server. Please verify the server is running.',
      };
    }
  },

  /**
   * Fetch current authenticated user details from backend
   * @returns {Promise<Object>}
   */
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', response.data.user.role);
      }
      return response.data;
    } catch (error) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw error;
    }
  },

  /**
   * Logout user and clear local cache
   */
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');

    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userData');
    }
  },

  /**
   * Get stored auth token
   * @returns {string|null} Auth token or null
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Get stored user role
   * @returns {string|null} User role or null
   */
  getUserRole: () => {
    return localStorage.getItem('userRole');
  },

  /**
   * Get stored user data
   * @returns {Object|null}
   */
  getUser: () => {
    try {
      const data = localStorage.getItem('userData');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Get authorization header
   * @returns {Object} Authorization header object
   */
  getAuthHeader: () => {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};

export default authService;
