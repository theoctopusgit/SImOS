import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

/* SVG icon components for simulation cards */
function CpuIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function MemoryIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="7" y1="4" x2="7" y2="10" />
      <line x1="12" y1="4" x2="12" y2="10" />
      <line x1="17" y1="4" x2="17" y2="10" />
    </svg>
  );
}

function VirtualMemoryIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="8" height="8" rx="1" />
      <rect x="14" y="3" width="8" height="8" rx="1" />
      <rect x="2" y="13" width="8" height="8" rx="1" />
      <rect x="14" y="13" width="8" height="8" rx="1" />
      <path d="M10 7h4" /><path d="M10 17h4" />
      <path d="M6 11v2" /><path d="M18 11v2" />
    </svg>
  );
}

function DiskIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="9" x2="12" y2="2" />
    </svg>
  );
}

const SIMULATIONS = [
  {
    path: "/cpu-scheduling",
    IconComponent: CpuIcon,
    iconBg: "#e8f0fe",
    iconColor: "#4a6cf7",
    title: "CPU Scheduling",
    description:
      "Simulate FCFS, SJF, Priority, and Round Robin algorithms. Watch processes compete for CPU time and analyze waiting and turnaround metrics.",
    tags: ["FCFS", "SJF", "Priority", "Round Robin"],
    tagColor: "#4a6cf7",
    tagBg: "rgba(74,108,247,0.08)",
    status: "ready",
  },
  {
    path: "/memory-management",
    IconComponent: MemoryIcon,
    iconBg: "#f3e8ff",
    iconColor: "#7c5cbf",
    title: "Memory Management",
    description:
      "Visualize memory allocation strategies including First Fit, Best Fit, Worst Fit, and Next Fit. See fragmentation happen in real time.",
    tags: ["First Fit", "Best Fit", "Worst Fit", "Next Fit"],
    tagColor: "#7c5cbf",
    tagBg: "rgba(124,92,191,0.08)",
    status: "ready",
  },
  {
    path: "/virtual-memory",
    IconComponent: VirtualMemoryIcon,
    iconBg: "#e8f5f0",
    iconColor: "#3B7A6A",
    title: "Virtual Memory",
    description:
      "Explore FIFO, LRU, OPT, Clock, and Second Chance page replacement algorithms. Track TLB hits, misses, and page faults step by step.",
    tags: ["FIFO", "LRU", "OPT", "Clock"],
    tagColor: "#3B7A6A",
    tagBg: "rgba(59,122,106,0.08)",
    status: "ready",
  },
  {
    path: "/mass-storage",
    IconComponent: DiskIcon,
    iconBg: "#fff4e5",
    iconColor: "#e8a33c",
    title: "Mass Storage",
    description:
      "Simulate disk scheduling algorithms including FCFS, SSTF, SCAN, C-SCAN, and LOOK. Understand seek time optimization in action.",
    tags: ["FCFS", "SSTF", "SCAN", "C-SCAN", "LOOK", "C-LOOK"],
    tagColor: "#e8a33c",
    tagBg: "rgba(232,163,60,0.08)",
    status: "ready",
  },
];

function Home() {
  const navigate = useNavigate();
  const simRef = useRef<HTMLDivElement>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  useEffect(function () {
    return function () {
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
      }
    };
  }, []);

  function scrollToSims() {
    const target = simRef.current;
    if (!target) return;

    // Honor prefers-reduced-motion: jump instantly instead of animating
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      target.scrollIntoView({ block: "start" });
      return;
    }

    // Cancel any in-flight animation before starting a new one
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }

    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + start - 24; // matches scroll-margin-top
    const distance = end - start;
    const duration = 900; // ms — tweak for faster/slower glide
    let startTime: number | null = null;

    function easeInOutCubic(t: number) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp: number) {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));

      if (progress < 1) {
        scrollAnimationFrameRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimationFrameRef.current = null;
      }
    }

    scrollAnimationFrameRef.current = requestAnimationFrame(step);
  }

  return (
    <div className={styles.home}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Operating System Simulator 
        </div>

        <h1 className={styles.heroTitle}>
          SIm<span className={styles.heroAccent}>OS</span>
        </h1>

        <p className={styles.heroSub}>
          Interactive simulations to help you understand how operating systems
          schedule processes, manage memory, and handle storage.
          <br />
          Explore algorithms and see them in action — step by step.
        </p>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.heroCta}
            onClick={scrollToSims}
          >
            Start Simulating
            <span className={styles.heroCtaArrow}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="19 12 12 19 5 12" />
              </svg>
            </span>
          </button>
          <a
        
          >
          
          </a>
        </div>


      </section>

      {/* ── Simulations Grid ── */}
      <section className={styles.simSection} ref={simRef}>
        <div className={styles.simSectionHeader}>
          <h2 className={styles.simSectionTitle}>Choose a Simulation</h2>
          <p className={styles.simSectionSub}>
            Click any card to open the full interactive simulator
          </p>
        </div>

        <div className={styles.simGrid}>
          {SIMULATIONS.map((sim) => (
            <button
              key={sim.path}
              type="button"
              className={
                styles.simCard +
                (sim.status === "coming" ? " " + styles.simCardComingSoon : "")
              }
              onClick={() => sim.status === "ready" && navigate(sim.path)}
              disabled={sim.status === "coming"}
              title={sim.status === "coming" ? "Coming soon" : sim.title}
            >
              {sim.status === "coming" && (
                <span className={styles.comingBadge}>Coming Soon</span>
              )}

              <div
                className={styles.simIcon}
                style={{ background: sim.iconBg }}
              >
                <sim.IconComponent color={sim.iconColor} />
              </div>

              <h3 className={styles.simTitle}>{sim.title}</h3>

              <p className={styles.simDesc}>{sim.description}</p>

              <div className={styles.simTags}>
                {sim.tags.map((tag) => (
                  <span
                    key={tag}
                    className={styles.simTag}
                    style={{
                      color: sim.tagColor,
                      background: sim.tagBg,
                      border: `1px solid ${sim.tagColor}22`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {sim.status === "ready" && (
                <div
                  className={styles.simArrow}
                  style={{ color: sim.iconColor }}
                >
                  Open
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 4 }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;