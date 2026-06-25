import { useState, useCallback, useEffect } from "react";
import styles from "./VirtualMemory.module.css";

/* ═══════════════════════════════════════
   Types
═══════════════════════════════════════ */

type Algorithm = "FIFO" | "LRU" | "OPT" | "Clock" | "SecondChance" | "MFU";

interface PageTableEntry {
  page: number;
  frame: number | null;
  status: "Present" | "Not Loaded";
}

interface TLBEntry {
  page: number;
  frame: number;
  lastAccess: number;
}

interface FrameCell {
  page: number | null;
}

interface AccessLogEntry {
  step: number;
  page: number;
  tlbHit: boolean;
  pageFault: boolean;
  framesSnapshot: (number | null)[];
}

interface SimResult {
  pageTable: PageTableEntry[];
  tlb: TLBEntry[];
  frames: FrameCell[];
  pageFaults: number;
  tlbHits: number;
  tlbMisses: number;
  hitRatio: number;
  accessLog: AccessLogEntry[];
}

const ALGORITHMS: { label: string; value: Algorithm }[] = [
  { label: "FIFO — First In First Out", value: "FIFO" },
  { label: "LRU — Least Recently Used", value: "LRU" },
  { label: "OPT — Optimal", value: "OPT" },
  { label: "Clock", value: "Clock" },
  { label: "Second Chance", value: "SecondChance" },
  { label: "MFU — Most Frequently Used", value: "MFU" },
];

type PresetName =
  | "Basic Example"
  | "Moderate Load"
  | "Heavy Thrashing"
  | "Random Pattern"
  | "Custom";

interface WorkloadPreset {
  memorySize?: string;
  pageSize?: string;
  algorithm?: Algorithm;
  accessSequence?: string;
  description: string;
}

const PRESET_NAMES: PresetName[] = [
  "Basic Example",
  "Moderate Load",
  "Heavy Thrashing",
  "Random Pattern",
  "Custom",
];

const WORKLOAD_PRESETS: Record<PresetName, WorkloadPreset> = {
  "Basic Example": {
    memorySize: "64",
    pageSize: "16",
    algorithm: "FIFO",
    accessSequence: "1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5",
    description: "4 frames with light reuse — a gentle walkthrough of page faults and replacement.",
  },
  "Moderate Load": {
    memorySize: "128",
    pageSize: "16",
    algorithm: "LRU",
    accessSequence: "1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 9, 3, 4, 10, 5, 6, 1, 2",
    description: "8 frames with mixed locality — a balanced mix of TLB hits, misses, and faults.",
  },
  "Heavy Thrashing": {
    memorySize: "32",
    pageSize: "16",
    algorithm: "FIFO",
    accessSequence: "1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8",
    description: "Only 2 frames for 8 distinct pages — nearly every access faults (thrashing).",
  },
  "Random Pattern": {
    description: "Randomly generated memory size, page size, algorithm, and access sequence — different every time you select this preset.",
  },
  Custom: {
    description: "Set your own memory size, page size, algorithm, and access sequence below.",
  },
};

const SPEED_INTERVALS = [1400, 1000, 650, 350, 150];

/* ═══════════════════════════════════════
   Component
═══════════════════════════════════════ */

