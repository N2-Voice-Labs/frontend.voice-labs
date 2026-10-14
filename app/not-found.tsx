import Link from "next/link";
import "./not-found.css";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="lost">
      <div className="lost-orb" aria-hidden="true">
        <span className="lost-ring" /><span className="lost-ring" />
        <span className="lost-core">v<span>.</span></span>
      </div>
      <p className="lost-code">404</p>
      <h1>This page went quiet.</h1>
      <p className="lost-copy">The link may be old, or the agent or conversation you’re looking for no longer exists.</p>
      <div className="lost-actions">
        <Link className="lost-primary" href="/">Back to home</Link>
        <Link className="lost-secondary" href="/agents">Open the workspace</Link>
      </div>
    </main>
  );
}
