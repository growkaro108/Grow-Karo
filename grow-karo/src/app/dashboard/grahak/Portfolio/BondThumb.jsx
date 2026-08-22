"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageOff, Maximize2 } from "lucide-react";

export default function BondThumb({ src, alt, size = 40, onExpand }) {
  const [errored, setErrored] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrored(false);
    setLoading(true);
  }, [src]);

  const dimensions = { width: size, height: size };
  if (errored || !src) {
    return <div className="rounded-md bg-slate-100 flex items-center justify-center text-slate-400" style={dimensions}><ImageOff size={16} /></div>;
  }

  return (
    <button type="button" onClick={(event) => { event.stopPropagation(); onExpand?.(); }} aria-label="View full-size image" className="relative rounded-md overflow-hidden border border-slate-100 bg-slate-100 group focus:outline-none focus:ring-2 focus:ring-indigo-400" style={dimensions}>
      {loading && <div className="absolute inset-0 animate-pulse bg-slate-200" />}
      <Image src={src} alt={alt} fill unoptimized sizes={`${size}px`} onLoad={() => setLoading(false)} onError={() => { setErrored(true); setLoading(false); }} className={`object-fit transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`} />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center"><Maximize2 size={14} className="text-white opacity-0 group-hover:opacity-100" /></div>
    </button>
  );
}
