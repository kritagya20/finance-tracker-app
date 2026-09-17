import React, { useState } from 'react';
import { Shield, Database, Lock, Download, Upload, AlertTriangle, LogOut } from 'lucide-react';
import { Switch } from '../../components/ui/Switch';


interface VaultScreenProps {
  onLogout?: () => void;
}

export const VaultScreen: React.FC<VaultScreenProps> = ({ onLogout }) => {
  const [autoDetect, setAutoDetect] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="size-6 text-violet-400" />
          <h1 className="text-xl font-bold text-slate-100">Privacy Vault</h1>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="size-3.5 text-rose-400" />
            <span>Lock Vault</span>
          </button>
        )}
      </div>

      {/* Zero Knowledge Banner */}
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Lock className="size-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-emerald-300">
              100% On-Device & Zero-Knowledge
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-emerald-200/70">
              Your financial records never leave this device. All calculations,
              budgets, and parsing rules are executed purely in client-side storage.
            </p>
          </div>
        </div>
      </div>

      {/* Local Storage Metrics */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="size-5 text-violet-400" />
            <span className="text-sm font-semibold text-slate-200">
              Local Storage Engine
            </span>
          </div>
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
            SQLite (OPFS) Ready
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-slate-800/60 p-2.5">
            <p className="text-slate-400">Records Stored</p>
            <p className="text-base font-semibold text-white mt-0.5">4 Transactions</p>
          </div>
          <div className="rounded-xl bg-slate-800/60 p-2.5">
            <p className="text-slate-400">Space Consumed</p>
            <p className="text-base font-semibold text-white mt-0.5">14.2 KB</p>
          </div>
        </div>
      </div>

      {/* Auto Feed Settings */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 space-y-3">
        <p className="text-sm font-semibold text-slate-200">Auto-Feed & Ingestion</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-200">SMS / Bank Detection</p>
            <p className="text-[11px] text-slate-400">
              Parse financial SMS and statements locally
            </p>
          </div>
          <Switch
            checked={autoDetect}
            onCheckedChange={setAutoDetect}
            ariaLabel="SMS / Bank Detection"
          />
        </div>
      </div>

      {/* Backup & Portability */}
      <div className="rounded-3xl border border-white/10 bg-slate-900 p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-200">Backup & Export</p>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <Download className="size-4 text-violet-400" />
            Export Encrypted Vault (.vault)
          </span>
          <span className="text-[10px] text-slate-400">AES-256</span>
        </button>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-slate-800/60 px-3.5 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
        >
          <span className="flex items-center gap-2">
            <Upload className="size-4 text-emerald-400" />
            Restore from Backup File
          </span>
          <span className="text-[10px] text-slate-400">Import</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="pt-2">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
        >
          <AlertTriangle className="size-4" />
          Purge All On-Device Data
        </button>
      </div>
    </div>
  );
};
