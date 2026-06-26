import "./About.css";
import theo from "../assets/theo.png";
import lloyd from "../assets/lloyd.jpg";
import jasper from "../assets/jasper.jpg";
import dustin from "../assets/dus.png";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
    iconBg: "#e8f0fe",
    iconColor: "#4a6cf7",
    title: "CPU Scheduling",
    desc: "Explore how the OS decides which process runs next and when. Step through each algorithm tick by tick and watch the ready queue evolve.",
    tags: ["FCFS", "SJF", "Priority", "Round Robin"],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="7" y1="4" x2="7" y2="10" />
        <line x1="12" y1="4" x2="12" y2="10" />
        <line x1="17" y1="4" x2="17" y2="10" />
      </svg>
    ),
    iconBg: "#f3e8ff",
    iconColor: "#7c5cbf",
    title: "Memory Management",
    desc: "Visualize how the OS allocates and tracks physical memory blocks. See fragmentation happen — and how different strategies handle it.",
    tags: ["First Fit", "Best Fit", "Worst Fit", "Next Fit"],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="8" height="8" rx="1" />
        <rect x="14" y="3" width="8" height="8" rx="1" />
        <rect x="2" y="13" width="8" height="8" rx="1" />
        <rect x="14" y="13" width="8" height="8" rx="1" />
        <path d="M10 7h4" /><path d="M10 17h4" />
        <path d="M6 11v2" /><path d="M18 11v2" />
      </svg>
    ),
    iconBg: "#e8f5f0",
    iconColor: "#3b7a6a",
    title: "Virtual Memory",
    desc: "Step through page replacement algorithms and watch TLB hits and faults in real time. The gap between logical and physical address space, made visible.",
    tags: ["FIFO", "LRU", "OPT", "Clock", "MFU"],
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="9" x2="12" y2="2" />
      </svg>
    ),
    iconBg: "#fff4e5",
    iconColor: "#e8a33c",
    title: "Mass Storage",
    desc: "Understand how disk scheduling algorithms minimize seek time and improve throughput. Watch the read head move across the platter in real time.",
    tags: ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK"],
  },
];

const TEAM = [
  { img: lloyd,  name: "Lloyd Rodney Z. Arevalo",    role: "Project Lead",        pid: "001" },
  { img: jasper, name: "Jasper Martin A. Gabriel",    role: "Backend Developer",   pid: "002" },
  { img: theo,   name: "Altheo Evans E. Mananquil",   role: "Frontend Developer",  pid: "003" },
  { img: dustin, name: "Dustin S. Ong",               role: "Frontend Developer",  pid: "004" },
];

const NAV_LINKS = [
  { label: "Home",               href: "/" },
  { label: "CPU Scheduling",     href: "/cpu-scheduling" },
  { label: "Memory Management",  href: "/memory-management" },
  { label: "Virtual Memory",     href: "/virtual-memory" },
  { label: "Mass Storage",       href: "/mass-storage" },
];

