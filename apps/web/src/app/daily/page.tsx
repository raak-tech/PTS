import type { Metadata } from "next";

import { DailyChecklistClient } from "./DailyChecklistClient";

export const metadata: Metadata = {
  title: "Daily checklist",
};

export default function DailyChecklistPage() {
  return <DailyChecklistClient />;
}
