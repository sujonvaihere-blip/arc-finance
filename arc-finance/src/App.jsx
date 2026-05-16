import { useState, useEffect, useRef, useCallback } from "react";

const MOCK_TRANSACTIONS = [
  { id: "0xabc1", user_id: "usr_1", merchant: "Aave Protocol", amount: 1200, status: "confirmed", timestamp: "2024-01-15T10:23:00Z" },
  { id: "0xabc2", user_id: "usr_1", merchant: "Uniswap", amount: 340, status: "confirmed", timestamp: "2024-01-18T14:11:00Z" },
  { id: "0xabc3", user_id: "usr_1", merchant: "Acme Corp", amount: 5000, status: "confirmed", timestamp: "2024-02-02T09:00:00Z" },
  { id: "0xabc4", user_id: "usr_1", merchant: "Compound", amount: 800, status: "pending", timestamp: "2024-02-14T16:45:00Z" },
  { id: "0xabc5", user_id: "usr_1", merchant: "OpenSea", amount: 220, status: "confirmed", timestamp: "2024-03-01T11:30:00Z" },
  { id: "0xabc6", user_id: "usr_1", merchant: "Stripe", amount: 1500, status: "confirmed", timestamp: "2024-03-10T08:20:00Z" },
  { id: "0xabc7", user_id: "usr_1", merchant: "Aave Protocol", amount: 950, status: "failed", timestamp: "2024-04-05T13:00:00Z" },
  { id: "0xabc8", user_id: "usr_1", merchant: "Uniswap", amount: 670, status: "confirmed", timestamp: "2024-04-20T17:55:00Z" },
  { id: "0xabc9", user_id: "usr_1", merchant: "Acme Corp", amount: 2200, status: "confirmed", timestamp: "2024-05-03T10:10:00Z" },
  { id: "0xabca", user_id: "usr_1", merchant: "Curve Finance", amount: 430, status: "confirmed", timestamp: "2024-05-18T12:40:00Z" },
  { id: "0xabcb", user_id: "usr_1", merchant: "Stripe", amount: 1800, status: "confirmed", timestamp: "2024-06-07T09:15:00Z" },
  { id: "0xabcc", user_id: "usr_1", merchant: "OpenSea", amount: 310, status: "pending", timestamp: "2024-06-22T15:30:00Z" },
];

const MOCK_RULES = [
  { id: "rule_1", user_id: "usr_1", rule: "Alert if daily spend exceeds $2,000 USDC", action: "alert", active: true },
  { id: "rule_2", user_id: "usr_1", rule: "Block transactions above $10,000 USDC", action: "block", active: true },
  { id: "rule_3", user_id: "usr_1", rule: "Auto-approve recurring Stripe payments", action: "approve", active: false },
  { id: "rule_4", user_id: "usr_1", rule: "Notify on failed transactions", action: "notify", active: true },
];

const COMMANDS = [
  { id: 1, label: "Check USDC Balance", category: "Wallet", icon: "💰", cmd: "check usdc balance" },
  { id: 2, label: "Connect Wallet", category: "Wallet", icon: "🔗", cmd: "connect wallet" },
  { id: 3, label: "Show Q3 Revenue", category: "Reports", icon: "📊", cmd: "show q3 revenue" },
  { id: 4, label: "Monthly Spend Analysis", category: "Reports", icon: "📈", cmd: "monthly spend analysis" },
  { id: 5, label: "Create Invoice — Acme $5,000", category: "Invoices", icon: "🧾", cmd: "create invoice acme 5000" },
  { id: 6, label: "Simulate Payment", category: "Transactions", icon: "⚡", cmd: "simulate payment" },
  { id: 7, label: "Summarize Cash Flow", category: "Reports", icon: "💹", cmd: "summarize cash flow" },
  { id: 8, label: "Show Merchant Breakdown", category: "Analytics", icon: "🏪", cmd: "merchant breakdown" },
  { id: 9, label: "Create Automation Rule", category: "Automation", icon: "⚙️", cmd: "create rule" },
  { id: 10, label: "AI Spending Insights", category: "AI", icon: "🤖", cmd: "ai spending insights" },
];

