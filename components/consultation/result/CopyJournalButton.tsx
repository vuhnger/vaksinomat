"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { formatJournalText } from "@/lib/engines/journal-formatter";
import type { RecommendationResult } from "@/lib/types";

interface CopyJournalButtonProps {
  result: RecommendationResult;
}

export function CopyJournalButton({ result }: CopyJournalButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = formatJournalText(result);

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant={copied ? "secondary" : "outline"}
      className="gap-2"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          Kopiert!
        </>
      ) : (
        <>
          <Clipboard className="w-4 h-4" />
          Kopier journaltekst
        </>
      )}
    </Button>
  );
}
