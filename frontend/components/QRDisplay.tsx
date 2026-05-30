"use client";

import { useEffect, useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { makeQR } from "@/lib/qr";
import { copy } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { Spinner } from "@/components/ui/Spinner";

export function QRDisplay({
  data,
  caption,
  accent = "seal",
}: {
  data: string;
  caption?: string;
  accent?: "seal" | "lucky";
}) {
  const [src, setSrc] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    makeQR(data).then((d) => alive && setSrc(d));
    return () => {
      alive = false;
    };
  }, [data]);

  const onShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: "SealQR", text: caption ?? "Scan to claim", url: data });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await copy(data);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy", "Long-press the code to copy it manually");
    }
  };

  const glow = accent === "lucky" ? "shadow-glow-lucky" : "shadow-glow";

  return (
    <div className="flex flex-col items-center">
      <div className={`rounded-3xl bg-white p-5 ${glow}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption ?? "SealQR code"} width={256} height={256} className="h-44 w-44 rounded-2xl sm:h-56 sm:w-56" />
        ) : (
          <div className="grid h-44 w-44 place-items-center rounded-2xl text-ink-900 sm:h-56 sm:w-56">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>
      {caption && <p className="mt-3 text-center text-sm text-white/55">{caption}</p>}
      <div className="mt-4 flex gap-2">
        <button
          onClick={async () => {
            try {
              await copy(data);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              toast.error("Couldn't copy", "Long-press the code to copy it manually");
            }
          }}
          className="btn-ghost px-4 py-2.5 text-sm"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={onShare} className="btn-ghost px-4 py-2.5 text-sm">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
