"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

interface CopyAddressProps {
  address: string;
  explorerUrl: string;
  explorerLabel: string;
}

export function CopyAddress({ address, explorerUrl, explorerLabel }: CopyAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const el = document.createElement("textarea");
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <code className="text-xs text-zinc-300 font-mono bg-zinc-800 px-2 py-1 rounded break-all">
        {address}
      </code>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
      >
        {copied ? (
          <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
        ) : (
          <><Copy className="w-3 h-3" /><span>Copy</span></>
        )}
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
      >
        <ExternalLink className="w-3 h-3" />
        {explorerLabel}
      </a>
    </div>
  );
}
