import mongoose from 'mongoose';

export interface ICourse extends mongoose.Document {
  name: string;
  grade: string;
}

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供课程名称'],
    trim: true,
  },
  grade: {
    type: String,
    required: [true, '请提供年级'],
    trim: true,
  }
}, { timestamps: true });

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema); 