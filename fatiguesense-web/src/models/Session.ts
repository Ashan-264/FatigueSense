import mongoose, { Schema, Model } from 'mongoose';

export interface ITestResult {
  type: string;
  score: number;
  raw: Record<string, unknown>;
}

export interface ISession {
  userId: string;
  timestamp: Date;
  results: ITestResult[];
  metadata: {
    deviceId: string;
    testType: string;
    durationSeconds: number;
    totalSamples: number;
  };
}

const testResultSchema = new Schema<ITestResult>({
  type: { type: String, required: true },
  score: { type: Number, required: true },
  raw: { type: Schema.Types.Mixed },
});

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    results: { type: [testResultSchema], required: true },
    metadata: {
      deviceId: { type: String, required: true },
      testType: { type: String, required: true },
      durationSeconds: { type: Number, required: true },
      totalSamples: { type: Number, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
sessionSchema.index({ userId: 1, timestamp: -1 });

// Prevent model recompilation during hot reload
const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', sessionSchema);

export default Session;

