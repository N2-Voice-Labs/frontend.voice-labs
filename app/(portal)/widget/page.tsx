import type { Metadata } from "next";
import { WidgetInstall } from "@/components/features/portal/widget-install";

export const metadata: Metadata = {
  title: "Website widget",
  description: "Add the admissions assistant to any page of your website with one line of code.",
};

export default function WidgetPage() {
  return <WidgetInstall />;
}
