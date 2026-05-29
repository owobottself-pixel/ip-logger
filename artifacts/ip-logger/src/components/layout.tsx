import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Target, Activity, List, ShieldAlert } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "OVERVIEW", icon: Activity },
    { href: "/links", label: "TRACKING LINKS", icon: Target },
    { href: "/logs", label: "INTEL LOGS", icon: List },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-mono overflow-hidden">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <ShieldAlert className="text-primary w-6 h-6" />
          <h1 className="font-bold text-lg tracking-widest text-primary">OP-TRACKER</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors uppercase tracking-wider text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground text-center tracking-widest">
          SYS_SECURE // ONLINE
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}