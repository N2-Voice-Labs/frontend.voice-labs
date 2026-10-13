"use client";

import type { MouseEvent } from "react";
import Link from "next/link";

function closeAfterNavigation(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function MobileNavigation() {
  return (
    <details className="mobile-menu">
      <summary aria-label="Navigation menu">Menu <span aria-hidden="true">+</span></summary>
      <nav aria-label="Mobile navigation">
        <a href="#product" onClick={closeAfterNavigation}>Product</a>
        <a href="#how-it-works" onClick={closeAfterNavigation}>How it works</a>
        <a href="#platform" onClick={closeAfterNavigation}>Platform</a>
        <Link href="/agents" onClick={closeAfterNavigation}>Platform access ↗</Link>
      </nav>
    </details>
  );
}
