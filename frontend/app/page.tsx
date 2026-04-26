"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LogLevel = "error" | "warning" | "info";
type IssueCategory = "network" | "hardware" | "system" | "performance" | "unknown";

type AnalyzeResponse = {
  log_level: LogLevel;
  log_level_confidence: number;
  issue_category: IssueCategory;
  issue_confidence: number;
  keywords: string[];
};

type HistoryItem = {
  id: number;
  text: string;
  result: AnalyzeResponse;
  timestamp: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const HISTORY_STORAGE_KEY = "ai-log-dashboard-recent-logs";
const LEVEL_COLORS: Record<LogLevel, string> = {
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};
const DEMO_EXAMPLES = [
  "Sensor connection failed at 14:32",
  "Temperature exceeded safe threshold",
  "System started successfully",
  "Disk usage is critically high",
  "Network latency increased significantly",
];
const DEMO_LOGS: Array<{ text: string; result: AnalyzeResponse }> = [
  {
    text: "[ERROR] Sensor connection failed in chamber 03",
    result: {
      log_level: "error",
      log_level_confidence: 0.95,
      issue_category: "hardware",
      issue_confidence: 0.88,
      keywords: ["sensor", "connection", "failed"],
    },
  },
  {
    text: "Connection lost between device and server for 12 seconds",
    result: {
      log_level: "error",
      log_level_confidence: 0.89,
      issue_category: "network",
      issue_confidence: 0.93,
      keywords: ["connection", "lost", "server"],
    },
  },
  {
    text: "[WARN] Temperature exceeded threshold by 4C",
    result: {
      log_level: "warning",
      log_level_confidence: 0.92,
      issue_category: "hardware",
      issue_confidence: 0.9,
      keywords: ["temperature", "threshold", "exceeded"],
    },
  },
  {
    text: "Disk usage is critically high on analytics node",
    result: {
      log_level: "warning",
      log_level_confidence: 0.9,
      issue_category: "system",
      issue_confidence: 0.86,
      keywords: ["disk", "usage", "high"],
    },
  },
  {
    text: "[INFO] System started successfully after maintenance",
    result: {
      log_level: "info",
      log_level_confidence: 0.94,
      issue_category: "system",
      issue_confidence: 0.83,
      keywords: ["system", "started", "maintenance"],
    },
  },
];

export default function DashboardPage() {
  const [input, setInput] = useState("[ERROR] Sensor connection failed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalyzeResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const persisted = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!persisted) return;
      const parsed = JSON.parse(persisted) as HistoryItem[];
      if (Array.isArray(parsed)) {
        setRecentLogs(parsed.slice(0, 8));
        if (parsed[0]?.result) {
          setCurrentResult(parsed[0].result);
        }
      }
    } catch {
      // Ignore malformed local storage payloads and continue with empty history.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(recentLogs));
  }, [recentLogs]);

  const levelDistribution = useMemo(() => {
    const counts: Record<LogLevel, number> = { error: 0, warning: 0, info: 0 };
    recentLogs.forEach((item) => {
      counts[item.result.log_level] += 1;
    });
    return (Object.keys(counts) as LogLevel[]).map((key) => ({
      name: key,
      value: counts[key],
      fill: LEVEL_COLORS[key],
    }));
  }, [recentLogs]);

  const issueDistribution = useMemo(() => {
    const counts: Record<IssueCategory, number> = {
      network: 0,
      hardware: 0,
      system: 0,
      performance: 0,
      unknown: 0,
    };
    recentLogs.forEach((item) => {
      counts[item.result.issue_category] += 1;
    });
    return (Object.keys(counts) as IssueCategory[]).map((key) => ({
      name: key,
      count: counts[key],
    }));
  }, [recentLogs]);

  const analyzeLog = async (textOverride?: string) => {
    const textToAnalyze = textOverride ?? input;
    if (!textToAnalyze.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/analyze-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error(`API error (${response.status})`);
      }

      const result: AnalyzeResponse = await response.json();
      setCurrentResult(result);

      const newItem: HistoryItem = {
        id: Date.now(),
        text: textToAnalyze,
        result,
        timestamp: new Date().toLocaleTimeString(),
      };
      setRecentLogs((prev) => [newItem, ...prev].slice(0, 8));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(`Failed to analyze log. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    const now = Date.now();
    const demoItems: HistoryItem[] = DEMO_LOGS.map((entry, index) => ({
      id: now - index,
      text: entry.text,
      result: entry.result,
      timestamp: new Date(now - index * 60000).toLocaleTimeString(),
    }));

    setRecentLogs(demoItems);
    setCurrentResult(demoItems[0].result);
    setInput(demoItems[0].text);
    setError(null);
  };

  const clearHistory = () => {
    setRecentLogs([]);
    setCurrentResult(null);
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  const handleDemoClick = (demoText: string) => {
    setInput(demoText);
    void analyzeLog(demoText);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 p-6 lg:p-10">
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass sticky top-4 z-10 rounded-2xl px-6 py-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">System Intelligence</p>
            <p className="mt-1 text-lg font-semibold text-white">AI System Monitoring Dashboard</p>
          </div>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
            NLP-Based Log Analysis &amp; Issue Detection
          </span>
        </div>
      </motion.nav>

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="glass rounded-2xl px-6 py-12 text-center lg:px-12"
      >
        <p className="text-sm uppercase tracking-[0.32em] text-slate-400">AI Monitoring Suite</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-tight text-white lg:text-5xl">
          AI System Monitoring Dashboard
        </h1>
        <p className="mt-3 text-base font-medium text-cyan-200 lg:text-lg">
          NLP-Based Log Analysis &amp; Issue Detection
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-slate-300">
          Analyze system logs using AI to detect issues, classify severity, and monitor system
          health in real-time.
        </p>
      </motion.header>

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold">Log Input</h2>
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-300">Demo Logs</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleDemoClick(example)}
                  className="rounded-xl border border-border bg-slate-900/70 px-3 py-2 text-left text-xs text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-400/50 hover:bg-slate-800"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste a raw system log line..."
            className="mt-4 h-40 w-full rounded-xl border border-border bg-slate-950/70 p-4 text-sm text-slate-100 outline-none ring-accent transition focus:ring-2"
          />
          <button
            type="button"
            onClick={() => {
              void analyzeLog();
            }}
            disabled={loading}
            className="mt-4 rounded-xl bg-accent px-5 py-2.5 font-medium text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analyzing..." : "Analyze Log"}
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadDemoData}
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-200 transition hover:bg-cyan-400/20"
            >
              Load Demo Scenario
            </button>
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Clear History
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold">Latest Analysis</h2>
          {!currentResult ? (
            <p className="mt-4 text-slate-400">Run an analysis to populate this panel.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <MetricCard
                title="Log Level"
                value={currentResult.log_level}
                color={LEVEL_COLORS[currentResult.log_level]}
              />
              <MetricCard title="Issue Category" value={currentResult.issue_category} color="#22d3ee" />
              <ConfidenceBar
                title="Log Level Confidence"
                value={currentResult.log_level_confidence}
                color={LEVEL_COLORS[currentResult.log_level]}
              />
              <ConfidenceBar
                title="Issue Confidence"
                value={currentResult.issue_confidence}
                color="#14b8a6"
              />
              <div className="md:col-span-2">
                <p className="mb-2 text-sm text-slate-300">Detected Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {currentResult.keywords.length ? (
                    currentResult.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full border border-border bg-slate-950/70 px-3 py-1 text-xs text-slate-200"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No keywords extracted.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold">Log Level Distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={levelDistribution} dataKey="value" nameKey="name" outerRadius={95}>
                  {levelDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold">Issue Category Distribution</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold">Recent Logs</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="pb-2">Time</th>
                <th className="pb-2">Log Message</th>
                <th className="pb-2">Level</th>
                <th className="pb-2">Issue</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td className="pt-2 text-slate-400" colSpan={4}>
                    No logs analyzed yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((item) => (
                  <tr key={item.id} className="border-t border-border/70 align-top">
                    <td className="py-3 text-slate-400">{item.timestamp}</td>
                    <td className="py-3 pr-3 text-slate-200">{item.text}</td>
                    <td className="py-3 capitalize" style={{ color: LEVEL_COLORS[item.result.log_level] }}>
                      {item.result.log_level}
                    </td>
                    <td className="py-3 capitalize text-slate-200">{item.result.issue_category}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.section>
    </main>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-slate-950/60 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-semibold capitalize" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function ConfidenceBar({ title, value, color }: { title: string; value: number; color: string }) {
  const percentage = Math.round(value * 100);
  return (
    <div className="rounded-xl border border-border bg-slate-950/60 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{title}</span>
        <span className="font-medium text-slate-200">{percentage}%</span>
      </div>
      <div className="h-2 w-full rounded bg-slate-800">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
