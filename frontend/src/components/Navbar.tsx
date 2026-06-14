import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";

const NAV_ITEMS = [
  { label: "CPU Scheduling", path: "/cpu-scheduling", icon: "" },
  { label: "Memory Management", path: "/memory-management", icon: "" },
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
          <button type="button" className="nav-menu-btn" onClick={function () { setDrawerOpen(!drawerOpen); }}>☰</button>
          <div>
            <h1 className="nav-logo">SIm<span>OS</span></h1>
            <p className="nav-subtitle">Operating System Simulator</p>
          </div>
          <span className="nav-version">v1.0</span>
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
