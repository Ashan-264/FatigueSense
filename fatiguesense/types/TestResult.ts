export interface TestResult {
  type: "tapping" | "sway" | "movement";
  score: number;
  raw: Record<string, number>;
  at: number;
}
