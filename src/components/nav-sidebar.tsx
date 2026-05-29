import { useEffect, useState } from "react";
import {
  Search,
  Users,
  Settings,
  Moon,
  Sun,
  LogOut,
  User,
  Home,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { AIAssistant } from "./ai-assistant";

const TOOLTIP_CLASSES =
  "pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

export function NavSidebar() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [currentUser, setCurrentUser] = useState("user");
  const [aiOpen, setAiOpen] = useState(false);
  const path = window.location.pathname;

  useEffect(() => {
    fetch("/auth/me").then(r => r.json()).then(d => setCurrentUser(d.user || "user")).catch(() => {});
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    const root = document.documentElement;
    if (next) { root.classList.add("dark"); localStorage.setItem("theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  };

  const navItem = (href: string, icon: React.ReactNode, label: string) => {
    const isActive = path === href;
    return (
      <a
        href={href}
        className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
          isActive
            ? "bg-accent/10 text-accent"
            : "text-muted hover:bg-card hover:text-foreground"
        }`}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        {icon}
        <span className={TOOLTIP_CLASSES}>{label}</span>
      </a>
    );
  };

  return (
    <>
    <nav
      aria-label="Main"
      className="fixed left-0 top-0 z-40 flex h-screen w-14 flex-col items-center border-r border-border bg-card/95 pt-20 pb-4 backdrop-blur"
    >
      <div className="flex flex-col items-center gap-1 flex-1">
        {navItem("/", <Home className="h-5 w-5" aria-hidden="true" />, "Dashboard")}
        {navItem("/search", <Search className="h-5 w-5" aria-hidden="true" />, "Asset Search")}
        {navItem("/people", <Users className="h-5 w-5" aria-hidden="true" />, "People")}
        {navItem("/controls", <ShieldCheck className="h-5 w-5" aria-hidden="true" />, "Controls")}

        <button
          type="button"
          onClick={() => setAiOpen(true)}
          aria-label="AI Assistant"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Bot className="h-5 w-5" aria-hidden="true" />
          <span className={TOOLTIP_CLASSES}>AI Assistant</span>
        </button>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1">
        {navItem("/settings", <Settings className="h-5 w-5" aria-hidden="true" />, "Settings")}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-pressed={dark}
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {dark
            ? <Sun className="h-5 w-5" aria-hidden="true" />
            : <Moon className="h-5 w-5" aria-hidden="true" />}
          <span className={TOOLTIP_CLASSES}>{dark ? "Light mode" : "Dark mode"}</span>
        </button>

        <div className="my-1 h-px w-6 bg-border" aria-hidden="true" />

        <div
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"
          aria-label={`Signed in as ${currentUser}`}
        >
          <User className="h-4 w-4 text-accent" aria-hidden="true" />
          <span className={TOOLTIP_CLASSES}>{currentUser}</span>
        </div>

        <a
          href="/auth/logout"
          aria-label="Sign out"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span className={TOOLTIP_CLASSES}>Sign out</span>
        </a>
      </div>

    </nav>
    <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
