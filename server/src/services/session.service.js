const Session = require('../models/Session');
const ApiError = require('../utils/apiError');

/**
 * Valid allowed state transitions map
 */
const VALID_TRANSITIONS = {
  scheduled: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
};

/**
 * Validates whether a status transition is permitted by business rules
 * @param {string} currentStatus
 * @param {string} newStatus
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (currentStatus === newStatus) {
    return; // Idempotent same-status call
  }

  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowedNextStatuses.includes(newStatus)) {
    throw ApiError.badRequest(
      `Invalid session status transition from '${currentStatus}' to '${newStatus}'. Allowed flow: scheduled -> in_progress -> completed`
    );
  }
};

/**
 * Validates that notes can only be edited during the 'in_progress' lifecycle stage
 * @param {string} currentStatus
 */
const validateNotesEditable = (currentStatus) => {
  if (currentStatus === 'completed') {
    throw ApiError.badRequest(
      'Session notes are read-only and cannot be modified once the session is completed'
    );
  }

  if (currentStatus !== 'in_progress') {
    throw ApiError.badRequest(
      `Session notes can only be updated while the session is in progress (current status: '${currentStatus}')`
    );
  }
};

/**
 * Check if a tutor has a scheduling conflict at a specified time
 * Considers sessions within a 45-minute window or matching timestamp
 * @param {string|ObjectId} tutorId
 * @param {Date|string} scheduledAt
 * @param {string|ObjectId} [excludeSessionId] - Optional session to exclude (for updates)
 */
const checkSchedulingConflict = async (tutorId, scheduledAt, excludeSessionId = null) => {
  const targetDate = new Date(scheduledAt);
  if (isNaN(targetDate.getTime())) {
    throw ApiError.badRequest('Invalid scheduledAt date format');
  }

  // Define conflict window (+/- 30 minutes)
  const windowMs = 30 * 60 * 1000;
  const startTime = new Date(targetDate.getTime() - windowMs);
  const endTime = new Date(targetDate.getTime() + windowMs);

  const query = {
    tutorId,
    scheduledAt: { $gte: startTime, $lte: endTime },
    status: { $in: ['scheduled', 'in_progress'] },
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  const conflictingSession = await Session.findOne(query);

  if (conflictingSession) {
    throw ApiError.conflict(
      `Scheduling conflict: Tutor already has a session ('${conflictingSession.topic}') scheduled at ${conflictingSession.scheduledAt.toISOString()}`
    );
  }
};

module.exports = {
  VALID_TRANSITIONS,
  validateStatusTransition,
  validateNotesEditable,
  checkSchedulingConflict,
};
