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
        <a href="#platform" onClick={closeAfterNavigation}>How it works</a>
        <a href="#compare" onClick={closeAfterNavigation}>Why Voice Labs</a>
        <Link href="/agents" onClick={closeAfterNavigation}>Platform access ↗</Link>
      </nav>
    </details>
  );
}
