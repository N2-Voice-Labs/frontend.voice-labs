import "./dashboard.css";
import "./dashboard-dark.css";
import { CommandPalette } from "@/components/features/agents/command-palette";
import { DashboardHeader } from "@/components/features/agents/dashboard-header";
import { DashboardBackground } from "@/components/features/dashboard/network-background";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="dash-root">
    <DashboardBackground />
    <DashboardHeader />
    <CommandPalette />
    {children}
    <footer className="site-footer">Voice Labs <span>·</span> Voice agent workspace</footer>
  </div>;
}
