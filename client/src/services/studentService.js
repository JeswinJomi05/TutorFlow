import api from './api';

const studentService = {
  /**
   * Get current student profile and tutor details
   */
  getProfile: async () => {
    const response = await api.get('/students/me');
    return response.data;
  },

  /**
   * Get all sessions scheduled for this student
   */
  getSessions: async () => {
    const response = await api.get('/students/sessions');
    return response.data;
  },

  /**
   * Get homework assigned to this student
   */
  getHomework: async () => {
    const response = await api.get('/students/homework');
    return response.data;
  },
};

export default studentService;
