import { useState } from "react";
import "./CPU_Scheduling.css";

/* ── Types ── */
interface Process {
  id: string;
  burstTime: number;
  arrivalTime: number;
  priority: number;
}

interface GanttBlock {
  pid: string;
  start: number;
  end: number;
}

interface ProcessResult {
  id: string;
  arrivalTime: number;
  burstTime: number;
  startTime: number;
  completionTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

/* ── Algorithm list ── */
const ALGORITHMS = [
  { name: "First Come First Serve", abbr: "FCFS", hasPreemptive: false },
  { name: "Shortest Job First", abbr: "SJF", hasPreemptive: true },
  { name: "Round Robin", abbr: "RR", hasPreemptive: false },
  { name: "Priority Scheduling", abbr: "PRIORITY", hasPreemptive: true },
] as const;

const COMPARE_OPTIONS = [
  "First Come First Serve",
  "Shortest Job First (Non-preemptive)",
  "Shortest Job First (Preemptive)",
  "Round Robin",
  "Priority Scheduling (Non-preemptive)",
  "Priority Scheduling (Preemptive)"
] as const;

type AlgorithmName = (typeof ALGORITHMS)[number]["name"];

/* ── Colors ── */
const COLORS = 8;
const colorIndex = (i: number) => i % COLORS;



/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */

function CPU_Scheduling() {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmName>("First Come First Serve");
  const [isPreemptive, setIsPreemptive] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([
    { id: "P1", burstTime: 6, arrivalTime: 0, priority: 2 },
    { id: "P2", burstTime: 8, arrivalTime: 1, priority: 1 },
    { id: "P3", burstTime: 3, arrivalTime: 2, priority: 4 },
    { id: "P4", burstTime: 4, arrivalTime: 3, priority: 3 },
  ]);
  const [showResults, setShowResults] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"simulate" | "compare">("simulate");
  const [compareResults, setCompareResults] = useState<any[]>([]);
  const [compareSelection, setCompareSelection] = useState<string[]>([...COMPARE_OPTIONS]);
  const [loading, setLoading] = useState(false);
  const [quantum, setQuantum] = useState(2);
  const [nextId, setNextId] = useState(5);

  const [formPid, setFormPid] = useState("");
  const [formBurst, setFormBurst] = useState("");
  const [formArrival, setFormArrival] = useState("");
  const [formPriority, setFormPriority] = useState("");

  const currentAlgoDef = ALGORITHMS.find((a) => a.name === selectedAlgo)!;
  const isPriority = selectedAlgo === "Priority Scheduling";
  const isRR = selectedAlgo === "Round Robin";
  const processColorMap = new Map(processes.map((p, i) => [p.id, i]));

  /* ── Handlers ── */
  function addProcess() {
    const pid = formPid.trim() !== "" ? formPid.trim() : "P" + nextId;
    const burst = Number(formBurst) > 0 ? Number(formBurst) : 1;
    const arrival = Number(formArrival) >= 0 ? Number(formArrival) : 0;
    const priority = Number(formPriority) >= 0 ? Number(formPriority) : 0;

    for (const p of processes) {
      if (p.id === pid) {
        alert('Process "' + pid + '" already exists.');
        return;
      }
    }

    const newProcess: Process = { id: pid, burstTime: burst, arrivalTime: arrival, priority };
    setProcesses(function (prev) { return [...prev, newProcess]; });
    setNextId(function (prev) { return prev + 1; });
    setFormPid("");
    setFormBurst("");
    setFormArrival("");
    setFormPriority("");
    setShowResults(false);
  }

  function removeProcess(pid: string) {
    setProcesses(function (prev) { return prev.filter(function (p) { return p.id !== pid; }); });
    setShowResults(false);
  }

  function clearAll() {
    setProcesses([]);
    setNextId(1);
    setShowResults(false);
  }

  function loadSample() {
    setProcesses([
      { id: "P1", burstTime: 6, arrivalTime: 0, priority: 2 },
      { id: "P2", burstTime: 8, arrivalTime: 1, priority: 1 },
      { id: "P3", burstTime: 3, arrivalTime: 2, priority: 4 },
      { id: "P4", burstTime: 4, arrivalTime: 3, priority: 3 },
    ]);
    setNextId(5);
    setShowResults(false);
  }

  async function runSimulation() {
    if (processes.length === 0) return;
    setLoading(true);
    setShowResults(false);
    try {
      const response = await fetch("http://localhost:8000/api/cpu-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processes: processes,
          algorithm: selectedAlgo,
          preemptive: isPreemptive,
          quantum: quantum,
        }),
      });
      if (!response.ok) {
        alert("Backend error: " + response.statusText);
        return;
      }
      const data = await response.json();
      setSimulationResult(data);
      setShowResults(true);
    } catch (e) {
      console.error(e);
      alert("Failed to connect to backend. Make sure the FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  }

  async function runComparison() {
    if (processes.length === 0) return;
    setLoading(true);
    setCompareResults([]);
    try {
      const response = await fetch("http://localhost:8000/api/cpu-scheduling/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processes: processes,
          quantum: quantum,
        }),
      });
      if (!response.ok) {
        alert("Backend error: " + response.statusText);
        return;
      }
      const data = await response.json();
      setCompareResults(data.results);
    } catch (e) {
      console.error(e);
      alert("Failed to connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  /* ═══════ Render ═══════ */
  return (
    <div className="cpu-app">
      {/* Tabs */}
      <div className="cpu-tabs">
        <button type="button" className={"cpu-tab" + (activeTab === "simulate" ? " active" : "")} onClick={function () { setActiveTab("simulate"); }}>Algorithm Simulation</button>
        <button type="button" className={"cpu-tab" + (activeTab === "compare" ? " active" : "")} onClick={function () { setActiveTab("compare"); }}>Compare Algorithms</button>
      </div>

      {/* Main Content */}
      <div className="cpu-content">
        {/* Sidebar */}
        {/* Sidebar */}
        <aside className="cpu-sidebar">
          {activeTab === "simulate" ? (
            <>
              <h3>Select Algorithm</h3>
              {ALGORITHMS.map(function (algo) {
                return (
                  <button
                    type="button"
                    key={algo.name}
                    className={"cpu-algo-card" + (selectedAlgo === algo.name ? " selected" : "")}
                    onClick={function () {
                      setSelectedAlgo(algo.name);
                      setIsPreemptive(false);
                      setShowResults(false);
                    }}
                  >
                    {algo.name}
                    <span className="algo-abbr">{algo.abbr}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <>
              <h3>Algorithms to Compare</h3>
              <div style={{ display: "flex", flexDirection: "column", marginTop: "16px" }}>
                {[
                  { name: "First Come First Serve", abbr: "FCFS" },
                  { name: "Shortest Job First (Non-preemptive)", abbr: "SJF-NP" },
                  { name: "Shortest Job First (Preemptive)", abbr: "SJF-P" },
                  { name: "Round Robin", abbr: "RR" },
                  { name: "Priority Scheduling (Non-preemptive)", abbr: "PS-NP" },
                  { name: "Priority Scheduling (Preemptive)", abbr: "PS-P" }
                ].map((algo) => {
                  const isSelected = compareSelection.includes(algo.name);
                  return (
                    <button
                      type="button"
                      key={algo.name}
                      className={"cpu-algo-card" + (isSelected ? " selected" : "")}
                      onClick={() => {
                        if (isSelected) {
                          setCompareSelection(prev => prev.filter(name => name !== algo.name));
                        } else {
                          setCompareSelection(prev => [...prev, algo.name]);
                        }
                      }}
                      style={{ marginBottom: "8px", padding: "12px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <span style={{ fontSize: "14px", lineHeight: "1.2" }}>{algo.name}</span>
                      <span className="algo-abbr" style={{ fontSize: "10px", padding: "2px 6px" }}>{algo.abbr}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>

        {/* Task Manager */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          <section className="cpu-task-manager">
            <div className="cpu-task-header">
              <div>
                <h2>Task Manager</h2>
                <p>Add, edit, or remove processes for simulation</p>
              </div>
              <div className="cpu-controls">
                <button type="button" className="cpu-ctrl-btn" onClick={loadSample}>📋 Sample</button>
                <button type="button" className="cpu-ctrl-btn danger-btn" onClick={clearAll}>🗑 Clear</button>
                <button
                  type="button"
                  className="cpu-ctrl-btn run-btn"
                  onClick={activeTab === "simulate" ? runSimulation : runComparison}
                  disabled={processes.length === 0 || loading}
                >
                  {loading ? "⌛ Running..." : (activeTab === "simulate" ? "▶ Run" : "▶ Compare")}
                </button>
              </div>
            </div>

            {/* Preemptive toggle */}
            {activeTab === "simulate" && currentAlgoDef.hasPreemptive && (
              <div className="cpu-preemptive-toggle">
                <button
                  type="button"
                  className={"cpu-toggle-btn" + (!isPreemptive ? " active" : "")}
                  onClick={function () { setIsPreemptive(false); setShowResults(false); }}
                >
                  Non-Preemptive
                </button>
                <button
                  type="button"
                  className={"cpu-toggle-btn" + (isPreemptive ? " active" : "")}
                  onClick={function () { setIsPreemptive(true); setShowResults(false); }}
                >
                  Preemptive
                  {selectedAlgo === "Shortest Job First" && <span className="toggle-hint"> (SRTF)</span>}
                </button>
              </div>
            )}

            {/* Quantum */}
            {(isRR || activeTab === "compare") && (
              <div className="cpu-quantum-section">
                <label>Time Quantum (for Round Robin):</label>
                <input
                  type="number"
                  min={1}
                  value={quantum}
                  onChange={function (e) {
                    setQuantum(Math.max(1, parseInt(e.target.value) || 1));
                    setShowResults(false);
                    setCompareResults([]);
                  }}
                />
              </div>
            )}

            {/* Input Form */}
            <div className="cpu-task-form">
              <div className="cpu-input-group">
                <label>Process ID</label>
                <input
                  placeholder={"P" + nextId}
                  value={formPid}
                  onChange={function (e) { setFormPid(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              <div className="cpu-input-group">
                <label>Burst Time</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  min={1}
                  value={formBurst}
                  onChange={function (e) { setFormBurst(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              <div className="cpu-input-group">
                <label>Arrival Time</label>
                <input
                  type="number"
                  placeholder="e.g. 0"
                  min={0}
                  value={formArrival}
                  onChange={function (e) { setFormArrival(e.target.value); }}
                  onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                />
              </div>
              {isPriority && (
                <div className="cpu-input-group">
                  <label>Priority</label>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    min={0}
                    value={formPriority}
                    onChange={function (e) { setFormPriority(e.target.value); }}
                    onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addProcess(); } }}
                  />
                </div>
              )}
              <button type="button" className="cpu-add-btn" onClick={function () { addProcess(); }}>+</button>
            </div>

            {/* Process Table */}
            <div className="cpu-table-container">
              {processes.length === 0 ? (
                <div className="cpu-empty-state">
                  <div className="cpu-empty-icon">⚙️</div>
                  <h4>No processes yet</h4>
                  <p>Add processes above or load sample data to get started</p>
                </div>
              ) : (
                <table className="cpu-table">
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Burst Time</th>
                      <th>Arrival Time</th>
                      {isPriority && <th>Priority</th>}
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map(function (p, i) {
                      return (
                        <tr key={p.id}>
                          <td>
                            <span className="cpu-process-id">
                              <span className={"cpu-process-dot dot-color-" + colorIndex(i)} />
                              {p.id}
                            </span>
                          </td>
                          <td>{p.burstTime}</td>
                          <td>{p.arrivalTime}</td>
                          {isPriority && <td>{p.priority}</td>}
                          <td>
                            <button
                              type="button"
                              className="cpu-delete-btn"
                              onClick={function () { removeProcess(p.id); }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Results: Simulation */}
          {activeTab === "simulate" && showResults && simulationResult && (
            <section className="cpu-results">
              <div className="cpu-results-header">
                <div>
                  <h2>Simulation Results</h2>
                  <p className="cpu-results-algo-label">
                    {selectedAlgo}
                    {currentAlgoDef.hasPreemptive && (isPreemptive ? " (Preemptive)" : " (Non-Preemptive)")}
                    {isRR && " · Q=" + quantum}
                  </p>
                </div>
                <div className="cpu-metrics">
                  <div className="cpu-metric">
                    <div className="cpu-metric-label">Avg Waiting</div>
                    <div className="cpu-metric-value">{simulationResult.avgWaiting.toFixed(2)}</div>
                  </div>
                  <div className="cpu-metric">
                    <div className="cpu-metric-label">Avg Turnaround</div>
                    <div className="cpu-metric-value">{simulationResult.avgTurnaround.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Gantt Chart */}
              <div className="cpu-gantt-wrapper">
                <div className="cpu-gantt">
                  {simulationResult.gantt.map(function (block: GanttBlock, i: number) {
                    const isIdle = block.pid === "idle";
                    const ci = isIdle ? 0 : (processColorMap.get(block.pid) ?? 0);
                    const widthUnits = block.end - block.start;
                    return (
                      <div
                        key={block.pid + "-" + block.start + "-" + i}
                        className={"cpu-gantt-block " + (isIdle ? "idle-block" : "process-color-" + ci)}
                        style={{ flex: widthUnits, animationDelay: i * 0.06 + "s" }}
                      >
                        {isIdle ? "—" : block.pid}
                        <span className="cpu-gantt-time">{block.start}–{block.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detail Table */}
              <div className="cpu-result-table-wrapper">
                <h3>Process Details</h3>
                <table className="cpu-result-table">
                  <thead>
                    <tr>
                      <th>Process</th>
                      <th>Arrival</th>
                      <th>Burst</th>
                      <th>Start</th>
                      <th>Completion</th>
                      <th>Waiting</th>
                      <th>Turnaround</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.details.map(function (d: ProcessResult) {
                      return (
                        <tr key={d.id}>
                          <td>{d.id}</td>
                          <td>{d.arrivalTime}</td>
                          <td>{d.burstTime}</td>
                          <td>{d.startTime}</td>
                          <td>{d.completionTime}</td>
                          <td>{d.waitingTime}</td>
                          <td>{d.turnaroundTime}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Results: Comparison */}
          {activeTab === "compare" && compareResults.length > 0 && (
            <section className="cpu-comparison-results">
              <h2>Algorithm Comparison</h2>
              <div className="cpu-metrics">
                <table className="cpu-table" style={{ width: "100%", marginTop: "16px" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>Algorithm</th>
                      <th>Avg Waiting Time</th>
                      <th>Avg Turnaround Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareResults
                      .filter(res => compareSelection.includes(res.algorithm))
                      .sort((a, b) => a.avgWaiting - b.avgWaiting)
                      .map((res, i) => (
                      <tr key={res.algorithm} style={{ backgroundColor: i === 0 ? "rgba(46, 204, 113, 0.1)" : "transparent" }}>
                        <td style={{ textAlign: "left", fontWeight: i === 0 ? "bold" : "normal" }}>
                          {i === 0 ? "🏆 " : ""}{res.algorithm}
                        </td>
                        <td style={{ color: i === 0 ? "var(--success)" : "inherit", fontWeight: i === 0 ? "bold" : "normal" }}>{res.avgWaiting.toFixed(2)}</td>
                        <td>{res.avgTurnaround.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ marginTop: "16px", color: "var(--text-light)" }}>
                The algorithm with the lowest Average Waiting Time is highlighted in green.
              </p>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

export default CPU_Scheduling;