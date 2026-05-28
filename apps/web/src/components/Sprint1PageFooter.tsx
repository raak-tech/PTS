"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type Variant = "plan" | "daily" | "check-in" | "red-flags";

type Props = {
  variant: Variant;
  className?: string;
  style?: CSSProperties;
};

export function Sprint1PageFooter({ variant, className, style }: Props) {
  const links: { href: string; label: string }[] =
    variant === "plan"
      ? [{ href: "/", label: "Back to intake" }]
      : variant === "daily"
        ? [
            { href: "/plan", label: "Back to Week 1 Plan" },
            { href: "/", label: "Back to intake" },
          ]
        : variant === "check-in"
          ? [{ href: "/plan", label: "Back to plan" }]
          : [{ href: "/", label: "Back to intake" }];

  return (
    <footer aria-label="Page footer" className={className} style={style}>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