function VirtualMemory() {
  const [memorySize, setMemorySize] = useState("");
  const [pageSize, setPageSize] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm | "">("");
  const [accessSequence, setAccessSequence] = useState("");
  const [preset, setPreset] = useState<PresetName>("Custom");
  const [speed, setSpeed] = useState(3);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);

  const markCustom = useCallback(() => {
    setPreset((prev) => (prev === "Custom" ? prev : "Custom"));
  }, []);

  const handlePresetChange = (value: PresetName) => {
    setPreset(value);
    setResult(null);
    setStepIndex(null);
    setAutoPlay(false);

    if (value === "Random Pattern") {
      // Generate a fresh random config every time
      const pageSizeOptions = [8, 16, 32];
      const pg = pageSizeOptions[Math.floor(Math.random() * pageSizeOptions.length)];
      const frameCount = Math.floor(Math.random() * 5) + 3; // 3–7 frames
      const mem = pg * frameCount;
      const algoOptions: Algorithm[] = ["FIFO", "LRU", "OPT", "Clock", "SecondChance", "MFU"];
      const algo = algoOptions[Math.floor(Math.random() * algoOptions.length)];
      const pagePoolSize = frameCount + Math.floor(Math.random() * 4) + 2; // slightly more pages than frames
      const seqLength = Math.floor(Math.random() * 10) + 15; // 15–24 accesses
      const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * pagePoolSize));
      setMemorySize(String(mem));
      setPageSize(String(pg));
      setAlgorithm(algo);
      setAccessSequence(seq.join(", "));
      return;
    }

    const p = WORKLOAD_PRESETS[value];
    if (value !== "Custom") {
      if (p.memorySize !== undefined) setMemorySize(p.memorySize);
      if (p.pageSize !== undefined) setPageSize(p.pageSize);
      if (p.algorithm !== undefined) setAlgorithm(p.algorithm);
      if (p.accessSequence !== undefined) setAccessSequence(p.accessSequence);
    }
  };

  const handleRun = useCallback(async () => {
    setError("");

    const mem = parseInt(memorySize);
    const pg = parseInt(pageSize);
    if (!mem || mem <= 0) { setError("Enter a valid Memory Size (KB)."); return; }
    if (!pg || pg <= 0) { setError("Enter a valid Page Size (KB)."); return; }
    if (pg > mem) { setError("Page Size must be ≤ Memory Size."); return; }
    if (!algorithm) { setError("Select a Page Replacement Algorithm."); return; }

    const raw = accessSequence.split(",").map((s) => s.trim()).filter(Boolean);
    if (raw.length === 0) { setError("Enter at least one page number in the access sequence."); return; }
    const pages = raw.map(Number);
    if (pages.some(isNaN)) { setError("Access sequence must be comma-separated numbers."); return; }

    setIsLoading(true);
    setResult(null);
    setStepIndex(null);
    setAutoPlay(false);

    try {
      const response = await fetch("http://localhost:8000/virtual-memory/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memory_size: mem,
          page_size: pg,
          algorithm: algorithm,
          access_sequence: pages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.detail ?? `Server error: ${response.status}`);
        return;
      }

      const data: SimResult = await response.json();
      setResult(data);
    } catch {
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  }, [memorySize, pageSize, algorithm, accessSequence]);

  const handleReset = () => {
    setMemorySize("");
    setPageSize("");
    setAlgorithm("");
    setAccessSequence("");
    setPreset("Custom");
    setResult(null);
    setError("");
    setStepIndex(null);
    setShowLog(false);
    setAutoPlay(false);
  };

  const handleStep = () => {
    if (!result) return;
    setStepIndex((prev) => {
      if (prev === null) return 0;
      return Math.min(prev + 1, result.accessLog.length - 1);
    });
  };

  useEffect(() => {
    if (!autoPlay || !result) return;
    if (stepIndex !== null && stepIndex >= result.accessLog.length - 1) {
      setAutoPlay(false);
      return;
    }
    const interval = SPEED_INTERVALS[speed - 1] ?? SPEED_INTERVALS[2];
    const timer = setTimeout(() => {
      setStepIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, result.accessLog.length - 1)));
    }, interval);
    return () => clearTimeout(timer);
  }, [autoPlay, stepIndex, speed, result]);

  const activeLog = stepIndex !== null && result ? result.accessLog.slice(0, stepIndex + 1) : result?.accessLog ?? [];
  const activeFrames: (number | null)[] = stepIndex !== null && result
    ? result.accessLog[stepIndex].framesSnapshot
    : result?.frames.map((f) => f.page) ?? [];

  const numFrames = memorySize && pageSize
    ? Math.max(1, Math.floor(parseInt(memorySize) / parseInt(pageSize)))
    : 0;

  const FRAME_COLORS = [
    "#3B7A6A", "#7c5cbf", "#d9534f", "#e8a33c",
    "#4a8ec2", "#c74d8f", "#3aab8f", "#c27a4a",
    "#5c7abf", "#7abf5c", "#bf5c7a", "#5cbfb4",
  ];
  const pageColorMap = new Map<number, string>();
  if (result) {
    const uniquePages = [...new Set(result.accessLog.map((l) => l.page))].sort((a, b) => a - b);
    uniquePages.forEach((p, i) => pageColorMap.set(p, FRAME_COLORS[i % FRAME_COLORS.length]));
  }

  const SPEED_LABELS = ["Slowest", "Slow", "Normal", "Fast", "Fastest"];

  return (
    <div className={styles.vmApp}>
      <div className={styles.vmTitle}>
        <span className={styles.vmTitleText}>Virtual Memory Simulation</span>
      </div>

      <div className={styles.vmLayout}>
        <div className={styles.vmTopRow}>
          {/* ── Configure Simulation ── */}
          <section className={styles.vmPanel + " " + styles.vmConfigPanel}>
            <div className={styles.vmPanelHeader}>
              <div className={styles.vmPanelTitleRow}>
                <span className={styles.vmPanelIcon}>⚙</span>
                <h2 className={styles.vmPanelTitle}>Configure Simulation</h2>
              </div>
              <div className={styles.vmHeaderActions}>
                <button type="button" className={styles.vmRunBtn} onClick={handleRun} disabled={isLoading}>
                  {isLoading ? "Running…" : "▶ Run"}
                </button>
                <button type="button" className={styles.vmStepBtn} onClick={handleStep} disabled={!result || isLoading}>Step</button>
                <button type="button" className={styles.vmResetBtn} onClick={handleReset} disabled={isLoading}>↺ Reset</button>
              </div>
            </div>

            <div className={styles.vmConfigGrid}>
              <div className={styles.vmFieldGroupFull}>
                <label className={styles.vmLabel}>Workload Preset</label>
                <select className={styles.vmSelect} value={preset} onChange={(e) => handlePresetChange(e.target.value as PresetName)}>
                  {PRESET_NAMES.map((name) => (<option key={name} value={name}>{name}</option>))}
                </select>
                <p className={styles.vmPresetDesc}>{WORKLOAD_PRESETS[preset].description}</p>
              </div>

              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Page Replacement Algorithm</label>
                <select className={styles.vmSelect} value={algorithm} onChange={(e) => { setAlgorithm(e.target.value as Algorithm); setResult(null); markCustom(); }}>
                  <option value="">Select an Algorithm</option>
                  {ALGORITHMS.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                </select>
              </div>

              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Memory Size (KB)</label>
                <input className={styles.vmInput} type="number" min={1} placeholder="e.g., 1024" value={memorySize} onChange={(e) => { setMemorySize(e.target.value); setResult(null); markCustom(); }} />
              </div>

              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Page Size (KB)</label>
                <input className={styles.vmInput} type="number" min={1} placeholder="e.g., 32" value={pageSize} onChange={(e) => { setPageSize(e.target.value); setResult(null); markCustom(); }} />
              </div>

              {numFrames > 0 && (
                <div className={styles.vmFieldGroup}>
                  <label className={styles.vmLabel}>Frames Available</label>
                  <div className={styles.vmFramesPreview}>
                    <span className={styles.vmFramesCount}>{numFrames}</span>
                    <span className={styles.vmFramesLabel}>physical frames</span>
                  </div>
                </div>
              )}

              <div className={styles.vmFieldGroupFull}>
                <label className={styles.vmLabel}>Memory Access Sequence</label>
                <input className={styles.vmInput} type="text" placeholder="e.g., 1, 2, 3, 4, 5, 6, 7, 8, 9, 10" value={accessSequence} onChange={(e) => { setAccessSequence(e.target.value); setResult(null); markCustom(); }} />
                <p className={styles.vmHint}>Comma-separated page numbers</p>
              </div>
            </div>

            {error && <div className={styles.vmError}>{error}</div>}
          </section>

          {/* ── Simulation Summary ── */}
          <aside className={styles.vmRight}>
            <div className={styles.vmSummaryHeader}>
              <span className={styles.vmSummaryIcon}>◎</span>
              <h2 className={styles.vmSummaryTitle}>Simulation Summary</h2>
            </div>

            <div className={styles.vmSummaryBody}>
              {!result ? (
                <div className={styles.vmEmptyState}>
                  <div className={styles.vmEmptyIcon}>
                    <svg width="72" height="48" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="8" width="70" height="32" rx="5" stroke="#c0cdd4" strokeWidth="2" fill="none"/>
                      <rect x="6" y="13" width="10" height="22" rx="2" fill="#dde4e8"/>
                      <rect x="20" y="13" width="10" height="22" rx="2" fill="#dde4e8"/>
                      <rect x="34" y="13" width="10" height="22" rx="2" fill="#dde4e8"/>
                      <rect x="48" y="13" width="10" height="22" rx="2" fill="#dde4e8"/>
                      <rect x="60" y="13" width="6" height="22" rx="2" fill="#dde4e8"/>
                    </svg>
                  </div>
                  <p className={styles.vmEmptyText}>{isLoading ? "Running simulation…" : "Configure and run a simulation to see the summary"}</p>
                </div>
              ) : (
                <>
                  <div className={styles.vmSummaryConfig}>
                    <div className={styles.vmConfigTag}>{algorithm}</div>
                    <div className={styles.vmConfigTag}>{memorySize} KB memory</div>
                    <div className={styles.vmConfigTag}>{pageSize} KB pages</div>
                    <div className={styles.vmConfigTag}>{numFrames} frames</div>
                  </div>

                  <div className={styles.vmMetrics}>
                    <div className={styles.vmMetric}>
                      <div className={styles.vmMetricLabel}>Page Faults</div>
                      <div className={styles.vmMetricValue + " " + styles.vmMetricFault}>{result.pageFaults}</div>
                      <div className={styles.vmMetricSub}>of {result.accessLog.length} accesses</div>
                    </div>
                    <div className={styles.vmMetric}>
                      <div className={styles.vmMetricLabel}>TLB Hits</div>
                      <div className={styles.vmMetricValue + " " + styles.vmMetricHit}>{result.tlbHits}</div>
                      <div className={styles.vmMetricSub}>cache hits</div>
                    </div>
                    <div className={styles.vmMetric}>
                      <div className={styles.vmMetricLabel}>TLB Misses</div>
                      <div className={styles.vmMetricValue + " " + styles.vmMetricMiss}>{result.tlbMisses}</div>
                      <div className={styles.vmMetricSub}>cache misses</div>
                    </div>
                    <div className={styles.vmMetric}>
                      <div className={styles.vmMetricLabel}>Hit Ratio</div>
                      <div className={styles.vmMetricValue + " " + styles.vmMetricRatio}>{result.hitRatio.toFixed(1)}%</div>
                      <div className={styles.vmMetricSub}>TLB efficiency</div>
                    </div>
                  </div>

                  <div className={styles.vmRatioSection}>
                    <div className={styles.vmRatioLabel}><span>TLB Hit Ratio</span><span>{result.hitRatio.toFixed(1)}%</span></div>
                    <div className={styles.vmRatioBar}><div className={styles.vmRatioFill} style={{ width: result.hitRatio + "%" }} /></div>
                  </div>

                  <div className={styles.vmRatioSection}>
                    <div className={styles.vmRatioLabel}><span>Page Fault Rate</span><span>{((result.pageFaults / result.accessLog.length) * 100).toFixed(1)}%</span></div>
                    <div className={styles.vmRatioBar}><div className={styles.vmRatioFill + " " + styles.vmRatioFault} style={{ width: ((result.pageFaults / result.accessLog.length) * 100) + "%" }} /></div>
                  </div>

                  <div className={styles.vmLegendSection}>
                    <div className={styles.vmSectionLabel}>Page Legend</div>
                    <div className={styles.vmLegend}>
                      {[...pageColorMap.entries()].map(([page, color]) => (
                        <div key={page} className={styles.vmLegendItem}>
                          <span className={styles.vmLegendDot} style={{ background: color }} />
                          <span className={styles.vmLegendLabel}>Page {page}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className={styles.vmStepControls}>
                    <div className={styles.vmSectionLabel} style={{ marginBottom: 10 }}>Step Through</div>
                    <div className={styles.vmStepRow}>
                      <button
                        type="button"
                        className={styles.vmCtrlBtn}
                        disabled={stepIndex === null || stepIndex === 0}
                        onClick={() => { setAutoPlay(false); setStepIndex((p) => Math.max(0, (p ?? 1) - 1)); }}
                      >◀ Back</button>
                      <span className={styles.vmStepInfo}>
                        {stepIndex !== null ? `${stepIndex + 1} / ${result.accessLog.length}` : "Not stepping"}
                      </span>
                      <button
                        type="button"
                        className={styles.vmCtrlBtn}
                        disabled={stepIndex !== null && stepIndex >= result.accessLog.length - 1}
                        onClick={() => { setAutoPlay(false); handleStep(); }}
                      >Next ▶</button>
                    </div>

                    {/* Auto-Play row: button + speed dropdown side by side */}
                    <div className={styles.vmAutoPlayRow}>
                      <button
                        type="button"
                        className={styles.vmCtrlBtnSecondary + (autoPlay ? " " + styles.vmCtrlBtnActive : "")}
                        disabled={stepIndex !== null && stepIndex >= result.accessLog.length - 1}
                        onClick={() => setAutoPlay((v) => !v)}
                        style={{ flex: 1 }}
                      >
                        {autoPlay ? "⏸ Pause Auto-Play" : "▶ Auto-Play"}
                      </button>
                      <select
                        className={styles.vmSpeedSelect}
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        title="Auto-Play Speed"
                      >
                        {SPEED_LABELS.map((label, i) => (
                          <option key={i} value={i + 1}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {stepIndex !== null && (
                      <button
                        type="button"
                        className={styles.vmCtrlBtnSecondary}
                        onClick={() => { setAutoPlay(false); setStepIndex(null); }}
                      >Show Full Result</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {/* ── Memory Visualization (full width below) ── */}
        {result && (
          <section className={styles.vmPanel + " " + styles.vmVizPanel}>
            <div className={styles.vmPanelHeader}>
              <div className={styles.vmPanelTitleRow}>
                <span className={styles.vmPanelIcon}>◫</span>
                <h2 className={styles.vmPanelTitle}>Memory Visualization</h2>
              </div>
              {stepIndex !== null && (<div className={styles.vmStepBadge}>Step {stepIndex + 1} / {result.accessLog.length}</div>)}
            </div>

            <div className={styles.vmSectionLabel}>Frame Map</div>
            <div className={styles.vmFrameGrid}>
              {Array.from({ length: numFrames > 0 ? numFrames : result.frames.length }).map((_, i) => {
                const page = activeFrames[i] ?? null;
                const color = page !== null ? pageColorMap.get(page) ?? "#3B7A6A" : undefined;
                return (
                  <div key={i} className={styles.vmFrameCell + (page !== null ? " " + styles.vmFrameCellOccupied : "")} style={page !== null ? { background: color, borderColor: color } : {}}>
                    <span className={styles.vmFrameIdx}>F{i}</span>
                    <span className={styles.vmFramePage}>{page !== null ? `P${page}` : "—"}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.vmTablesRow}>
              <div className={styles.vmTableBlock}>
                <div className={styles.vmSectionLabel}>Page Table</div>
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead><tr><th>Page</th><th>Frame</th><th>Status</th></tr></thead>
                    <tbody>
                      {result.pageTable.map((entry) => {
                        const color = pageColorMap.get(entry.page);
                        return (
                          <tr key={entry.page}>
                            <td><span className={styles.vmPageBadge} style={{ background: color ?? "#e4e9ec", color: color ? "#fff" : "var(--text-secondary)" }}>P{entry.page}</span></td>
                            <td>{entry.frame !== null ? entry.frame : "—"}</td>
                            <td><span className={styles.vmStatus + " " + (entry.status === "Present" ? styles.vmStatusPresent : styles.vmStatusMissing)}>{entry.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={styles.vmTableBlock}>
                <div className={styles.vmSectionLabel}>TLB — Translation Lookaside Buffer</div>
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead><tr><th>Page</th><th>Frame</th><th>Last Access</th></tr></thead>
                    <tbody>
                      {result.tlb.length === 0 ? (
                        <tr><td colSpan={3} className={styles.vmEmptyCell}>No TLB entries</td></tr>
                      ) : (
                        result.tlb.map((entry, i) => {
                          const color = pageColorMap.get(entry.page);
                          return (
                            <tr key={i}>
                              <td><span className={styles.vmPageBadge} style={{ background: color ?? "#e4e9ec", color: color ? "#fff" : "var(--text-secondary)" }}>P{entry.page}</span></td>
                              <td>{entry.frame}</td>
                              <td>{entry.lastAccess}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className={styles.vmLogSection}>
              <button type="button" className={styles.vmLogToggle} onClick={() => setShowLog((v) => !v)}>
                {showLog ? "▲ Hide" : "▼ Show"} Access Log ({result.accessLog.length} accesses)
              </button>
              {showLog && (
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead><tr><th>#</th><th>Page</th><th>TLB</th><th>Page Fault</th><th>Frames State</th></tr></thead>
                    <tbody>
                      {activeLog.map((entry) => (
                        <tr key={entry.step}>
                          <td>{entry.step}</td>
                          <td><span className={styles.vmPageBadge} style={{ background: pageColorMap.get(entry.page) ?? "#e4e9ec", color: pageColorMap.get(entry.page) ? "#fff" : "var(--text-secondary)" }}>P{entry.page}</span></td>
                          <td><span className={styles.vmStatus + " " + (entry.tlbHit ? styles.vmStatusPresent : styles.vmStatusMissing)}>{entry.tlbHit ? "Hit" : "Miss"}</span></td>
                          <td>{entry.pageFault ? <span className={styles.vmFaultBadge}>Fault</span> : <span className={styles.vmNoFaultBadge}>—</span>}</td>
                          <td className={styles.vmFrameState}>
                            {entry.framesSnapshot.map((p, i) => (
                              <span key={i} className={styles.vmMiniFrame} style={p !== null ? { background: pageColorMap.get(p) ?? "#3B7A6A", color: "#fff" } : {}}>
                                {p !== null ? `P${p}` : "·"}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default VirtualMemory;