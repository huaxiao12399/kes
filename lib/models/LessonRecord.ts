import mongoose from 'mongoose';

export interface ILessonRecord extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  courseName: string;
  grade: string;
  date: Date;
  hours: number;
  notes?: string;
}

const LessonRecordSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, '请选择课程'],
  },
  courseName: {
    type: String,
    required: [true, '请提供课程名称'],
  },
  grade: {
    type: String,
    required: [true, '请提供年级'],
  },
  date: {
    type: Date,
    required: [true, '请提供上课日期'],
  },
  hours: {
    type: Number,
    required: [true, '请提供课时数量'],
    min: [0.5, '课时最少为0.5'],
  },
  notes: {
    type: String,
    default: '',
  }
}, { timestamps: true });

export default mongoose.models.LessonRecord || mongoose.model<ILessonRecord>('LessonRecord', LessonRecordSchema); 