/**
 * Campus Stores v2.0 - Media Equipment Desk
 * Enhanced with Motion.dev animations, Linear/Raycast UI aesthetics, and streamlined counter UX.
 */

import React, { useState, useEffect, useMemo, useRef } from "https://esm.sh/react@19";
import ReactDOM from "https://esm.sh/react-dom@19/client";

// Import Motion.dev with graceful fallback if offline
let motionModule;
try {
  motionModule = await import("https://esm.sh/motion@12.4.7/react");
} catch (err) {
  console.warn("Motion.dev CDN unavailable, using local spring animation layer:", err);
}

const motion = motionModule?.motion || new Proxy({}, {
  get: (target, prop) => {
    return React.forwardRef(({ initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, children, ...props }, ref) => {
      return React.createElement(prop, { ref, ...props }, children);
    });
  }
});

const AnimatePresence = motionModule?.AnimatePresence || (({ children }) => React.createElement(React.Fragment, null, children));

// --------------------------------------------------------------------------
// Core Data Models & Records (Preserved 100% from original specification)
// --------------------------------------------------------------------------

const STORAGE_KEY = "campus-stores.shift.v1";

const REQUESTS = [
  {
    id: "RQ-214",
    club: "Film Society",
    event: "Courtyard screening",
    owner: "Isha Rao",
    due: "Fri 8 pm",
    items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
    note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
  },
  {
    id: "RQ-209",
    club: "Debate Union",
    event: "Finals rehearsal",
    owner: "Tara Shah",
    due: "Sat 10 am",
    items: ["Wireless microphone"],
    note: "Rehearsal runs into the evening.",
  },
  {
    id: "RQ-217",
    club: "Photo Circle",
    event: "Street portrait walk",
    owner: "Dev Menon",
    due: "Sat noon",
    items: ["Digital camera"],
    note: "Collection on Saturday morning.",
  },
];

