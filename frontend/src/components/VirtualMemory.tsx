import { useState, useCallback, useEffect } from "react";
import styles from "./VirtualMemory.module.css";

/* ═══════════════════════════════════════
   Types
═══════════════════════════════════════ */

type Algorithm = "FIFO" | "LRU" | "OPT" | "Clock" | "SecondChance";

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
];

const TLB_SIZE = 4;

/* ── Workload Presets ── */

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
    description:
      "4 frames with light reuse — a gentle walkthrough of page faults and replacement.",
  },
  "Moderate Load": {
    memorySize: "128",
    pageSize: "16",
    algorithm: "LRU",
    accessSequence: "1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 9, 3, 4, 10, 5, 6, 1, 2",
    description:
      "8 frames with mixed locality — a balanced mix of TLB hits, misses, and faults.",
  },
  "Heavy Thrashing": {
    memorySize: "32",
    pageSize: "16",
    algorithm: "FIFO",
    accessSequence:
      "1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8",
    description:
      "Only 2 frames for 8 distinct pages — nearly every access faults (thrashing).",
  },
  "Random Pattern": {
    memorySize: "96",
    pageSize: "16",
    algorithm: "OPT",
    accessSequence: "7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1",
    description:
      "6 frames with an irregular reference string — good for comparing OPT against FIFO/LRU.",
  },
  Custom: {
    description:
      "Set your own memory size, page size, algorithm, and access sequence below.",
  },
};

/* Step interval (ms) for each speed level, slow → fast */
const SPEED_INTERVALS = [1400, 1000, 650, 350, 150];

/* ═══════════════════════════════════════
   Simulation Logic
═══════════════════════════════════════ */

function simulateFIFO(pages: number[], numFrames: number) {
  const frames: (number | null)[] = Array(numFrames).fill(null);
  const queue: number[] = [];
  let faults = 0;
  const log: { page: number; fault: boolean; snap: (number | null)[] }[] = [];

  for (const page of pages) {
    if (frames.includes(page)) {
      log.push({ page, fault: false, snap: [...frames] });
    } else {
      faults++;
      if (queue.length < numFrames) {
        const emptyIdx = frames.indexOf(null);
        frames[emptyIdx] = page;
        queue.push(page);
      } else {
        const evict = queue.shift()!;
        const idx = frames.indexOf(evict);
        frames[idx] = page;
        queue.push(page);
      }
      log.push({ page, fault: true, snap: [...frames] });
    }
  }
  return { frames, faults, log };
}

function simulateLRU(pages: number[], numFrames: number) {
  const frames: (number | null)[] = Array(numFrames).fill(null);
  const recency: number[] = [];
  let faults = 0;
  const log: { page: number; fault: boolean; snap: (number | null)[] }[] = [];

  for (const page of pages) {
    if (frames.includes(page)) {
      const i = recency.indexOf(page);
      if (i !== -1) recency.splice(i, 1);
      recency.push(page);
      log.push({ page, fault: false, snap: [...frames] });
    } else {
      faults++;
      if (frames.includes(null)) {
        const emptyIdx = frames.indexOf(null);
        frames[emptyIdx] = page;
      } else {
        const lru = recency.shift()!;
        const idx = frames.indexOf(lru);
        frames[idx] = page;
      }
      recency.push(page);
      log.push({ page, fault: true, snap: [...frames] });
    }
  }
  return { frames, faults, log };
}

function simulateOPT(pages: number[], numFrames: number) {
  const frames: (number | null)[] = Array(numFrames).fill(null);
  let faults = 0;
  const log: { page: number; fault: boolean; snap: (number | null)[] }[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (frames.includes(page)) {
      log.push({ page, fault: false, snap: [...frames] });
    } else {
      faults++;
      if (frames.includes(null)) {
        frames[frames.indexOf(null)] = page;
      } else {
        const nextUse = frames.map((f) => {
          const idx = pages.indexOf(f!, i + 1);
          return idx === -1 ? Infinity : idx;
        });
        const evictIdx = nextUse.indexOf(Math.max(...nextUse));
        frames[evictIdx] = page;
      }
      log.push({ page, fault: true, snap: [...frames] });
    }
  }
  return { frames, faults, log };
}

