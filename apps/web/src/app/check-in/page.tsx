import type { Metadata } from "next";

import { CheckInClient } from "./CheckInClient";

export const metadata: Metadata = {
  title: 'Weekly check-in',
};

export default function WeeklyCheckInPage() {
  return <CheckInClient />;
}
