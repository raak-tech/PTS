export type UserRole = 'client' | 'provider';

export type SessionUser = {
  id: string;
  phone: string;
  role: UserRole;
  displayName: string;
  intakeComplete: boolean;
  planApproved: boolean;
  /** Calendar anchor (YYYY-MM-DD) — Week 1 release = Day 1. */
  programAnchorDate?: string | null;
  /** Counselor-released week numbers the client may access. */
  releasedWeeks?: number[];
  /** Mock / legacy test clock (ISO). Used when no programAnchorDate. */
  programStartedAt?: string;
};

export type MockAccount = SessionUser & {
  /** Dev OTP always 123456 */
  registered: true;
};