function About() {
  return (
    <main className="ab-page">

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-hero-grid-bg" aria-hidden="true" />
        <div className="ab-hero-glow" aria-hidden="true" />
        <div className="ab-hero-inner">

          {/* Left: text */}
          <div className="ab-hero-text">
            <span className="ab-hero-badge">
              <span className="ab-hero-badge-dot" />
              Open-Source · Educational · Interactive
            </span>
            <h1 className="ab-hero-title">
              Understanding Operating Systems<br />
              <span className="ab-hero-accent">Through Visualization</span>
            </h1>
            <p className="ab-hero-sub">
              SImOS is a web-based learning platform built to make OS concepts tangible.
              Run simulations, step through algorithms, and see every decision the OS makes — in real time.
            </p>
            <div className="ab-hero-actions">
              <a href="/cpu-scheduling" className="ab-btn-primary">Start Simulating</a>
              <a href="#features" className="ab-btn-secondary">Explore Modules</a>
            </div>
          </div>

          {/* Right: simulation mockup */}
          <div className="ab-hero-mockup" aria-hidden="true">
            <div className="ab-mockup-topbar">
              <div className="ab-mockup-dots">
                <div className="ab-mockup-dot" />
                <div className="ab-mockup-dot" />
                <div className="ab-mockup-dot" />
              </div>
              <span className="ab-mockup-title-bar">CPU Scheduler · Round Robin</span>
            </div>

            <div className="ab-mockup-body">
              <div className="ab-mockup-gantt">
                <span className="ab-mockup-label">Gantt Chart</span>
                {[
                  { pid: "P1", left: "0%",  width: "28%", color: "#4a6cf7" },
                  { pid: "P2", left: "28%", width: "20%", color: "#7c5cbf" },
                  { pid: "P3", left: "48%", width: "16%", color: "#3b7a6a" },
                  { pid: "P1", left: "64%", width: "22%", color: "#4a6cf720" },
                  { pid: "P4", left: "86%", width: "14%", color: "#e8a33c" },
                ].map((b, i) => (
                  <div className="ab-mockup-row" key={i}>
                    <span className="ab-mockup-pid">{b.pid}</span>
                    <div className="ab-mockup-track">
                      <div
                        className="ab-mockup-block"
                        style={{ left: b.left, width: b.width, background: b.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="ab-mockup-table">
                <span className="ab-mockup-label">Page Table — LRU</span>
                <div className="ab-mockup-table-row">
                  {["Frame", "1", "2", "3", "4", "5"].map((h) => (
                    <div key={h} className="ab-mockup-cell ab-mockup-cell-header">{h}</div>
                  ))}
                </div>
                <div className="ab-mockup-table-row">
                  {[
                    { t: "P0", c: "ab-mockup-cell-header" },
                    { t: "HIT", c: "ab-mockup-cell-hit" },
                    { t: "MISS", c: "ab-mockup-cell-miss" },
                    { t: "HIT", c: "ab-mockup-cell-hit" },
                    { t: "—", c: "ab-mockup-cell-empty" },
                    { t: "HIT", c: "ab-mockup-cell-hit" },
                  ].map((cell, i) => (
                    <div key={i} className={`ab-mockup-cell ${cell.c}`}>{cell.t}</div>
                  ))}
                </div>
                <div className="ab-mockup-table-row">
                  {[
                    { t: "P1", c: "ab-mockup-cell-header" },
                    { t: "MISS", c: "ab-mockup-cell-miss" },
                    { t: "HIT", c: "ab-mockup-cell-hit" },
                    { t: "—", c: "ab-mockup-cell-empty" },
                    { t: "HIT", c: "ab-mockup-cell-hit" },
                    { t: "MISS", c: "ab-mockup-cell-miss" },
                  ].map((cell, i) => (
                    <div key={i} className={`ab-mockup-cell ${cell.c}`}>{cell.t}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="ab-section" id="features">
        <div className="ab-section-header">
          <h2 className="ab-section-title">What You Can Simulate</h2>
          <p className="ab-section-sub">Four core OS topics, each with multiple algorithms and live visualizations</p>
        </div>
        <div className="ab-features-grid">
          {FEATURES.map((f) => (
            <div className="ab-feature-card" key={f.title}>
              <div className="ab-feature-icon" style={{ background: f.iconBg, color: f.iconColor }}>
                {f.icon}
              </div>
              <h3 className="ab-feature-title">{f.title}</h3>
              <p className="ab-feature-desc">{f.desc}</p>
              <div className="ab-feature-tags">
                {f.tags.map((tag) => (
                  <span key={tag} className="ab-tag" style={{ color: f.iconColor, background: f.iconBg, border: `1px solid ${f.iconColor}22` }}>{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="ab-mission-section">
        <div className="ab-mission-inner">
          <div className="ab-mission-text">
            <span className="ab-eyebrow">Our Purpose</span>
            <h2 className="ab-mission-title">Why We Built This</h2>
            <p className="ab-mission-body">
              Operating Systems sits at the intersection of software and hardware — exactly where computer
              engineering lives. Concepts like page replacement, process scheduling, and memory allocation
              are easy to memorize but hard to truly understand from a lecture slide alone.
            </p>
            <p className="ab-mission-body">
              SImOS was built to bridge that gap. By turning algorithms into interactive, step-by-step simulations,
              we make it possible to <em>see</em> what the OS is doing at every moment — not just read about it.
              Our goal is to make learning Operating Systems easier, more engaging, and more accessible for every student.
            </p>
          </div>
          <div className="ab-mission-visual" aria-hidden="true">
            <div className="ab-mission-card">
              <span className="ab-mission-card-label">Process Queue</span>
              <div className="ab-mission-bars">
                <div className="ab-mission-bar" style={{ width: "80%", background: "#3b7a6a" }} />
                <div className="ab-mission-bar" style={{ width: "55%", background: "#7c5cbf" }} />
                <div className="ab-mission-bar" style={{ width: "65%", background: "#4a6cf7" }} />
                <div className="ab-mission-bar" style={{ width: "40%", background: "#e8a33c" }} />
              </div>
            </div>
            <div className="ab-mission-card">
              <span className="ab-mission-card-label">Memory Frames</span>
              <div className="ab-mission-frames">
                {["P1","P3","—","P2","P4","—"].map((p, i) => (
                  <div key={i} className={"ab-mission-frame" + (p !== "—" ? " ab-mission-frame-full" : "")}>{p}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

  

      {/* ── Team ── */}
      <section className="ab-section">
        <div className="ab-section-header">
          <h2 className="ab-section-title">Meet the Team</h2>
          <p className="ab-section-sub">Four computer engineering students who turned an OS assignment into a full simulator</p>
        </div>
        <div className="ab-team-grid">
          {TEAM.map((member) => (
            <div className="ab-team-card" key={member.pid}>
              <span className="ab-pid">PID {member.pid}</span>
              <img className="ab-team-img" src={member.img} alt={member.name} />
              <div className="ab-team-info">
                <h3 className="ab-team-name">{member.name}</h3>
                <span className="ab-team-role">{member.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="ab-footer">
        <div className="ab-footer-inner">
          <div className="ab-footer-brand">
            <span className="ab-footer-logo">SIm<span className="ab-footer-logo-accent">OS</span></span>
            <p className="ab-footer-tagline">Operating System Simulator</p>
          </div>
          <nav className="ab-footer-nav">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="ab-footer-link">{l.label}</a>
            ))}
          </nav>
          <div className="ab-footer-right">
            <a href="https://github.com/RodneyGG/SImOS" className="ab-footer-gh" target="_blank" rel="noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
              GitHub
            </a>
          </div>
        </div>
        <div className="ab-footer-bottom">
          <p>Built for educational purposes as part of an Operating Systems course. All simulations are client-side approximations intended for learning, not production use.</p>
        </div>
      </footer>

    </main>
  );
}

export default About;