const MONTHLY_DATA = [
  { month: "Jan", usdc: 1540, usdt: 800, dai: 320 },
  { month: "Feb", usdc: 5800, usdt: 1200, dai: 540 },
  { month: "Mar", usdc: 1720, usdt: 650, dai: 890 },
  { month: "Apr", usdc: 1620, usdt: 980, dai: 210 },
  { month: "May", usdc: 2630, usdt: 1400, dai: 670 },
  { month: "Jun", usdc: 2110, usdt: 760, dai: 430 },
];

const CATEGORIES = [
  { name: "DeFi", value: 35, color: "#6366f1" },
  { name: "Merchants", value: 28, color: "#22d3ee" },
  { name: "Transfers", value: 18, color: "#a78bfa" },
  { name: "NFTs", value: 12, color: "#f59e0b" },
  { name: "Gas", value: 7, color: "#34d399" },
];

const NAV_ITEMS = [
  { id: "overview", icon: "▦", label: "Overview" },
  { id: "transactions", icon: "⇄", label: "Transactions" },
  { id: "automation", icon: "⚙", label: "Automation" },
  { id: "merchants", icon: "🏪", label: "Merchants" },
  { id: "analytics", icon: "📊", label: "Analytics" },
];

const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const shortAddr = (a) => a.slice(0, 6) + "..." + a.slice(-4);
const statusColor = (s) => ({ confirmed: "#34d399", pending: "#f59e0b", failed: "#f87171" }[s] || "#94a3b8");

async function callAI(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: "You are an AI assistant for Arc Finance, a stablecoin dashboard. Be concise, finance-focused, use bullet points, mention USDC/USDT/DAI. Under 120 words.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "No response.";
}

