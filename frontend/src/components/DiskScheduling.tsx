import React, { useEffect, useMemo, useRef, useState } from "react";
import "./DiskScheduling.css";

interface SeekMovement {
  step: number;
  from: number;
  to: number;
  distance: number;
}

type DiskAlgorithm = "CHOOSE ALGORITHM" | "FCFS" | "SSTF" | "SCAN" | "C-SCAN" | "LOOK" | "C-LOOK";
type DiskDirection = "towards-0" | "towards-roof";

const ALGORITHMS: { label: string; value: DiskAlgorithm; abbr: string }[] = [
  { label: "Choose Algorithm", value: "CHOOSE ALGORITHM", abbr: "None" },
  { label: "First Come, First Served", value: "FCFS", abbr: "FCFS" },
  { label: "Shortest Seek Time First", value: "SSTF", abbr: "SSTF" },
  { label: "SCAN / Elevator", value: "SCAN", abbr: "SCAN" },
  { label: "Circular SCAN", value: "C-SCAN", abbr: "C-SCAN" },
  { label: "LOOK", value: "LOOK", abbr: "LOOK" },
  { label: "Circular LOOK", value: "C-LOOK", abbr: "C-LOOK" },
];

const DISK_MIN = 0;
const DEFAULT_INITIAL_HEAD = 53;
const DEFAULT_MAX_TRACK = 200;
const ALGORITHMS_REQUIRING_DIRECTION: DiskAlgorithm[] = ["SCAN", "C-SCAN", "LOOK", "C-LOOK"];

const DIRECTION_OPTIONS: { label: string; value: DiskDirection }[] = [
  { label: "Towards 0", value: "towards-0" },
  { label: "Towards Roof", value: "towards-roof" },
];

const STEP_COLORS = [
  "#4a6cf7", // blue
  "#7c5cbf", // purple
  "#3B7A6A", // teal/green
  "#e8a33c", // orange/yellow
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#10b981", // emerald green
];

function parseQueue(input: string): number[] {
  return input
    .split(",")
    .map(function (value) {
      return parseInt(value.trim(), 10);
    })
    .filter(function (value) {
      return !isNaN(value) && value >= DISK_MIN;
    });
}

// Backend algorithms are now handled on the server side

