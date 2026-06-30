export type UserRole = 'client' | 'provider';

export type SessionUser = {
  id: string;
  phone: string;
  role: UserRole;
  displayName: string;
  intakeComplete: boolean;
  planApproved: boolean;
  /** When the 6-week client program clock started (ISO). */
  programStartedAt?: string;
};

export type MockAccount = SessionUser & {
  /** Dev OTP always 123456 */
  registered: true;
};
