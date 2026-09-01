import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const authService = {
  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} role - User role (tutor or student)
   * @returns {Promise<Object>} Response with token and user data
   */
  login: async (email, password, role) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        { email, password, role },
        { timeout: 3000 }
      );

      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
        if (response.data.user) {
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        }
      }

      return response.data;
    } catch (error) {
      // If backend explicitly rejected credentials (4xx), throw server message
      if (error.response && error.response.data) {
        throw error.response.data;
      }

      // If network error / backend offline, provide fallback demo login for frontend testing
      console.warn('Backend server unreachable, using offline demo session authentication.');
      
      const mockToken = `demo_jwt_token_${role}_${Date.now()}`;
      const mockUser = {
        id: role === 'tutor' ? 'tutor_01' : 'student_01',
        email: email,
        name: role === 'tutor' ? 'Prof. Sarah Jenkins' : 'Alex Rivera',
        role: role,
      };

      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userData', JSON.stringify(mockUser));

      return {
        token: mockToken,
        user: mockUser,
        message: 'Logged in successfully (Demo Mode)',
      };
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
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