export const DiskScheduling: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>("CHOOSE ALGORITHM");
  const [direction, setDirection] = useState<DiskDirection>("towards-roof");
  const [queueInput, setQueueInput] = useState<string>("");
  const [initialHead, setInitialHead] = useState<number | "">(DEFAULT_INITIAL_HEAD);
  const [displayedInitialHead, setDisplayedInitialHead] = useState<number | "">(DEFAULT_INITIAL_HEAD);
  const [maxTrackInput, setMaxTrackInput] = useState<string>("");
  const [maxTrack, setMaxTrack] = useState<number>(DEFAULT_MAX_TRACK);
  const [sequence, setSequence] = useState<number[]>([]);
  const [movements, setMovements] = useState<SeekMovement[]>([]);
  const [totalMovement, setTotalMovement] = useState<number>(0);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedAlgorithm = useMemo(function () {
    return ALGORITHMS.find(function (item) { return item.value === algorithm; })!;
  }, [algorithm]);

  const showsDirectionInput = ALGORITHMS_REQUIRING_DIRECTION.includes(algorithm);

  async function handleExecuteRun(e?: React.FormEvent, isMount = false) {
    if (e) e.preventDefault();

    if (algorithm === "CHOOSE ALGORITHM") {
      if (!isMount) {
        alert("Please select a disk scheduling algorithm.");
      }
      return;
    }

    const parsedQueue = parseQueue(queueInput);
    const safeHead = Math.max(DISK_MIN, initialHead === "" ? DEFAULT_INITIAL_HEAD : initialHead);
    const requestedMaxTrack = maxTrackInput === "" ? DEFAULT_MAX_TRACK : Math.max(DEFAULT_MAX_TRACK, parseInt(maxTrackInput, 10) || DEFAULT_MAX_TRACK);

    try {
      const response = await fetch("http://localhost:8000/api/disk-scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          head: safeHead,
          queue: parsedQueue,
          algorithm: algorithm,
          maxTrack: requestedMaxTrack,
          direction: direction,
        }),
      });

      if (!response.ok) {
        alert("Backend error: " + response.statusText);
        return;
      }

      const data = await response.json();

      setMaxTrack(data.maxTrack);
      setInitialHead(safeHead);
      setDisplayedInitialHead(safeHead);
      setSequence(data.sequence);
      setMovements(data.movements);
      setTotalMovement(data.totalMovement);
      setHasRun(true);
    } catch (error) {
      console.error("Error executing disk scheduling simulation:", error);
      if (!isMount) {
        alert("Failed to connect to backend.");
      }
    }
  }

  useEffect(function () {
    handleExecuteRun(undefined, true);
  }, []);

  useEffect(function () {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth || 920;
    const displayHeight = 360;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const paddingLeft = 60;
    const paddingRight = 28;
    const paddingTop = 42;
    const paddingBottom = 42;

    const graphWidth = displayWidth - paddingLeft - paddingRight;
    const graphHeight = displayHeight - paddingTop - paddingBottom;

    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    ctx.strokeStyle = "#e4e9ec";
    ctx.lineWidth = 1;

    const ticks = [
      0,
      Math.round(maxTrack * 0.25),
      Math.round(maxTrack * 0.5),
      Math.round(maxTrack * 0.75),
      maxTrack
    ];

    ticks.forEach(function (tick) {
      const x = paddingLeft + (tick / maxTrack) * graphWidth;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + graphHeight);
      ctx.stroke();
    });

    const axisY = paddingTop + graphHeight;
    ctx.strokeStyle = "#cfd7dc";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, axisY);
    ctx.lineTo(paddingLeft + graphWidth, axisY);
    ctx.stroke();

    ctx.fillStyle = "#a4b0b6";
    ctx.font = "600 11px Inter, sans-serif";
    ctx.textAlign = "center";

    ticks.forEach(function (tick) {
      const x = paddingLeft + (tick / maxTrack) * graphWidth;
      ctx.fillText(String(tick), x, axisY + 20);
    });

    if (sequence.length === 0) return;

    const stepGap = sequence.length > 1 ? graphHeight / (sequence.length - 1) : 0;

    ctx.strokeStyle = "#3B7A6A";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    sequence.forEach(function (track, index) {
      const x = paddingLeft + (track / maxTrack) * graphWidth;
      const y = paddingTop + index * stepGap;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    sequence.forEach(function (track, index) {
      const x = paddingLeft + (track / maxTrack) * graphWidth;
      const y = paddingTop + index * stepGap;

      ctx.fillStyle = index === 0 ? "#7c5cbf" : STEP_COLORS[(index - 1) % STEP_COLORS.length];
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4A5559";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(String(track), x + 8, y + 4);

      ctx.fillStyle = "#a4b0b6";
      ctx.font = "700 10px Inter, sans-serif";
      ctx.fillText(index === 0 ? "START" : "S" + index, x + 8, y - 8);
    });
  }, [sequence, maxTrack]);

  const requestCount = Math.max(sequence.length - 1, 0);
  const sequenceLabel = sequence.join(" -> ");

  return (
    <div className="disk-app">
      <div className="disk-tabs">
        <button type="button" className="disk-tab active">Algorithm Simulation</button>
        <button type="button" className="disk-tab">Compare Algorithms</button>
      </div>

      <div className="disk-content">
        <div className="disk-main">
          <section className="disk-panel">
            <div className="disk-panel-header">
              <div>
                <h2>Mass Storage Manager</h2>
                <p>Configure the queue, choose an algorithm, and simulate head movement</p>
              </div>
              <div className="disk-controls">
                <button
                  type="button"
                  className="disk-ctrl-btn"
                  onClick={function () {
                    setQueueInput("98, 183, 37, 122, 14, 124, 65, 67");
                    setInitialHead(DEFAULT_INITIAL_HEAD);
                    setMaxTrackInput("");
                    setAlgorithm("FCFS");
                    setHasRun(false);
                  }}
                >
                  📋 Sample
                </button>
                <button
                  type="button"
                  className="disk-ctrl-btn danger-btn"
                  onClick={function () {
                    setQueueInput("");
                    setInitialHead(DEFAULT_INITIAL_HEAD);
                    setDisplayedInitialHead(DEFAULT_INITIAL_HEAD);
                    setMaxTrackInput("");
                    setAlgorithm("CHOOSE ALGORITHM");
                    setSequence([]);
                    setMovements([]);
                    setTotalMovement(0);
                    setHasRun(false);
                  }}
                >
                  🗑 Clear
                </button>
                <button
                  type="button"
                  className="disk-ctrl-btn run-btn"
                  onClick={function () {
                    handleExecuteRun();
                  }}
                >
                  ▶ Run
                </button>
              </div>
            </div>

            <form className="disk-form-card" onSubmit={handleExecuteRun}>
              <div className="disk-input-group">
                <label>Algorithm</label>
                <select
                  value={algorithm}
                  onChange={function (e) {
                    const nextAlgorithm = e.target.value as DiskAlgorithm;
                    setAlgorithm(nextAlgorithm);
                    if (ALGORITHMS_REQUIRING_DIRECTION.includes(nextAlgorithm)) {
                      setDirection("towards-roof");
                    }
                    setHasRun(false);
                  }}
                >
                  {ALGORITHMS.map(function (item) {
                    return (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="disk-input-group">
                <label>Max Track/Disk Size</label>
                <input
                  type="number"
                  min={DEFAULT_MAX_TRACK}
                  value={maxTrackInput}
                  onChange={function (e) {
                    setMaxTrackInput(e.target.value);
                    setHasRun(false);
                  }}
                  placeholder={`Default: ${DEFAULT_MAX_TRACK}`}
                />
              </div>

              {showsDirectionInput && (
                <div className="disk-input-group">
                  <label>Direction</label>
                  <select
                    value={direction}
                    onChange={function (e) {
                      setDirection(e.target.value as DiskDirection);
                      setHasRun(false);
                    }}
                  >
                    {DIRECTION_OPTIONS.map(function (item) {
                      return (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="disk-input-group disk-head-group">
                <label>Initial Head</label>
                <input
                  type="number"
                  min={DISK_MIN}
                  value={initialHead}
                  onChange={function (e) {
                    const val = e.target.value;
                    if (val === "") {
                      setInitialHead("");
                    } else {
                      const parsed = parseInt(val, 10);
                      setInitialHead(isNaN(parsed) ? "" : parsed);
                    }
                    setHasRun(false);
                  }}
                  placeholder={`e.g. ${DEFAULT_INITIAL_HEAD}`}
                />
              </div>

              <div className="disk-input-group disk-queue-group">
                <label>Request Queue</label>
                <input
                  type="text"
                  value={queueInput}
                  onChange={function (e) {
                    setQueueInput(e.target.value);
                    setHasRun(false);
                  }}
                  placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
                />
              </div>
            </form>

            <div className="disk-summary-grid">
              <div className="disk-summary-card">
                <div className="disk-summary-label">Algorithm</div>
                <div className="disk-summary-value">{selectedAlgorithm.abbr}</div>
              </div>
              <div className="disk-summary-card">
                <div className="disk-summary-label">Requests Served</div>
                <div className="disk-summary-value">{requestCount}</div>
              </div>
              <div className="disk-summary-card">
                <div className="disk-summary-label">Initial Head</div>
                <div className="disk-summary-value">{displayedInitialHead}</div>
              </div>
              <div className="disk-summary-card accent">
                <div className="disk-summary-label">Total Movement</div>
                <div className="disk-summary-value">{totalMovement}</div>
              </div>
            </div>
          </section>

          <section className="disk-results">
            <div className="disk-results-header">
              <div>
                <h2>Simulation Results</h2>
                <p className="disk-results-subtitle">
                  {selectedAlgorithm.label} {hasRun ? "· Physical head traversal across disk tracks" : ""}
                </p>
              </div>
            </div>

            <div className="disk-chart-shell">
              <div className="disk-chart-meta">
                <span className="disk-chart-badge">Track Range: {DISK_MIN}-{maxTrack}</span>
                <span className="disk-chart-sequence">Sequence: {sequenceLabel || "—"}</span>
              </div>

              <div className="disk-canvas-wrap">
                <canvas ref={canvasRef} className="disk-canvas" />
              </div>
            </div>

            <div className="disk-result-table-wrapper">
              <h3>Computation Log</h3>
              <div className="disk-table-container">
                {movements.length === 0 ? (
                  <div className="disk-empty-state">
                    <div className="disk-empty-icon">💽</div>
                    <h4>No movements yet</h4>
                    <p>Run the simulation to generate the disk head movement trace</p>
                  </div>
                ) : (
                  <table className="disk-result-table">
                    <thead>
                      <tr>
                        <th>Step</th>
                        <th>Head Seek Path</th>
                        <th>Seek Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map(function (move) {
                        return (
                          <tr key={move.step + "-" + move.from + "-" + move.to}>
                            <td className="disk-step-cell">
                              <span
                                className="step-bullet"
                                style={{ backgroundColor: STEP_COLORS[(move.step - 1) % STEP_COLORS.length] }}
                              />
                              S{move.step}
                            </td>
                            <td>
                              <span className="disk-path-text">
                                <span className="disk-track-pill">{move.from}</span>
                                <span className="disk-arrow">{">"}</span>
                                <span className="disk-track-pill">{move.to}</span>
                              </span>
                            </td>
                            <td className="disk-distance-cell">{move.distance} tracks</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="disk-foot-label"><strong>Total Head Movement</strong></td>
                        <td className="disk-foot-total"><strong>{totalMovement} tracks</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DiskScheduling;