function BarChart({ data, filter }) {
  const max = Math.max(...data.map(d => d.usdc + d.usdt + d.dai));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110, padding: "0 4px" }}>
      {data.map((d, i) => {
        const total = (filter === "all" ? d.usdc + d.usdt + d.dai : d[filter]) || 0;
        const h = (total / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ fontSize: 9, color: "#64748b" }}>{fmt(total)}</div>
            <div style={{ width: "100%", height: h + "%", borderRadius: "3px 3px 0 0", background: "linear-gradient(180deg,#6366f1,#818cf8)", minHeight: 4, transition: "height 0.5s ease" }} />
            <div style={{ fontSize: 10, color: "#64748b" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  const r = 45, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg width={120} height={120}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#1e293b" strokeWidth={18} />
        {data.map((d, i) => {
          const dash = (d.value / 100) * circ, gap = circ - dash;
          const el = <circle key={i} cx={60} cy={60} r={r} fill="none" stroke={d.color} strokeWidth={18}
            strokeDasharray={dash + " " + gap} strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />;
          offset += dash; return el;
        })}
        <text x={60} y={54} textAnchor="middle" fill="#e2e8f0" fontSize={11} fontWeight="600">Total</text>
        <text x={60} y={70} textAnchor="middle" fill="#6366f1" fontSize={10}>$15.2k</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
            <span style={{ color: "#94a3b8" }}>{d.name}</span>
            <span style={{ color: "#e2e8f0", marginLeft: "auto", paddingLeft: 12 }}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selIdx, setSelIdx] = useState(0);
  const [aiRes, setAiRes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddr] = useState("0x71C7656EC7ab88b098defB751B7401B5f6d8976F");
  const [usdcBal] = useState("12,450.00");
  const [chartFilter, setChartFilter] = useState("all");
  const [rules, setRules] = useState(MOCK_RULES);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setSuggestions(COMMANDS.slice(0, 5)); return; }
    const q = query.toLowerCase();
    setSuggestions(COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)).slice(0, 6));
    setSelIdx(0);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(v => !v); }
      if (e.key === "Escape") { setCmdOpen(false); setConfirmModal(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => { if (cmdOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [cmdOpen]);

  const runAI = async (prompt) => {
    setAiLoading(true); setAiRes("");
    try {
      const text = await callAI(prompt);
      let i = 0;
      const iv = setInterval(() => { setAiRes(text.slice(0, i)); i += 3; if (i > text.length) { setAiRes(text); clearInterval(iv); } }, 18);
    } catch { setAiRes("API error — check your REACT_APP_ANTHROPIC_API_KEY in .env"); }
    setAiLoading(false);
  };

  const execCommand = useCallback(async (cmd) => {
    const q = (cmd || query).toLowerCase();
    if (q.includes("invoice") || q.includes("payment") || q.includes("simulate")) {
      setConfirmModal({ title: "Confirm Action", desc: "Execute: \"" + (cmd || query) + "\"?", detail: "Simulated on Arc Testnet — no real funds.", onConfirm: () => { setConfirmModal(null); runAI(cmd || query); } });
      return;
    }
    if (q.includes("connect wallet")) { setWalletConnected(true); setAiRes("Wallet connected. Arc Testnet active."); return; }
    runAI(cmd || query);
  }, [query]);

  const handleKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); execCommand(suggestions[selIdx]?.label); }
  };

  const toggleRule = (id) => setRules(r => r.map(x => x.id === id ? { ...x, active: !x.active } : x));

  const merchants = Object.values(MOCK_TRANSACTIONS.reduce((acc, t) => {
    if (!acc[t.merchant]) acc[t.merchant] = { merchant: t.merchant, volume: 0, txCount: 0, avgTx: 0 };
    acc[t.merchant].volume += t.amount; acc[t.merchant].txCount += 1;
    acc[t.merchant].avgTx = Math.round(acc[t.merchant].volume / acc[t.merchant].txCount);
    return acc;
  }, {})).sort((a, b) => b.volume - a.volume);

  const totalSpend = MOCK_TRANSACTIONS.filter(t => t.status === "confirmed").reduce((s, t) => s + t.amount, 0);

  const c = {
    wrap: { display: "flex", height: "100vh", background: "#080c14", color: "#e2e8f0", fontFamily: "'Inter',system-ui,sans-serif", fontSize: 13, overflow: "hidden" },
    sidebar: { width: sidebarCollapsed ? 56 : 200, background: "#0a0f1a", borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", transition: "width 0.2s ease", flexShrink: 0, overflow: "hidden" },
    sideTop: { padding: sidebarCollapsed ? "16px 12px" : "16px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { fontWeight: 700, fontSize: 15, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden" },
    logoSpan: { color: "#6366f1" },
    collapseBtn: { background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: 14, padding: 2, flexShrink: 0 },
    navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: sidebarCollapsed ? "10px 16px" : "9px 14px", cursor: "pointer", borderRadius: 7, margin: "2px 6px", background: active ? "#1e2d45" : "transparent", color: active ? "#e2e8f0" : "#64748b", borderLeft: active ? "2px solid #6366f1" : "2px solid transparent", whiteSpace: "nowrap", transition: "all 0.15s", fontSize: 12.5 }),
    navIcon: { fontSize: 14, flexShrink: 0 },
    sideBottom: { marginTop: "auto", padding: "12px 8px", borderTop: "1px solid #1e293b" },
    walletCard: { background: "#0d1424", border: "1px solid #1e293b", borderRadius: 8, padding: sidebarCollapsed ? "8px" : "10px 12px", cursor: "pointer" },
    content: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
    topbar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid #1e293b", background: "#0a0f1a", flexShrink: 0 },
    pageTitle: { fontWeight: 700, fontSize: 16 },
    kbdBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "#1e293b", border: "1px solid #334155", cursor: "pointer", fontSize: 12, color: "#94a3b8" },
    scroll: { flex: 1, overflowY: "auto", padding: 20 },
    grid3: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 },
    card: { background: "#0d1424", border: "1px solid #1e293b", borderRadius: 12, padding: 16 },
    cardTitle: { fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 },
    statNum: { fontSize: 24, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.5px" },
    badge: (col) => ({ display: "inline-flex", alignItems: "center", padding: "2px 7px", borderRadius: 4, background: col + "18", color: col, fontSize: 10, fontWeight: 600 }),
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "7px 10px", fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", borderBottom: "1px solid #1e293b" },
    td: { padding: "8px 10px", borderBottom: "1px solid #0f172a", fontSize: 12 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 80 },
    cmdBox: { width: "100%", maxWidth: 580, background: "#0d1424", border: "1px solid #1e293b", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" },
    cmdInput: { width: "100%", background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 14, padding: "15px 16px", boxSizing: "border-box" },
    sugItem: (sel) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", cursor: "pointer", background: sel ? "#1e2d45" : "transparent", borderLeft: sel ? "2px solid #6366f1" : "2px solid transparent" }),
    aiPanel: { padding: "14px 16px", background: "#050810", borderTop: "1px solid #1e293b", fontSize: 12, color: "#cbd5e1", lineHeight: 1.65, maxHeight: 200, overflowY: "auto" },
    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { background: "#0d1424", border: "1px solid #1e293b", borderRadius: 14, padding: 24, width: 360, boxShadow: "0 24px 60px rgba(0,0,0,0.7)" },
    btnPrimary: { padding: "8px 16px", borderRadius: 7, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 },
    btnSecondary: { padding: "8px 14px", borderRadius: 7, background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", cursor: "pointer", fontSize: 12 },
    toggle: (on) => ({ width: 30, height: 17, borderRadius: 9, background: on ? "#6366f1" : "#1e293b", position: "relative", cursor: "pointer", border: "1px solid " + (on ? "#818cf8" : "#334155"), transition: "background 0.2s", flexShrink: 0 }),
    toggleKnob: (on) => ({ position: "absolute", top: 2, left: on ? 13 : 2, width: 11, height: 11, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }),
    actionBadge: (a) => ({ padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: ({ alert: "#f59e0b18", block: "#f8717118", approve: "#34d39918", notify: "#6366f118" }[a] || "#1e293b"), color: ({ alert: "#f59e0b", block: "#f87171", approve: "#34d399", notify: "#6366f1" }[a] || "#94a3b8") }),
  };

  const pageTitles = { overview: "Overview", transactions: "Transactions", automation: "Automation Rules", merchants: "Merchant Analytics", analytics: "Stablecoin Analytics" };

  return (
    <div style={c.wrap}>
      <aside style={c.sidebar}>
        <div style={c.sideTop}>
          {!sidebarCollapsed && <div style={c.logo}><span style={c.logoSpan}>Arc</span> Finance</div>}
          <button style={c.collapseBtn} onClick={() => setSidebarCollapsed(v => !v)}>{sidebarCollapsed ? "▶" : "◀"}</button>
        </div>
        <nav style={{ padding: "8px 0", flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <div key={item.id} style={c.navItem(activeTab === item.id)} onClick={() => setActiveTab(item.id)}>
              <span style={c.navIcon}>{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
          ))}
        </nav>
        <div style={c.sideBottom}>
          <div style={c.walletCard} onClick={() => setWalletConnected(v => !v)}>
            {sidebarCollapsed ? (
              <div style={{ textAlign: "center", fontSize: 14 }}>{walletConnected ? "🟢" : "⚪"}</div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>WALLET</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: walletConnected ? "#34d399" : "#475569" }} />
                  <span style={{ fontSize: 11, color: walletConnected ? "#34d399" : "#64748b" }}>{walletConnected ? shortAddr(walletAddr) : "Not connected"}</span>
                </div>
                {walletConnected && <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, marginTop: 4 }}>$ {usdcBal} USDC</div>}
              </>
            )}
          </div>
        </div>
      </aside>

      <div style={c.content}>
        <div style={c.topbar}>
          <div style={c.pageTitle}>{pageTitles[activeTab]}</div>
          <button style={c.kbdBtn} onClick={() => setCmdOpen(true)}>
            <span>✦ Command</span><kbd style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, padding: "1px 5px", fontSize: 10, color: "#64748b" }}>⌘K</kbd>
          </button>
        </div>

        <div style={c.scroll}>
          {activeTab === "overview" && (
            <>
              <div style={c.grid3}>
                {[
                  { label: "Total Spend", val: fmt(totalSpend), sub: "Confirmed txns", col: "#34d399", trend: "↑ 12.4%" },
                  { label: "USDC Balance", val: walletConnected ? ("$" + usdcBal) : "—", sub: walletConnected ? "Arc Testnet" : "Connect wallet", col: "#6366f1", trend: walletConnected ? "Live" : null },
                  { label: "Active Rules", val: rules.filter(r => r.active).length, sub: rules.length + " total", col: "#f59e0b", trend: null },
                ].map((st, i) => (
                  <div key={i} style={c.card}>
                    <div style={c.cardTitle}>{st.label}</div>
                    <div style={c.statNum}>{st.val}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{st.sub}</span>
                      {st.trend && <span style={c.badge(st.col)}>{st.trend}</span>}
                    </div>
                  </div>
                ))}
              </div>
              <div style={c.grid2}>
                <div style={c.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={c.cardTitle}>Monthly Spend</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {["all","usdc","usdt","dai"].map(f => (
                        <button key={f} onClick={() => setChartFilter(f)} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: chartFilter === f ? "#6366f1" : "#1e293b", color: chartFilter === f ? "#fff" : "#64748b", border: "none", fontWeight: 600 }}>{f.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <BarChart data={MONTHLY_DATA} filter={chartFilter} />
                </div>
                <div style={c.card}>
                  <div style={c.cardTitle}>Category Breakdown</div>
                  <DonutChart data={CATEGORIES} />
                </div>
              </div>
              <div style={{ ...c.card, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={c.cardTitle}>Recent Transactions</div>
                  <button style={{ ...c.btnSecondary, fontSize: 11 }} onClick={() => setActiveTab("transactions")}>View All →</button>
                </div>
                <table style={c.table}>
                  <thead><tr>{["Merchant","Amount","Status","Date"].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {MOCK_TRANSACTIONS.slice(0, 5).map((t, i) => (
                      <tr key={i}>
                        <td style={c.td}><span style={{ color: "#e2e8f0" }}>{t.merchant}</span></td>
                        <td style={c.td}><span style={{ color: "#6366f1", fontWeight: 600 }}>{fmt(t.amount)}</span></td>
                        <td style={c.td}><span style={c.badge(statusColor(t.status))}>{t.status}</span></td>
                        <td style={c.td}><span style={{ color: "#475569" }}>{new Date(t.timestamp).toLocaleDateString()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={c.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={c.cardTitle}>AI Spending Insights</div>
                  <button style={c.btnPrimary} onClick={() => runAI("Give me spending insights for this stablecoin finance dashboard.")}>✦ Analyze</button>
                </div>
                {aiRes ? <div style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiRes}</div>
                  : <div style={{ color: "#334155", fontSize: 12 }}>Click Analyze to generate AI insights.</div>}
              </div>
            </>
          )}

          {activeTab === "transactions" && (
            <div style={c.card}>
              <div style={c.cardTitle}>All Transactions</div>
              <table style={c.table}>
                <thead><tr>{["ID","Merchant","Amount","Status","Date"].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {MOCK_TRANSACTIONS.map((t, i) => (
                    <tr key={i}>
                      <td style={c.td}><span style={{ fontFamily: "monospace", color: "#475569", fontSize: 11 }}>{t.id}</span></td>
                      <td style={c.td}><span style={{ color: "#e2e8f0" }}>{t.merchant}</span></td>
                      <td style={c.td}><span style={{ color: "#6366f1", fontWeight: 600 }}>{fmt(t.amount)}</span></td>
                      <td style={c.td}><span style={c.badge(statusColor(t.status))}>{t.status}</span></td>
                      <td style={c.td}><span style={{ color: "#475569" }}>{new Date(t.timestamp).toLocaleDateString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "automation" && (
            <div style={c.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={c.cardTitle}>Automation Rules</div>
                <button style={c.btnPrimary} onClick={() => setCmdOpen(true)}>+ New Rule</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rules.map(r => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#080c14", borderRadius: 8, border: "1px solid #1e293b" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#e2e8f0", fontSize: 13, marginBottom: 5 }}>{r.rule}</div>
                      <span style={c.actionBadge(r.action)}>{r.action.toUpperCase()}</span>
                    </div>
                    <div style={c.toggle(r.active)} onClick={() => toggleRule(r.id)}>
                      <div style={c.toggleKnob(r.active)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "merchants" && (
            <div style={c.card}>
              <div style={c.cardTitle}>Merchant Analytics</div>
              <table style={c.table}>
                <thead><tr>{["Merchant","Volume","Txns","Avg Tx","Trend"].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {merchants.map((m, i) => (
                    <tr key={i}>
                      <td style={c.td}><span style={{ color: "#e2e8f0", fontWeight: 500 }}>{m.merchant}</span></td>
                      <td style={c.td}><span style={{ color: "#6366f1", fontWeight: 600 }}>{fmt(m.volume)}</span></td>
                      <td style={c.td}>{m.txCount}</td>
                      <td style={c.td}>{fmt(m.avgTx)}</td>
                      <td style={c.td}><span style={c.badge(i < 3 ? "#34d399" : "#f59e0b")}>{i < 3 ? "↑ High" : "→ Mid"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "analytics" && (
            <>
              <div style={c.grid2}>
                <div style={c.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={c.cardTitle}>Monthly Stablecoin Spend</div>
                    <div style={{ display: "flex", gap: 3 }}>
                      {["all","usdc","usdt","dai"].map(f => (
                        <button key={f} onClick={() => setChartFilter(f)} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, cursor: "pointer", background: chartFilter === f ? "#6366f1" : "#1e293b", color: chartFilter === f ? "#fff" : "#64748b", border: "none", fontWeight: 600 }}>{f.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>
                  <BarChart data={MONTHLY_DATA} filter={chartFilter} />
                </div>
                <div style={c.card}>
                  <div style={c.cardTitle}>Spend by Category</div>
                  <DonutChart data={CATEGORIES} />
                </div>
              </div>
              <div style={c.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={c.cardTitle}>AI Analytics</div>
                  <button style={c.btnPrimary} onClick={() => runAI("Analyze stablecoin spending patterns across USDC, USDT and DAI.")}>✦ Run Analysis</button>
                </div>
                {aiRes ? <div style={{ color: "#cbd5e1", fontSize: 12, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiRes}</div>
                  : <div style={{ color: "#334155", fontSize: 12 }}>Run analysis to get AI-powered insights.</div>}
              </div>
            </>
          )}
        </div>
      </div>

      {cmdOpen && (
        <div style={c.overlay} onClick={e => { if (e.target === e.currentTarget) setCmdOpen(false); }}>
          <div style={c.cmdBox}>
            <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e293b", padding: "0 14px" }}>
              <span style={{ color: "#475569", fontSize: 15 }}>✦</span>
              <input ref={inputRef} style={c.cmdInput} placeholder="Ask anything…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey} />
              {aiLoading && <span style={{ color: "#6366f1", fontSize: 11, whiteSpace: "nowrap" }}>thinking…</span>}
            </div>
            {suggestions.map((s2, i) => (
              <div key={s2.id} style={c.sugItem(i === selIdx)} onMouseEnter={() => setSelIdx(i)} onClick={() => execCommand(s2.label)}>
                <span style={{ fontSize: 14 }}>{s2.icon}</span>
                <span style={{ color: "#e2e8f0", fontSize: 12.5, flex: 1 }}>{s2.label}</span>
                <span style={{ fontSize: 10, color: "#334155", background: "#0f172a", padding: "2px 6px", borderRadius: 4 }}>{s2.category}</span>
              </div>
            ))}
            {(aiRes || aiLoading) && (
              <div style={c.aiPanel}>
                {aiLoading && !aiRes ? <div style={{ color: "#334155" }}>✦ Generating…</div> : <div style={{ whiteSpace: "pre-wrap" }}>{aiRes}</div>}
              </div>
            )}
            <div style={{ display: "flex", gap: 12, padding: "7px 14px", borderTop: "1px solid #1e293b" }}>
              {[["↵","Select"],["↑↓","Nav"],["Esc","Close"]].map(([k,l]) => (
                <span key={k} style={{ fontSize: 10, color: "#334155", display: "flex", gap: 4 }}>
                  <kbd style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 4px", color: "#475569" }}>{k}</kbd>{l}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={c.modalOverlay}>
          <div style={c.modal}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>⚡ {confirmModal.title}</div>
            <div style={{ color: "#94a3b8", fontSize: 12.5, marginBottom: 6 }}>{confirmModal.desc}</div>
            <div style={{ color: "#475569", fontSize: 11, marginBottom: 20, padding: "8px 10px", background: "#050810", borderRadius: 6, border: "1px solid #1e293b" }}>{confirmModal.detail}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={c.btnSecondary} onClick={() => setConfirmModal(null)}>Cancel</button>
              <button style={c.btnPrimary} onClick={confirmModal.onConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