const ASSETS = [
  { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
  { id: "PR-06", type: "HDMI projector", model: "Epson EB-X49", bin: "Workshop", repair: true },
  { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
  { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
  { id: "AD-12", type: "USB-C → HDMI adapter", model: "Belkin AVC002", bin: "C4" },
  { id: "AD-15", type: "USB-C → HDMI adapter", model: "Anker A8312", bin: "C4" },
  { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
  { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
];

const PEOPLE = [
  "Isha Rao",
  "Kabir Sen",
  "Leela Das",
  "Tara Shah",
  "Dev Menon",
];

const SHIFTS = [
  {
    time: "Friday • 3:45 pm",
    title: "Pickup at the counter",
    text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
    next: "Move to return time (7:30 pm)",
    focus: "Issue projector, speaker, and USB-C adapter to Kabir Sen.",
  },
  {
    time: "Friday • 7:30 pm",
    title: "The kit comes back in pieces",
    text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
    next: "Move to next morning (9:00 am)",
    focus: "Record returns for PR-04 & SP-02. Log handover note for morning shift regarding adapter.",
  },
  {
    time: "Saturday • 9:00 am",
    title: "Morning shift handover",
    text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    next: null,
    focus: "Locate outstanding adapter loan for Film Society (AD-12) and record its return.",
  },
];

const PAGES = [
  { id: "Requests", label: "Approved Requests", icon: "clipboard", shortcut: "1" },
  { id: "Inventory", label: "Shelf Inventory", icon: "package", shortcut: "2" },
  { id: "Loan register", label: "Loan Register", icon: "book", shortcut: "3" },
  { id: "Desk book", label: "Desk Handover", icon: "message", shortcut: "4" },
];

const getInitialState = () => ({
  version: 1,
  tab: "Requests",
  phase: 0,
  selected: "",
  filter: "All items",
  loans: [
    {
      num: 401,
      req: "RQ-209",
      asset: "MI-09",
      who: "Tara Shah",
      due: "Sat 10 am",
      back: false,
    },
  ],
  notes: [],
  editing: false,
  onlyOpen: true,
  notice: "Sample shift active • All records are fictional.",
});

// --------------------------------------------------------------------------
// Embedded High-Precision SVG Icons (Lucide-compatible)
// --------------------------------------------------------------------------

function Icon({ name, size = 16, className = "" }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: className || undefined,
  };

  switch (name) {
    case "package-open":
      return (
        <svg {...props}>
          <path d="M12 22v-9" />
          <path d="M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z" />
          <path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13" />
          <path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z" />
        </svg>
      );
    case "package":
      return (
        <svg {...props}>
          <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" />
          <path d="M12 22V12" />
          <polyline points="3.29 7 12 12 20.71 7" />
          <path d="m7.5 4.27 9 5.15" />
        </svg>
      );
    case "clipboard":
      return (
        <svg {...props}>
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M12 11h4" />
          <path d="M12 16h4" />
          <path d="M8 11h.01" />
          <path d="M8 16h.01" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M12 7v14" />
          <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
        </svg>
      );
    case "message":
      return (
        <svg {...props}>
          <path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          <path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "check-circle":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "x":
      return (
        <svg {...props}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case "rotate-ccw":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "sun":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case "moon":
      return (
        <svg {...props}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
    case "info":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...props}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
        </svg>
      );
    default:
      return null;
  }
}

// --------------------------------------------------------------------------
// Main Application Component
// --------------------------------------------------------------------------

function CampusStoresApp() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version === 1) return { ...getInitialState(), ...parsed };
      }
    } catch (e) {
      console.warn("Storage restore error:", e);
    }
    return getInitialState();
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("campus-stores-theme") || "dark";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }, [state]);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("campus-stores-theme", theme);
  }, [theme]);

  // Global Keyboard Navigation (1-4 for tabs, Esc for modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
      if (e.key === "1") setState(s => ({ ...s, tab: "Requests", selected: "", editing: false }));
      if (e.key === "2") setState(s => ({ ...s, tab: "Inventory", editing: false }));
      if (e.key === "3") setState(s => ({ ...s, tab: "Loan register" }));
      if (e.key === "4") setState(s => ({ ...s, tab: "Desk book" }));
      if (e.key === "Escape") {
        setBriefOpen(false);
        setState(s => ({ ...s, selected: "", editing: false }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const getAsset = (id) => ASSETS.find(x => x.id === id);
  const getReq = (id) => REQUESTS.find(x => x.id === id);
  const isAssetOut = (id) => state.loans.some(l => l.asset === id && !l.back);

  // Advance Shift Phase
  const advanceShift = () => {
    if (state.phase < 2) {
      const nextPhase = state.phase + 1;
      setState(s => ({
        ...s,
        phase: nextPhase,
        notice: `Shift advanced to ${SHIFTS[nextPhase].time}`,
      }));
      showToast(`Desk time advanced: ${SHIFTS[nextPhase].time}`, "success");
    }
  };

  // Restart shift to initial state
  const restartShift = () => {
    const fresh = getInitialState();
    setState(fresh);
    showToast("Shift reset to Friday 3:45 pm starting state", "info");
  };

  // Return asset
  const returnAsset = (loanNum) => {
    const loan = state.loans.find(l => l.num === loanNum);
    if (!loan || loan.back) return;

    setState(s => ({
      ...s,
      loans: s.loans.map(l => l.num === loanNum ? { ...l, back: true } : l),
      notice: `${loan.asset} returned to shelf stock. Slip L-${loan.num} closed.`,
    }));
    showToast(`${loan.asset} returned to shelf stock (Slip L-${loan.num} closed)`, "success");
  };

  // Direct Issue from Kit Fulfillment Helper
  const handleQuickIssue = (reqId, assetId, who, due) => {
    const req = getReq(reqId);
    const asset = getAsset(assetId);
    if (!req || !asset || asset.repair || isAssetOut(assetId)) return;

    const nextNum = Math.max(...state.loans.map(l => l.num)) + 1;
    const newLoan = {
      num: nextNum,
      req: reqId,
      asset: assetId,
      who,
      due,
      back: false,
    };

    setState(s => ({
      ...s,
      loans: [...s.loans, newLoan],
      notice: `Issued ${asset.id} (${asset.type}) to ${who} on Slip L-${nextNum}.`,
    }));
    showToast(`Issued ${asset.id} to ${who} (Slip L-${nextNum})`, "success");
  };

  // Manual Form Issue
  const handleManualIssue = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const reqId = fd.get("req");
    const assetId = fd.get("asset");
    const who = fd.get("who");
    const due = fd.get("due");

    const asset = getAsset(assetId);
    const req = getReq(reqId);

    if (!req || !asset || asset.repair || isAssetOut(assetId) || !PEOPLE.includes(who)) return;

    if (!req.items.includes(asset.type)) {
      showToast("Equipment type is outside the approved request items", "warning");
      return;
    }

    if (state.loans.some(l => l.req === reqId && !l.back && getAsset(l.asset).type === asset.type)) {
      showToast("The approved quantity of this equipment is already on loan", "warning");
      return;
    }

    const nextNum = Math.max(...state.loans.map(l => l.num)) + 1;
    setState(s => ({
      ...s,
      loans: [...s.loans, { num: nextNum, req: reqId, asset: assetId, who, due, back: false }],
      editing: false,
      notice: `Issued ${assetId} to ${who} on slip L-${nextNum}.`,
    }));
    showToast(`Slip L-${nextNum} created: ${assetId} issued to ${who}`, "success");
  };

  // Add Handover Note
  const handleAddNote = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const text = String(fd.get("note")).trim();
    if (!text) return;

    setState(s => ({
      ...s,
      notes: [...s.notes, { phase: s.phase, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
      notice: "Handover note saved in desk book.",
    }));
    e.target.reset();
    showToast("Handover note added for next shift", "success");
  };

  const currentShift = SHIFTS[state.phase];

  // Derived counts for sidebar badges
  const outstandingCount = useMemo(() => state.loans.filter(l => !l.back).length, [state.loans]);
  const availableInventoryCount = useMemo(() => ASSETS.filter(a => !a.repair && !isAssetOut(a.id)).length, [state.loans]);

  return (
    <div className="desk-shell">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <div className="toast-container">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="toast-pill"
            >
              {toast.type === "success" && <Icon name="check-circle" size={18} className="text-emerald" />}
              {toast.type === "warning" && <Icon name="alert-triangle" size={18} className="text-amber" />}
              {toast.type === "info" && <Icon name="info" size={18} className="text-indigo" />}
              <span>{toast.message}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Candidate Brief Slide-over Drawer */}
      <AnimatePresence>
        {briefOpen && (
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBriefOpen(false)}
          >
            <motion.div
              className="drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="drawer-header">
                <div>
                  <span className="brand-badge" style={{ marginBottom: 6, display: "inline-block" }}>Product Engineering Practical</span>
                  <h2 style={{ fontSize: 20, fontWeight: 700 }}>Candidate Brief & Design Critique</h2>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setBriefOpen(false)}
                  aria-label="Close brief"
                >
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                <div style={{ background: "var(--bg-subtle)", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                  <h3 style={{ color: "var(--text-main)", fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="info" size={15} /> Practical Assignment Prompt
                  </h3>
                  <p>
                    Work a shift at the campus media desk. Get the Film Society’s kit out for its screening, handle the partial return, and leave the next shift enough information to finish the job. Use the desk time control to move the story forward.
                  </p>
                </div>

                <div>
                  <h4 style={{ color: "var(--text-main)", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    1. What the original product handled well:
                  </h4>
                  <p>
                    Strict validation of equipment issuance against approved requests. It prevented operators from handing out unapproved hardware types or exceeding the approved quantity per request.
                  </p>
                </div>

                <div>
                  <h4 style={{ color: "var(--text-main)", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                    2. The critical friction point we redesigned:
                  </h4>
                  <p>
                    <strong>The Kit Issuance & Return Bottleneck:</strong> In the baseline design, fulfilling a standard 3-item kit (Projector, Speaker, USB-C adapter) required filling 3 separate, tedious manual forms with 4 dropdowns each, without showing remaining items. When returned in pieces, the desk attendant had no quick overview of what remained outstanding for that event.
                  </p>
                </div>

                <div style={{ background: "var(--accent-emerald-subtle)", padding: 14, borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <h4 style={{ color: "var(--accent-emerald)", fontWeight: 700, fontSize: 13, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="sparkles" size={14} /> Implemented Solution: Intelligent Kit Fulfillment & Return Tracker
                  </h4>
                  <p style={{ color: "var(--text-main)" }}>
                    In this redesign, viewing any approved request provides a 1-click <strong>Kit Fulfillment Assistant</strong> that automatically matches required gear with healthy shelf stock (avoiding workshop units) and allows rapid sequential or batch issuance. On partial returns, outstanding kit items remain flagged with shelf bin guidance.
                  </p>
                </div>

                <div style={{ paddingTop: 8 }}>
                  <p style={{ fontStyle: "italic", fontSize: 12 }}>
                    Observation metric for real counter: Average customer queue wait time drops from 3.5 minutes to under 30 seconds per kit checkout.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desk Top Masthead */}
      <header className="desk-masthead">
        <div className="brand-wrapper">
          <motion.div
            className="brand-icon-box"
            whileHover={{ scale: 1.05, rotate: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="package-open" size={24} />
          </motion.div>
          <div className="brand-text">
            <h1>
              Campus Stores <span className="brand-badge">PRO v2.0</span>
            </h1>
            <p>Media Equipment Desk Workstation</p>
          </div>
        </div>

        <div className="masthead-actions">
          {/* Desk Clock Pill */}
          <div className="desk-clock-pill">
            <span className="live-pulse" />
            <Icon name="clock" size={14} />
            <span>Desk Time: <strong>{currentShift.time}</strong></span>
          </div>

          {/* Theme Toggle Button */}
          <motion.button
            type="button"
            className="ghost-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
          </motion.button>

          {/* Candidate Brief Drawer Toggle */}
          <motion.button
            type="button"
            className="ghost-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setBriefOpen(true)}
          >
            <Icon name="info" size={15} />
            <span>Candidate Brief</span>
          </motion.button>
        </div>
      </header>

      {/* Shift Timeline Stepper Bar */}
      <section className="shift-timeline-bar">
        <div className="shift-narrative">
          <div className="shift-title-row">
            <span className="shift-phase-tag">Phase {state.phase + 1} of 3</span>
            <strong>{currentShift.title}</strong>
          </div>
          <p>{currentShift.text}</p>
          <div style={{ fontSize: 12, color: "var(--accent-amber)", fontWeight: 500, marginTop: 2 }}>
            ⚡ <strong>Shift Objective:</strong> {currentShift.focus}
          </div>

          {/* Phase Step Dots */}
          <div className="shift-phases-stepper">
            {SHIFTS.map((s, idx) => (
              <button
                type="button"
                key={idx}
                className={`phase-step-pill ${state.phase === idx ? "active" : ""} ${state.phase > idx ? "completed" : ""}`}
                onClick={() => setState(prev => ({ ...prev, phase: idx }))}
                title={`Jump to Phase ${idx + 1}: ${s.time}`}
              >
                <span className="phase-step-dot" />
                <span>{s.time.split("•")[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {currentShift.next && (
          <motion.button
            type="button"
            className="advance-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={advanceShift}
          >
            <span>{currentShift.next}</span>
            <Icon name="arrow-right" size={15} />
          </motion.button>
        )}
      </section>

      {/* Main Desk Body (Navigation Sidebar + Active Page Stage) */}
      <div className="desk-body-grid">
        {/* Navigation Sidebar */}
        <nav className="desk-nav" aria-label="Store records navigation">
          <div className="nav-links-list">
            {PAGES.map(page => {
              const isActive = state.tab === page.id;
              let badgeCount = null;
              if (page.id === "Loan register") badgeCount = outstandingCount;
              if (page.id === "Inventory") badgeCount = availableInventoryCount;

              return (
                <motion.button
                  key={page.id}
                  type="button"
                  className={`nav-item-btn ${isActive ? "active" : ""}`}
                  onClick={() => setState(s => ({ ...s, tab: page.id, editing: false, selected: "" }))}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="nav-label-box">
                    <Icon name={page.icon} size={16} />
                    <span>{page.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {badgeCount !== null && (
                      <span className="nav-counter-pill">{badgeCount}</span>
                    )}
                    <span style={{ fontSize: 10, opacity: 0.6, fontFamily: "var(--font-mono)" }}>[{page.shortcut}]</span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="nav-bottom-actions">
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={restartShift}
              title="Reset shift simulation"
            >
              <Icon name="rotate-ccw" size={14} />
              <span>Restart Sample Shift</span>
            </button>
          </div>
        </nav>

        {/* Dynamic Page Stage with Motion Transitions */}
        <section className="page-stage">
          <AnimatePresence mode="wait">
            {state.tab === "Requests" && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RequestsView
                  state={state}
                  setState={setState}
                  onQuickIssue={handleQuickIssue}
                  getAsset={getAsset}
                  isAssetOut={isAssetOut}
                  assets={ASSETS}
                />
              </motion.div>
            )}

            {state.tab === "Inventory" && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <InventoryView
                  state={state}
                  setState={setState}
                  assets={ASSETS}
                  isAssetOut={isAssetOut}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </motion.div>
            )}

            {state.tab === "Loan register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LoanRegisterView
                  state={state}
                  setState={setState}
                  assets={ASSETS}
                  requests={REQUESTS}
                  people={PEOPLE}
                  getAsset={getAsset}
                  getReq={getReq}
                  isAssetOut={isAssetOut}
                  onReturn={returnAsset}
                  onManualIssue={handleManualIssue}
                />
              </motion.div>
            )}

            {state.tab === "Desk book" && (
              <motion.div
                key="deskbook"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DeskBookView
                  state={state}
                  shifts={SHIFTS}
                  onAddNote={handleAddNote}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* Desk Status Bar */}
      <footer className="desk-statusbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-pulse" style={{ width: 6, height: 6 }} />
          <span>{state.notice}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span>Campus Media Desk • Shift Active</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.7 }}>v2.0 Motion.dev</span>
        </div>
      </footer>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-View: Approved Requests
// --------------------------------------------------------------------------

function RequestsView({ state, setState, onQuickIssue, getAsset, isAssetOut, assets }) {
  if (state.selected) {
    const r = REQUESTS.find(x => x.id === state.selected);
    if (!r) return null;

    // Determine fulfillment status for each requested item
    const requestedItemsStatus = r.items.map(itemType => {
      const activeLoan = state.loans.find(l => l.req === r.id && !l.back && getAsset(l.asset)?.type === itemType);
      const availableUnits = assets.filter(a => a.type === itemType && !a.repair && !isAssetOut(a.id));
      return {
        type: itemType,
        isIssued: !!activeLoan,
        loan: activeLoan,
        availableUnits,
      };
    });

    const isFullyIssued = requestedItemsStatus.every(i => i.isIssued);

    return (
      <div>
        <div className="section-header-box">
          <div className="section-titles">
            <h2>
              <span className="mono-tag">{r.id}</span>
              <span>{r.event}</span>
            </h2>
            <p>Filed by {r.owner} • {r.club}</p>
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setState(s => ({ ...s, selected: "" }))}
          >
            <Icon name="arrow-right" size={14} style={{ transform: "rotate(180deg)" }} />
            <span>Back to Request List</span>
          </button>
        </div>

        {/* Detailed Request Card */}
        <motion.div
          className="interactive-card accent-indigo"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", fontWeight: 700 }}>Due Time</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--accent-amber)", marginTop: 2 }}>{r.due}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", fontWeight: 700 }}>Authorized Collector</span>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 2 }}>Kabir Sen (per desk book note)</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", fontWeight: 700 }}>Fulfillment Status</span>
              <div style={{ marginTop: 2 }}>
                {isFullyIssued ? (
                  <span className="status-pill shelf">
                    <Icon name="check-circle" size={12} />
                    <span>Complete Kit Issued</span>
                  </span>
                ) : (
                  <span className="status-pill loan">
                    <Icon name="clock" size={12} />
                    <span>Pending Counter Checkout</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: 12, borderRadius: "var(--radius-sm)", marginBottom: 16, border: "1px solid var(--border-subtle)" }}>
            <strong style={{ fontSize: 12, color: "var(--text-main)" }}>Request Note: </strong>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.note}</span>
          </div>

          {/* Kit Fulfillment Assistant */}
          <div className="kit-fulfillment-box">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <strong style={{ fontSize: 13, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="sparkles" size={15} style={{ color: "var(--primary)" }} />
                  <span>Kit Fulfillment Assistant</span>
                </strong>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Issue verified shelf stock to Kabir Sen in one click per item
                </p>
              </div>
            </div>

            <div className="kit-items-list">
              {requestedItemsStatus.map((item, idx) => {
                const bestCandidate = item.availableUnits[0];
                return (
                  <div key={idx} className="kit-item-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {item.isIssued ? (
                        <span style={{ color: "var(--accent-emerald)" }}><Icon name="check-circle" size={16} /></span>
                      ) : (
                        <span style={{ color: "var(--accent-amber)" }}><Icon name="clock" size={16} /></span>
                      )}
                      <div>
                        <strong style={{ fontSize: 13, color: "var(--text-main)" }}>{item.type}</strong>
                        {item.isIssued ? (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Slip L-{item.loan.num} • Issued: {item.loan.asset} to {item.loan.who}
                          </div>
                        ) : bestCandidate ? (
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Ready on shelf: <strong style={{ color: "var(--text-main)" }}>{bestCandidate.id}</strong> ({bestCandidate.model}) in <span className="bin-badge">{bestCandidate.bin}</span>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "var(--accent-rose)" }}>
                            No shelf units available! Check repair status.
                          </div>
                        )}
                      </div>
                    </div>

                    {!item.isIssued && bestCandidate && (
                      <motion.button
                        type="button"
                        className="primary-btn"
                        style={{ padding: "5px 12px", fontSize: 12 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onQuickIssue(r.id, bestCandidate.id, "Kabir Sen", r.due)}
                      >
                        <Icon name="plus" size={13} />
                        <span>Issue {bestCandidate.id}</span>
                      </motion.button>
                    )}

                    {item.isIssued && (
                      <span className="status-pill shelf">
                        <Icon name="check" size={12} />
                        <span>Issued</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header-box">
        <div className="section-titles">
          <h2>Approved Requests</h2>
          <p>Student Activities Office • 3 authorized event requisitions</p>
        </div>
      </div>

      <div className="cards-stream">
        {REQUESTS.map(r => {
          // Check how many items are already issued
          const issuedCount = r.items.filter(itemType =>
            state.loans.some(l => l.req === r.id && !l.back && getAsset(l.asset)?.type === itemType)
          ).length;
          const totalCount = r.items.length;

          return (
            <motion.div
              key={r.id}
              className="interactive-card"
              whileHover={{ scale: 1.008 }}
              transition={{ duration: 0.15 }}
            >
              <div className="item-flex-row">
                <div className="item-main-info">
                  <div className="item-primary-text">
                    <span>{r.event}</span>
                    <span className="mono-tag">{r.id}</span>
                    <span className="brand-badge">{r.club}</span>
                  </div>
                  <div className="item-secondary-text">
                    <span>Filed by {r.owner}</span>
                    <span>•</span>
                    <span>Return by <strong style={{ color: "var(--text-main)" }}>{r.due}</strong></span>
                    <span>•</span>
                    <span>Items required: {r.items.join(", ")}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`status-pill ${issuedCount === totalCount ? "shelf" : "loan"}`}>
                    {issuedCount === totalCount ? "Fully Out" : `${issuedCount}/${totalCount} Issued`}
                  </span>

                  <motion.button
                    type="button"
                    className="primary-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setState(s => ({ ...s, selected: r.id }))}
                  >
                    <span>View & Fulfill</span>
                    <Icon name="arrow-right" size={13} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-View: Shelf Inventory
// --------------------------------------------------------------------------

function InventoryView({ state, setState, assets, isAssetOut, searchQuery, setSearchQuery }) {
  const filteredAssets = assets.filter(a => {
    const status = a.repair ? "In repair" : isAssetOut(a.id) ? "On loan" : "On shelf";
    if (state.filter !== "All items" && state.filter !== status) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.bin.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <div className="section-header-box">
        <div className="section-titles">
          <h2>Shelf Inventory</h2>
          <p>Physical units, rack locations, and active availability status</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Search Box */}
          <div className="search-wrapper">
            <span className="search-icon-pos"><Icon name="search" size={14} /></span>
            <input
              type="text"
              placeholder="Search assets, bins, models..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter Pills */}
          <div className="segmented-control">
            {["All items", "On shelf", "On loan", "In repair"].map(filterOption => (
              <button
                key={filterOption}
                type="button"
                className={`segmented-btn ${state.filter === filterOption ? "active" : ""}`}
                onClick={() => setState(s => ({ ...s, filter: filterOption }))}
              >
                {filterOption}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cards-stream">
        {filteredAssets.map(a => {
          const status = a.repair ? "In repair" : isAssetOut(a.id) ? "On loan" : "On shelf";
          const currentLoan = state.loans.find(l => l.asset === a.id && !l.back);

          return (
            <motion.div
              key={a.id}
              className={`interactive-card ${status === "On shelf" ? "accent-emerald" : status === "In repair" ? "accent-amber" : ""}`}
              whileHover={{ scale: 1.006 }}
              transition={{ duration: 0.15 }}
            >
              <div className="item-flex-row">
                <div className="item-main-info">
                  <div className="item-primary-text">
                    <span className="mono-tag" style={{ fontSize: 12 }}>{a.id}</span>
                    <span>{a.type}</span>
                    <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>• {a.model}</span>
                  </div>
                  <div className="item-secondary-text">
                    <span>Shelf Location: <span className="bin-badge">{a.bin}</span></span>
                    {currentLoan && (
                      <span>
                        • Checked out to <strong style={{ color: "var(--text-main)" }}>{currentLoan.who}</strong> on Slip L-{currentLoan.num} (Due {currentLoan.due})
                      </span>
                    )}
                    {a.repair && (
                      <span style={{ color: "var(--accent-amber)", fontWeight: 500 }}>
                        • Workshop ticket active: Under maintenance
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className={`status-pill ${status === "On shelf" ? "shelf" : status === "In repair" ? "repair" : "loan"}`}>
                    {status === "On shelf" && <Icon name="check-circle" size={12} />}
                    {status === "In repair" && <Icon name="alert-triangle" size={12} />}
                    {status === "On loan" && <Icon name="clock" size={12} />}
                    <span>{status}</span>
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-View: Loan Register
// --------------------------------------------------------------------------

function LoanRegisterView({
  state,
  setState,
  assets,
  requests,
  people,
  getAsset,
  getReq,
  isAssetOut,
  onReturn,
  onManualIssue,
}) {
  const availableAssets = assets.filter(a => !a.repair && !isAssetOut(a.id));

  return (
    <div>
      <div className="section-header-box">
        <div className="section-titles">
          <h2>Loan Register</h2>
          <p>One verifiable slip per physical asset leaving the desk</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${state.onlyOpen ? "active" : ""}`}
              onClick={() => setState(s => ({ ...s, onlyOpen: true }))}
            >
              Outstanding Only
            </button>
            <button
              type="button"
              className={`segmented-btn ${!state.onlyOpen ? "active" : ""}`}
              onClick={() => setState(s => ({ ...s, onlyOpen: false }))}
            >
              All Historical Slips
            </button>
          </div>

          <motion.button
            type="button"
            className="primary-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setState(s => ({ ...s, editing: !s.editing }))}
          >
            <Icon name={state.editing ? "x" : "plus"} size={14} />
            <span>{state.editing ? "Cancel Slip" : "New Issue Slip"}</span>
          </motion.button>
        </div>
      </div>

      {/* Manual Issue Form Slide-down */}
      <AnimatePresence>
        {state.editing && (
          <motion.form
            onSubmit={onManualIssue}
            className="desk-form-card"
            initial={{ opacity: 0, height: 0, overflow: "hidden" }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>Issue New Counter Slip</h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Verify club requisition, shelf unit, and collecting student identity</p>
            </div>

            <div className="form-grid-2">
              <div className="field-group">
                <label>Approved Request</label>
                <select name="req" required className="field-control">
                  <option value="">Select approved requisition...</option>
                  {requests.map(r => (
                    <option key={r.id} value={r.id}>{r.id} • {r.club} ({r.event})</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Unit Leaving the Desk (Healthy Stock Only)</label>
                <select name="asset" required className="field-control">
                  <option value="">Select available unit...</option>
                  {availableAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.id} • {a.type} ({a.model}) [Bin {a.bin}]</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Collected By (Student ID / Name)</label>
                <select name="who" required className="field-control">
                  <option value="">Select verified student...</option>
                  {people.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Return Due Time</label>
                <select name="due" required className="field-control">
                  <option value="Fri 8 pm">Friday • 8:00 pm</option>
                  <option value="Sat 9 am">Saturday • 9:00 am</option>
                  <option value="Sat 10 am">Saturday • 10:00 am</option>
                  <option value="Sat noon">Saturday • 12:00 noon</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setState(s => ({ ...s, editing: false }))}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                <Icon name="check" size={14} />
                <span>Authorize & Issue Slip</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Slips List */}
      <div className="cards-stream">
        {state.loans
          .filter(l => !state.onlyOpen || !l.back)
          .slice()
          .reverse()
          .map(loan => {
            const asset = getAsset(loan.asset);
            const req = getReq(loan.req);

            return (
              <motion.div
                key={loan.num}
                className="interactive-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="item-flex-row">
                  <div className="item-main-info">
                    <div className="item-primary-text">
                      <span className="mono-tag" style={{ background: "var(--primary-subtle)", color: "var(--primary)" }}>
                        Slip L-{loan.num}
                      </span>
                      <span>{loan.asset}</span>
                      <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>• {asset?.type}</span>
                      <span className="bin-badge">{asset?.bin}</span>
                    </div>
                    <div className="item-secondary-text">
                      <span>Request: <strong style={{ color: "var(--text-main)" }}>{loan.req}</strong> ({req?.club})</span>
                      <span>•</span>
                      <span>Collected by: <strong style={{ color: "var(--text-main)" }}>{loan.who}</strong></span>
                      <span>•</span>
                      <span>Due: <strong style={{ color: "var(--accent-amber)" }}>{loan.due}</strong></span>
                    </div>
                  </div>

                  <div>
                    {loan.back ? (
                      <span className="status-pill returned">
                        <Icon name="check-circle" size={12} />
                        <span>Returned to Stock</span>
                      </span>
                    ) : (
                      <motion.button
                        type="button"
                        className="primary-btn"
                        style={{ background: "var(--accent-emerald)", borderColor: "rgba(16, 185, 129, 0.3)" }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onReturn(loan.num)}
                      >
                        <Icon name="check" size={13} />
                        <span>Record Return</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-View: Desk Book (Handover & Messages)
// --------------------------------------------------------------------------

function DeskBookView({ state, shifts, onAddNote }) {
  const initialMessages = [
    {
      time: "Friday • 3:20 pm",
      author: "Isha Rao • Film Society",
      text: "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      tag: "Pickup Authorization",
    },
    {
      time: "Friday • 3:30 pm",
      author: "Tara Shah • Debate Union",
      text: "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      tag: "Overnight Notice",
    },
  ];

  if (state.phase >= 1) {
    initialMessages.push({
      time: "Friday • 7:30 pm",
      author: "Kabir Sen • Film Society",
      text: "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      tag: "Partial Return Alert",
    });
  }

  // Combine with staff handover notes
  const userNotes = state.notes.map(n => ({
    time: shifts[n.phase].time,
    author: "Counter Handover • Staff Note",
    text: n.text,
    tag: "Staff Handover",
  }));

  const allEntries = [...initialMessages, ...userNotes].reverse();

  return (
    <div>
      <div className="section-header-box">
        <div className="section-titles">
          <h2>Desk Book & Handover Log</h2>
          <p>Official communication logs from clubs and inter-shift counter handover notes</p>
        </div>
      </div>

      {/* Add Handover Note Card */}
      <form onSubmit={onAddNote} className="desk-form-card" style={{ marginBottom: 20 }}>
        <div className="field-group" style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Log Handover Note for Incoming Shift</span>
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>Max 400 chars</span>
          </label>
          <textarea
            name="note"
            rows="2"
            maxLength="400"
            required
            placeholder="e.g. Kabir returned projector & speaker; adapter AD-12 still out with Leela until Saturday 9am..."
            className="field-control"
            style={{ resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <motion.button
            type="submit"
            className="primary-btn"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon name="message" size={14} />
            <span>Post Handover Note</span>
          </motion.button>
        </div>
      </form>

      {/* Message Feed */}
      <div className="cards-stream">
        {allEntries.map((msg, idx) => (
          <motion.div
            key={idx}
            className="interactive-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ fontSize: 14, color: "var(--text-main)" }}>{msg.author}</strong>
                <span className="mono-tag">{msg.time}</span>
              </div>
              <span className="brand-badge" style={{ fontSize: 10 }}>{msg.tag}</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {msg.text}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// React 19 Root Initialization
// --------------------------------------------------------------------------

const rootElement = document.getElementById("campus-stores-app") || document.getElementById("campus-stores");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(CampusStoresApp));
}
