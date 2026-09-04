const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
    },
    topic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
      maxlength: [200, 'Topic cannot exceed 200 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['scheduled', 'in_progress', 'completed', 'ai_reviewed'],
        message: '{VALUE} is not a valid session status',
      },
      default: 'scheduled',
    },
    notes: {
      type: String,
      default: '',
    },
    aiPlan: {
      learningObjectives: { type: [String], default: [] },
      lessonOutline: { type: [String], default: [] },
      practiceQuestions: { type: [String], default: [] },
    },
    aiReview: {
      summary: { type: String, default: '' },
      homework: { type: [String], default: [] },
      nextSessionSuggestion: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

// Indexes
sessionSchema.index({ tutorId: 1 });
sessionSchema.index({ studentId: 1 });
sessionSchema.index({ scheduledAt: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ tutorId: 1, scheduledAt: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
