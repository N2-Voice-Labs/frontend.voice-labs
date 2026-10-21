import "./dashboard.css";
import "./dashboard-dark.css";
import "./workspace.css";
import "./navigation.css";
import { CommandPalette } from "@/components/features/agents/command-palette";
import { DashboardHeader } from "@/components/features/agents/dashboard-header";
import { DashboardBackground } from "@/components/features/network/network-background";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="dash-root">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <DashboardBackground />
    <DashboardHeader />
    <CommandPalette />
    <div id="main-content" tabIndex={-1} className="dash-content">{children}</div>
    <footer className="site-footer">Voice Labs <span>·</span> Voice agent workspace</footer>
  </div>;
}
