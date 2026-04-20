import type { Metadata } from "next";

import { IntakeClient } from "./IntakeClient";

export const metadata: Metadata = {
  title: {
    absolute: "Intake | PTS",
  },
};

export default function HomePage() {
  return <IntakeClient />;
}
