import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "CPU Scheduling", path: "/cpu-scheduling", icon: "" },
  { label: "Memory Management", path: "/memory-management", icon: "" },
  { label: "Virtual Memory", path: "/virtual-memory", icon: "" },
  { label: "Disk Scheduling", path: "/mass-storage", icon: "" },
];

function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  function goTo(path: string) {
    navigate(path);
    setDrawerOpen(false);
  }

  return (
    <>
      <header className="nav-header">
        <div className="nav-logo-section">
          <button type="button" className="nav-menu-btn" onClick={function () { setDrawerOpen(!drawerOpen); }} aria-label="Toggle navigation">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
          <button type="button" className="nav-logo-btn" onClick={() => goTo("/")}>
            <h1 className="nav-logo">SIm<span>OS</span></h1>
            <p className="nav-subtitle">Operating System Simulator</p>
          </button>
        </div>
        <nav className="nav-links">
          <button type="button" onClick={() => window.open("https://github.com/RodneyGG/SImOS", "_blank")}>GitHub</button>
          <button type="button">Docs</button>
          <button type="button">About</button>
          <button type="button" className="nav-theme-toggle">◐</button>
        </nav>
</header>
      {/* Overlay */}
      {drawerOpen && <div className="drawer-overlay" onClick={function () { setDrawerOpen(false); }} />}

      {/* Drawer */}
      <aside className={"drawer" + (drawerOpen ? " open" : "")}>
        <div className="drawer-header">
          <h2 className="drawer-title">SIm<span>OS</span></h2>
          <button type="button" className="drawer-close" onClick={function () { setDrawerOpen(false); }}>✕</button>
        </div>
        <nav className="drawer-nav">
          {NAV_ITEMS.map(function (item) {
            const isActive = location.pathname === item.path;
            return (
              <button
                type="button"
                key={item.path}
                className={"drawer-link" + (isActive ? " active" : "")}
                onClick={function () { goTo(item.path); }}
              >
                <span className="drawer-link-icon">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;
