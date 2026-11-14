"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** The bookmarklet: loads widget.js into whatever page is open (a second click toggles the panel). */
export function bookmarkletFor(origin: string): string {
  return `javascript:(function(){var s=document.createElement('script');s.src='${origin}/widget.js';s.dataset.open='true';document.body.appendChild(s);})();`;
}

export function snippetFor(origin: string): string {
  return `<script src="${origin}/widget.js" async></script>`;
}

/**
 * For a university's web team: the one-line install, its options, and a bookmarklet that shows the widget on
 * their own live site (it only changes the page in the browser that clicks it). This page also runs the
 * widget, so the launcher in the corner is the real thing.
 */
export function WidgetInstall() {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const bookmarklet = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (document.querySelector("script[data-unai-preview]")) return;
    const script = document.createElement("script");
    script.src = "/widget.js";
    script.async = true;
    script.dataset.unaiPreview = "";
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // Set outside React: React refuses javascript: URLs in href, and this one is deliberate.
    if (origin && bookmarklet.current) bookmarklet.current.setAttribute("href", bookmarkletFor(origin));
  }, [origin]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippetFor(origin));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <header className="portal-header">
        <Link href="/" className="portal-brand" aria-label="Inha University International Admissions, demo home">
          <span className="portal-crest" aria-hidden="true">IN</span>
          <span>
            <span className="portal-brand-name">Inha University</span>
            <span className="portal-brand-sub">International Admissions</span>
          </span>
        </Link>
        <nav className="portal-header-nav" aria-label="Portal">
          <Link href="/">Assistant</Link>
          <Link href="/staff">Staff</Link>
          <span className="portal-demo-badge">Demo · Powered by UNAI</span>
        </nav>
      </header>

      <main id="main-content" className="portal-main widget-page">
        <section className="widget-intro">
          <p className="portal-eyebrow">For the university web team</p>
          <h1>Add the assistant to your website</h1>
          <p className="portal-hero-lead">
            One line of code puts an &ldquo;Ask Admissions&rdquo; button on any page. It opens the same assistant as this portal:
            voice calls, chat, and the hand-off to an admissions officer with live translation. Nothing else on your site changes.
          </p>
          <p className="widget-try">The button in the corner of this page is the widget itself. Try it.</p>
        </section>

        <section className="widget-step" aria-labelledby="install-title">
          <span className="widget-step-n" aria-hidden="true">1</span>
          <div className="widget-step-body">
            <h2 id="install-title">Paste this before <code>&lt;/body&gt;</code></h2>
            <div className="widget-code">
              <pre><code>{origin ? snippetFor(origin) : "Loading…"}</code></pre>
              <button type="button" className="portal-btn" onClick={() => void copy()} disabled={!origin}>{copied ? "Copied" : "Copy"}</button>
            </div>
            <table className="widget-options">
              <caption>Optional settings, as attributes on the same tag</caption>
              <thead><tr><th scope="col">Attribute</th><th scope="col">What it does</th></tr></thead>
              <tbody>
                <tr><td><code>data-label=&quot;Ask Admissions&quot;</code></td><td>Text on the button</td></tr>
                <tr><td><code>data-position=&quot;left&quot;</code></td><td>Bottom-left corner instead of bottom-right</td></tr>
                <tr><td><code>data-open=&quot;true&quot;</code></td><td>Open the assistant as soon as the page loads</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="widget-step" aria-labelledby="preview-title">
          <span className="widget-step-n" aria-hidden="true">2</span>
          <div className="widget-step-body">
            <h2 id="preview-title">See it on your own site first</h2>
            <p>
              Drag this button to your browser&apos;s bookmarks bar, open any page of your website, and click the bookmark.
              The assistant appears on that page, in your browser only. Click it again to hide it.
            </p>
            <a ref={bookmarklet} className="widget-bookmarklet" href="#" onClick={(e) => e.preventDefault()} draggable>
              Inha Assistant
            </a>
            <p className="widget-note">The bookmark lasts until the page reloads. To keep the assistant while you click around, use the extension below.</p>
          </div>
        </section>

        <section className="widget-step" aria-labelledby="extension-title">
          <span className="widget-step-n" aria-hidden="true">3</span>
          <div className="widget-step-body">
            <h2 id="extension-title">Keep it on every page while you browse</h2>
            <p>
              For a longer demo on your live site, this small Chrome extension adds the assistant to every page you open there,
              including after refreshes and links. It only changes pages in the browser where it&apos;s installed.
            </p>
            <a className="portal-btn portal-btn-primary widget-download" href={origin ? `/unai-demo-extension.zip?portal=${encodeURIComponent(origin)}` : "/unai-demo-extension.zip"} download>
              Download the extension (.zip)
            </a>
            <ol className="widget-list widget-steps-small">
              <li>Unzip it.</li>
              <li>Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong> (top right).</li>
              <li>Click <strong>Load unpacked</strong> and choose the <code>unai-widget-preview</code> folder.</li>
              <li>Open your site. The &ldquo;Ask Admissions&rdquo; button is on every page. It&apos;s set up for apply.inha.ac.kr and admission.inha.ac.kr; click the extension&apos;s icon to change the sites or turn it off.</li>
            </ol>
          </div>
        </section>

        <section className="widget-step" aria-labelledby="needs-title">
          <span className="widget-step-n" aria-hidden="true">4</span>
          <div className="widget-step-body">
            <h2 id="needs-title">What it needs from your site</h2>
            <ul className="widget-list">
              <li>HTTPS, so the browser can ask for the microphone.</li>
              <li>If your site sends a Content-Security-Policy, allow this address in <code>script-src</code> and <code>frame-src</code>.</li>
              <li>No accounts, cookies or data from your site: the assistant only sees what the visitor says or types to it.</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
