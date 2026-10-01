import React, { useState } from 'react';
import { SimulationResult } from '../../types/decision';
import { X, Copy, Check, Share2, Shield } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationResult | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  simulation,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen && simulation) {
      setLoading(true);
      fetch('/api/simulations/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(simulation),
      })
        .then((res) => {
          if (!res.ok) throw new Error('API returned ' + res.status);
          return res.json();
        })
        .then((data) => {
          if (data && data.token) {
            const fullUrl = `${window.location.origin}?shareToken=${data.token}`;
            setShareLink(fullUrl);
            setLoading(false);
          } else {
            throw new Error('No token returned');
          }
        })
        .catch(() => {
          // Portable encoded URL payload (works on Netlify without needing an external database)
          try {
            const jsonStr = JSON.stringify(simulation);
            const encoded = btoa(encodeURIComponent(jsonStr));
            const portableUrl = `${window.location.origin}?simData=${encoded}`;
            setShareLink(portableUrl);
          } catch {
            setShareLink(`${window.location.origin}?demoCategory=${simulation.decisionCategory}`);
          }
          setLoading(false);
        });
    }
  }, [isOpen, simulation]);

  if (!isOpen || !simulation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[88vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <h3 className="text-base font-bold text-white">Share Simulation</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed break-words">
            Generate an anonymized, read-only snapshot link to share this simulation with advisors, partners, or family members.
          </p>

          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs">
            <input
              type="text"
              readOnly
              value={loading ? 'Generating secure link...' : shareLink}
              className="w-full min-w-0 bg-transparent text-slate-300 focus:outline-none font-mono text-[11px]"
            />
            <button
              onClick={handleCopy}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1 rounded bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition shrink-0 min-h-[38px]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 shrink-0" /> Copy
                </>
              )}
            </button>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 pt-1">
            <Shield className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="break-words">
              Snapshot links contain only the model calculations and assumptions. No private login or external accounts are exposed.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
