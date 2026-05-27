export type DivineState = {
  startedAt: string;
  walletsState: Record<number, {
    usernameSet: boolean;
    lastSayGmTs: number;
    lastFollowTs: number;
    lastTipTs: number;
    followedTargets: string[];
    tipsSent: number;
  }>;
  totalAttempted: number;
  totalSucceeded: number;
  totalFailed: number;
};
