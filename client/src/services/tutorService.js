import api from './api';

const tutorService = {
  /**
   * Get all students assigned to this tutor
   */
  getStudents: async () => {
    const response = await api.get('/tutors/students');
    return response.data;
  },

  /**
   * Get single student details & history
   */
  getStudentById: async (studentId) => {
    const response = await api.get(`/tutors/students/${studentId}`);
    return response.data;
  },

  /**
   * Create a new student account
   */
  createStudent: async (studentData) => {
    const response = await api.post('/tutors/students', studentData);
    return response.data;
  },

  /**
   * Schedule a new session
   */
  createSession: async (sessionData) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },

  /**
   * Get session details by ID
   */
  getSessionById: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },

  /**
   * Update session status
   */
  updateSessionStatus: async (sessionId, status, aiReview = null) => {
    const response = await api.patch(`/sessions/${sessionId}/status`, {
      status,
      ...(aiReview && { aiReview }),
    });
    return response.data;
  },

  /**
   * Update session live notes
   */
  updateSessionNotes: async (sessionId, notes) => {
    const response = await api.patch(`/sessions/${sessionId}/notes`, {
      notes,
    });
    return response.data;
  },
};

export default tutorService;
