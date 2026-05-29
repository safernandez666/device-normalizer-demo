import { useState, useEffect } from "react";
import { NavSidebar } from "./components/nav-sidebar";
import Dashboard from "./pages/dashboard";
import SearchPage from "./pages/search";
import PeoplePage from "./pages/people";
import DualUsePage from "./pages/dual-use";
import SettingsPage from "./pages/settings";
import ControlsPage from "./pages/controls";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Client-side routing: intercept clicks on internal <a href> so navigation
  // between pages doesn't trigger a full reload. The previous behavior
  // re-downloaded the bundle and re-ran every page's data fetches on each
  // navigation — `<a href="/controls">` from ControlsHealth etc. would feel
  // sluggish despite the same React tree being re-mountable in place.
  //
  // We deliberately let `/auth/*` and `/api/*` fall through to the browser
  // (logout, callbacks, JSON endpoints opened in a tab). External origins,
  // modifier clicks, target=_blank, download links, and non-left clicks all
  // fall through too — same contract the browser already has.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let el = e.target as Element | null;
      while (el && el.tagName !== "A") el = el.parentElement;
      if (!el) return;
      const a = el as HTMLAnchorElement;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const href = a.getAttribute("href");
      if (!href) return;
      // Same-origin check via the resolved URL — handles "/x", "./x", absolute.
      let url: URL;
      try { url = new URL(a.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      // Backend-owned paths stay as full reloads.
      if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/api/")) return;

      e.preventDefault();
      const target = url.pathname + url.search + url.hash;
      if (target !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.pushState({}, "", target);
        setPath(url.pathname);
        window.scrollTo(0, 0);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  let page;
  if (path === "/search") page = <SearchPage />;
  else if (path === "/people") page = <PeoplePage />;
  else if (path === "/dual-use") page = <DualUsePage />;
  else if (path === "/settings") page = <SettingsPage />;
  else if (path === "/controls") page = <ControlsPage />;
  else page = <Dashboard />;

  return (
    <>
      <NavSidebar />
      <div className="pl-14">
        {page}
      </div>
    </>
  );
}

export default App;
