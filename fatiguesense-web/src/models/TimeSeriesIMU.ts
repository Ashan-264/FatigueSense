import mongoose, { Schema } from 'mongoose';

export interface IIMUSample {
  sessionId: string;
  timestamp: Date;
  acc: {
    x: number;
    y: number;
    z: number;
  };
  gyro: {
    x: number;
    y: number;
    z: number;
  };
  type: 'tapping' | 'sway' | 'movement';
}

const imuSampleSchema = new Schema<IIMUSample>({
  sessionId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  acc: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  gyro: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  type: { type: String, enum: ['tapping', 'sway', 'movement'], required: true },
}, {
  collection: 'fatigue_imu', // Force exact collection name
  timeseries: {
    timeField: 'timestamp',
    metaField: 'sessionId',
    granularity: 'seconds',
  },
  timestamps: false,
});

// Prevent model recompilation
const TimeSeriesIMU = mongoose.models.fatigue_imu || 
  mongoose.model<IIMUSample>('fatigue_imu', imuSampleSchema);

export default TimeSeriesIMU;

