import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsHeader } from "@/components/settings/settings-header";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-[100] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 pl-14 pr-4 lg:pl-6 lg:pr-6">
          <SettingsHeader />
        </div>
      </header>

      <div className="flex">
        <SettingsSidebar />
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </div>
    </div>
  );
}
