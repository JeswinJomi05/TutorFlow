const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      unique: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tutor ID reference is required'],
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    currentLevel: {
      type: String,
      required: [true, 'Current level is required'],
      trim: true,
    },
    learningGoals: {
      type: String,
      trim: true,
      default: '',
    },
    weakAreas: {
      type: String,
      trim: true,
      default: '',
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
studentProfileSchema.index({ tutorId: 1 });

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