function simulateClock(pages: number[], numFrames: number) {
  const frames: (number | null)[] = Array(numFrames).fill(null);
  const refBits: boolean[] = Array(numFrames).fill(false);
  let pointer = 0;
  let faults = 0;
  const log: { page: number; fault: boolean; snap: (number | null)[] }[] = [];

  for (const page of pages) {
    const idx = frames.indexOf(page);
    if (idx !== -1) {
      refBits[idx] = true;
      log.push({ page, fault: false, snap: [...frames] });
    } else {
      faults++;
      while (refBits[pointer]) {
        refBits[pointer] = false;
        pointer = (pointer + 1) % numFrames;
      }
      frames[pointer] = page;
      refBits[pointer] = true;
      pointer = (pointer + 1) % numFrames;
      log.push({ page, fault: true, snap: [...frames] });
    }
  }
  return { frames, faults, log };
}

function simulateSecondChance(pages: number[], numFrames: number) {
  // Second Chance behaves like Clock for this simulation
  return simulateClock(pages, numFrames);
}

function runSimulation(
  pages: number[],
  memoryKB: number,
  pageSizeKB: number,
  algorithm: Algorithm
): SimResult {
  const numFrames = Math.max(1, Math.floor(memoryKB / pageSizeKB));

  let result: { frames: (number | null)[]; faults: number; log: { page: number; fault: boolean; snap: (number | null)[] }[] };

  switch (algorithm) {
    case "FIFO": result = simulateFIFO(pages, numFrames); break;
    case "LRU": result = simulateLRU(pages, numFrames); break;
    case "OPT": result = simulateOPT(pages, numFrames); break;
    case "Clock": result = simulateClock(pages, numFrames); break;
    case "SecondChance": result = simulateSecondChance(pages, numFrames); break;
  }

  // Build TLB simulation (LRU policy for TLB always)
  const tlbMap = new Map<number, number>(); // page -> frame
  const tlbOrder: number[] = [];
  let tlbHits = 0;
  let tlbMisses = 0;
  const accessLog: AccessLogEntry[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const isFault = result.log[i].fault;

    if (tlbMap.has(page)) {
      tlbHits++;
      const idx = tlbOrder.indexOf(page);
      if (idx !== -1) tlbOrder.splice(idx, 1);
      tlbOrder.push(page);
      accessLog.push({ step: i + 1, page, tlbHit: true, pageFault: isFault, framesSnapshot: result.log[i].snap });
    } else {
      tlbMisses++;
      // Find frame for this page
      const frame = result.log[i].snap.indexOf(page);
      if (frame !== -1) {
        if (tlbOrder.length >= TLB_SIZE) {
          const evicted = tlbOrder.shift()!;
          tlbMap.delete(evicted);
        }
        tlbMap.set(page, frame);
        tlbOrder.push(page);
      }
      accessLog.push({ step: i + 1, page, tlbHit: false, pageFault: isFault, framesSnapshot: result.log[i].snap });
    }
  }

  // Build page table from final state
  const uniquePages = [...new Set(pages)].sort((a, b) => a - b);
  const pageTable: PageTableEntry[] = uniquePages.map((p) => {
    const frameIdx = result.frames.indexOf(p);
    return {
      page: p,
      frame: frameIdx !== -1 ? frameIdx : null,
      status: frameIdx !== -1 ? "Present" : "Not Loaded",
    };
  });

  // Build TLB final state
  const tlbEntries: TLBEntry[] = tlbOrder.map((page, i) => ({
    page,
    frame: tlbMap.get(page)!,
    lastAccess: i + 1,
  }));

  const frames: FrameCell[] = result.frames.map((p) => ({ page: p }));
  const total = tlbHits + tlbMisses;
  const hitRatio = total > 0 ? (tlbHits / total) * 100 : 0;

  return {
    pageTable,
    tlb: tlbEntries,
    frames,
    pageFaults: result.faults,
    tlbHits,
    tlbMisses,
    hitRatio,
    accessLog,
  };
}

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

  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState("");
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [showLog, setShowLog] = useState(false);

  /* Mark the preset as "Custom" whenever the user edits a field directly */
  const markCustom = useCallback(() => {
    setPreset((prev) => (prev === "Custom" ? prev : "Custom"));
  }, []);

  const handlePresetChange = (value: PresetName) => {
    setPreset(value);
    setResult(null);
    setStepIndex(null);
    setAutoPlay(false);
    const p = WORKLOAD_PRESETS[value];
    if (value !== "Custom") {
      if (p.memorySize !== undefined) setMemorySize(p.memorySize);
      if (p.pageSize !== undefined) setPageSize(p.pageSize);
      if (p.algorithm !== undefined) setAlgorithm(p.algorithm);
      if (p.accessSequence !== undefined) setAccessSequence(p.accessSequence);
    }
  };

  const handleRun = useCallback(() => {
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

    const sim = runSimulation(pages, mem, pg, algorithm);
    setResult(sim);
    setStepIndex(null);
    setAutoPlay(false);
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

  /* Auto-play stepping, driven by the speed slider */
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
      {/* Page Title */}
      <div className={styles.vmTitle}>
        <span className={styles.vmTitleText}>Virtual Memory Simulation</span>
      </div>

      {/* Main Layout */}
      <div className={styles.vmLayout}>
        {/* ── Top row: Configuration + Summary, equal width ── */}
        <div className={styles.vmTopRow}>
          {/* Config Panel */}
          <section className={styles.vmPanel + " " + styles.vmConfigPanel}>
            <div className={styles.vmPanelHeader}>
              <div className={styles.vmPanelTitleRow}>
                <span className={styles.vmPanelIcon}>⚙</span>
                <h2 className={styles.vmPanelTitle}>Configure Simulation</h2>
              </div>
              <div className={styles.vmHeaderActions}>
                <button type="button" className={styles.vmRunBtn} onClick={handleRun}>▶ Run</button>
                <button type="button" className={styles.vmStepBtn} onClick={handleStep} disabled={!result}>Step</button>
                <button type="button" className={styles.vmResetBtn} onClick={handleReset}>↺ Reset</button>
              </div>
            </div>

            <div className={styles.vmConfigGrid}>
              {/* Workload Preset */}
              <div className={styles.vmFieldGroupFull}>
                <label className={styles.vmLabel}>Workload Preset</label>
                <select
                  className={styles.vmSelect}
                  value={preset}
                  onChange={(e) => handlePresetChange(e.target.value as PresetName)}
                >
                  {PRESET_NAMES.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <p className={styles.vmPresetDesc}>{WORKLOAD_PRESETS[preset].description}</p>
              </div>

              {/* Algorithm selector */}
              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Page Replacement Algorithm</label>
                <select
                  className={styles.vmSelect}
                  value={algorithm}
                  onChange={(e) => { setAlgorithm(e.target.value as Algorithm); setResult(null); markCustom(); }}
                >
                  <option value="">Select an Algorithm</option>
                  {ALGORITHMS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              {/* Memory Size */}
              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Memory Size (KB)</label>
                <input
                  className={styles.vmInput}
                  type="number"
                  min={1}
                  placeholder="e.g., 1024"
                  value={memorySize}
                  onChange={(e) => { setMemorySize(e.target.value); setResult(null); markCustom(); }}
                />
              </div>

              {/* Page Size */}
              <div className={styles.vmFieldGroup}>
                <label className={styles.vmLabel}>Page Size (KB)</label>
                <input
                  className={styles.vmInput}
                  type="number"
                  min={1}
                  placeholder="e.g., 32"
                  value={pageSize}
                  onChange={(e) => { setPageSize(e.target.value); setResult(null); markCustom(); }}
                />
              </div>

              {/* Frames preview */}
              {numFrames > 0 && (
                <div className={styles.vmFieldGroup}>
                  <label className={styles.vmLabel}>Frames Available</label>
                  <div className={styles.vmFramesPreview}>
                    <span className={styles.vmFramesCount}>{numFrames}</span>
                    <span className={styles.vmFramesLabel}>physical frames</span>
                  </div>
                </div>
              )}

              {/* Access Sequence */}
              <div className={styles.vmFieldGroupFull}>
                <label className={styles.vmLabel}>Memory Access Sequence</label>
                <input
                  className={styles.vmInput}
                  type="text"
                  placeholder="e.g., 1, 2, 3, 4, 5, 6, 7, 8, 9, 10"
                  value={accessSequence}
                  onChange={(e) => { setAccessSequence(e.target.value); setResult(null); markCustom(); }}
                />
                <p className={styles.vmHint}>Comma-separated page numbers</p>
              </div>

              {/* Simulation Speed */}
              <div className={styles.vmFieldGroupFull}>
                <label className={styles.vmLabel}>Simulation Speed</label>
                <div className={styles.vmSliderRow}>
                  <span className={styles.vmSliderEdgeLabel}>Slow</span>
                  <input
                    className={styles.vmSlider}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value))}
                  />
                  <span className={styles.vmSliderEdgeLabel}>Fast</span>
                </div>
                <p className={styles.vmHint}>{SPEED_LABELS[speed - 1]} — controls Step / Auto-Play pacing</p>
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
                      <text x="66" y="6" fontSize="18" fill="#c0cdd4" fontFamily="sans-serif" fontWeight="bold">!</text>
                    </svg>
                  </div>
                  <p className={styles.vmEmptyText}>Configure and run a simulation to see the summary</p>
                </div>
              ) : (
                <>
                  {/* Config recap */}
                  <div className={styles.vmSummaryConfig}>
                    <div className={styles.vmConfigTag}>{algorithm}</div>
                    <div className={styles.vmConfigTag}>{memorySize} KB memory</div>
                    <div className={styles.vmConfigTag}>{pageSize} KB pages</div>
                    <div className={styles.vmConfigTag}>{numFrames} frames</div>
                  </div>

                  {/* Metric cards */}
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

                  {/* Hit ratio bar */}
                  <div className={styles.vmRatioSection}>
                    <div className={styles.vmRatioLabel}>
                      <span>TLB Hit Ratio</span>
                      <span>{result.hitRatio.toFixed(1)}%</span>
                    </div>
                    <div className={styles.vmRatioBar}>
                      <div
                        className={styles.vmRatioFill}
                        style={{ width: result.hitRatio + "%" }}
                      />
                    </div>
                  </div>

                  {/* Fault rate bar */}
                  <div className={styles.vmRatioSection}>
                    <div className={styles.vmRatioLabel}>
                      <span>Page Fault Rate</span>
                      <span>{((result.pageFaults / result.accessLog.length) * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.vmRatioBar}>
                      <div
                        className={styles.vmRatioFill + " " + styles.vmRatioFault}
                        style={{ width: ((result.pageFaults / result.accessLog.length) * 100) + "%" }}
                      />
                    </div>
                  </div>

                  {/* Page color legend */}
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

                  {/* Step controls in summary */}
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
                    <button
                      type="button"
                      className={styles.vmCtrlBtnSecondary + (autoPlay ? " " + styles.vmCtrlBtnActive : "")}
                      disabled={stepIndex !== null && stepIndex >= result.accessLog.length - 1}
                      onClick={() => setAutoPlay((v) => !v)}
                    >
                      {autoPlay ? "⏸ Pause Auto-Play" : "▶ Auto-Play"}
                    </button>
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

        {/* ── Visualization Panel (full width) ── */}
        {result && (
          <section className={styles.vmPanel + " " + styles.vmVizPanel}>
            <div className={styles.vmPanelHeader}>
              <div className={styles.vmPanelTitleRow}>
                <span className={styles.vmPanelIcon}>◫</span>
                <h2 className={styles.vmPanelTitle}>Memory Visualization</h2>
              </div>
              {stepIndex !== null && (
                <div className={styles.vmStepBadge}>
                  Step {stepIndex + 1} / {result.accessLog.length}
                </div>
              )}
            </div>

            {/* Frame Grid */}
            <div className={styles.vmSectionLabel}>Frame Map</div>
            <div className={styles.vmFrameGrid}>
              {Array.from({ length: numFrames > 0 ? numFrames : result.frames.length }).map((_, i) => {
                const page = activeFrames[i] ?? null;
                const color = page !== null ? pageColorMap.get(page) ?? "#3B7A6A" : undefined;
                return (
                  <div
                    key={i}
                    className={styles.vmFrameCell + (page !== null ? " " + styles.vmFrameCellOccupied : "")}
                    style={page !== null ? { background: color, borderColor: color } : {}}
                  >
                    <span className={styles.vmFrameIdx}>F{i}</span>
                    <span className={styles.vmFramePage}>{page !== null ? `P${page}` : "—"}</span>
                  </div>
                );
              })}
            </div>

            {/* Two-col: Page Table + TLB */}
            <div className={styles.vmTablesRow}>
              {/* Page Table */}
              <div className={styles.vmTableBlock}>
                <div className={styles.vmSectionLabel}>Page Table</div>
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Frame</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.pageTable.map((entry) => {
                        const color = pageColorMap.get(entry.page);
                        return (
                          <tr key={entry.page}>
                            <td>
                              <span className={styles.vmPageBadge} style={{ background: color ?? "#e4e9ec", color: color ? "#fff" : "var(--text-secondary)" }}>
                                P{entry.page}
                              </span>
                            </td>
                            <td>{entry.frame !== null ? entry.frame : "—"}</td>
                            <td>
                              <span className={styles.vmStatus + " " + (entry.status === "Present" ? styles.vmStatusPresent : styles.vmStatusMissing)}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TLB */}
              <div className={styles.vmTableBlock}>
                <div className={styles.vmSectionLabel}>TLB — Translation Lookaside Buffer</div>
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead>
                      <tr>
                        <th>Page</th>
                        <th>Frame</th>
                        <th>Last Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.tlb.length === 0 ? (
                        <tr><td colSpan={3} className={styles.vmEmptyCell}>No TLB entries</td></tr>
                      ) : (
                        result.tlb.map((entry, i) => {
                          const color = pageColorMap.get(entry.page);
                          return (
                            <tr key={i}>
                              <td>
                                <span className={styles.vmPageBadge} style={{ background: color ?? "#e4e9ec", color: color ? "#fff" : "var(--text-secondary)" }}>
                                  P{entry.page}
                                </span>
                              </td>
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

            {/* Access Log toggle */}
            <div className={styles.vmLogSection}>
              <button
                type="button"
                className={styles.vmLogToggle}
                onClick={() => setShowLog((v) => !v)}
              >
                {showLog ? "▲ Hide" : "▼ Show"} Access Log ({result.accessLog.length} accesses)
              </button>
              {showLog && (
                <div className={styles.vmTableWrap}>
                  <table className={styles.vmTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Page</th>
                        <th>TLB</th>
                        <th>Page Fault</th>
                        <th>Frames State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeLog.map((entry) => (
                        <tr key={entry.step}>
                          <td>{entry.step}</td>
                          <td>
                            <span className={styles.vmPageBadge} style={{ background: pageColorMap.get(entry.page) ?? "#e4e9ec", color: pageColorMap.get(entry.page) ? "#fff" : "var(--text-secondary)" }}>
                              P{entry.page}
                            </span>
                          </td>
                          <td>
                            <span className={styles.vmStatus + " " + (entry.tlbHit ? styles.vmStatusPresent : styles.vmStatusMissing)}>
                              {entry.tlbHit ? "Hit" : "Miss"}
                            </span>
                          </td>
                          <td>
                            {entry.pageFault
                              ? <span className={styles.vmFaultBadge}>Fault</span>
                              : <span className={styles.vmNoFaultBadge}>—</span>}
                          </td>
                          <td className={styles.vmFrameState}>
                            {entry.framesSnapshot.map((p, i) => (
                              <span
                                key={i}
                                className={styles.vmMiniFrame}
                                style={p !== null ? { background: pageColorMap.get(p) ?? "#3B7A6A", color: "#fff" } : {}}
                              >
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