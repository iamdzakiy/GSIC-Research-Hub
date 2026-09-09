"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle2, AlertTriangle, Users, ClipboardList, TestTube2, Database } from "lucide-react";
import { triggerSync } from "@/services/sync";
import { cn } from "@/lib/cn";

export default function DataSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string; summary?: { users: number; registrations: number; testResults: number } } | null>(null);

  const runSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setResult(null);
    try {
      const res = await triggerSync();
      setResult({ success: res.success, summary: res.summary });
    } catch (e) {
      setResult({ success: false, error: e instanceof Error ? e.message : "Sync failed." });
    } finally {
      setSyncing(false);
    }
  };

  const configured =
    !!process.env.NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_EMAIL ||
    !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2 font-heading">
          <Database className="w-4 h-4 text-[#5CE3B6]" /> Google Sheets Data Sync
        </h3>
        <p className="text-sm text-white/50 mb-5">
          One-click sync of users, event registrations and test analytics to your Google
          Spreadsheet via the Sheets API v4.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={runSync}
            disabled={syncing}
            className="flex items-center gap-2 text-sm bg-gradient-to-r from-[#3352CD] to-[#5CE3B6] hover:from-[#4a6cf7] hover:to-[#7ff0cc] text-white px-6 py-2.5 rounded-full font-medium shadow-lg shadow-[#3352CD]/30 disabled:opacity-50 transition"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
          {configured ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#5CE3B6] bg-[#5CE3B6]/10 border border-[#5CE3B6]/30 rounded-full px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sheets configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-[#F2F8C9] bg-[#F2F8C9]/10 border border-[#F2F8C9]/30 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Awaiting credentials
            </span>
          )}
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl border p-4 text-sm",
              result.success
                ? "bg-[#5CE3B6]/5 border-[#5CE3B6]/30 text-[#5CE3B6]"
                : "bg-red-500/5 border-red-500/30 text-red-400"
            )}
          >
            {result.success ? (
              <div>
                <p className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Sync completed
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 max-w-md">
                  <Stat icon={<Users className="w-4 h-4" />} label="Users" value={result.summary?.users ?? 0} />
                  <Stat icon={<ClipboardList className="w-4 h-4" />} label="Registrations" value={result.summary?.registrations ?? 0} />
                  <Stat icon={<TestTube2 className="w-4 h-4" />} label="Test Results" value={result.summary?.testResults ?? 0} />
                </div>
              </div>
            ) : (
              <div>
                <p className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Sync failed
                </p>
                <p className="mt-1 text-xs text-white/60">{result.error}</p>
              </div>
            )}
          </motion.div>
        )}

        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/40 mb-2">Required environment variables:</p>
          <code className="text-[11px] text-[#5CE3B6] block whitespace-pre-wrap">
            {`GOOGLE_SHEETS_CLIENT_EMAIL\nGOOGLE_SHEETS_PRIVATE_KEY\nGOOGLE_SHEETS_SPREADSHEET_ID\n\nOptional sheet-title overrides:\nGOOGLE_SHEETS_SHEET_USERS, _REGISTRATIONS, _TESTRESULTS`}
          </code>
          <p className="text-xs text-white/40 mt-2">
            Share your spreadsheet with the service account email first.
          </p>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-[#5CE3B6]">{icon}</div>
      <p className="mt-1 text-xl font-bold text-white font-heading">{value}</p>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}