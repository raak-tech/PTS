import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getUserFromCookieHeader } from "@/lib/session";
import { IntakeFlowClient } from "./IntakeFlowClient";

export const metadata = {
  title: "Tell us your story | PTS",
  description:
    "Tell your counselor what you're going through — freely, in your own words.",
};

export default async function IntakePage() {
  // Feature flag: hot-revert to legacy intake
  if (process.env.NEXT_PUBLIC_USE_LEGACY_INTAKE === "true") {
    redirect("/");
  }

  // Auth check
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get("cookie"));

  if (!user) {
    redirect("/login/mobile?next=/intake");
  }

  if (user.role === "provider") {
    redirect("/provider");
  }

  return <IntakeFlowClient />;
}