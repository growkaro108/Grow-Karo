"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoveRight, UserRoundKey } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky -top-1 z-50 rounded-3xl border border-slate-100 bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-slate-100 border border-slate-200/60 shadow-sm transition group-hover:opacity-90">
            <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="object-cover h-full w-full" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-700">Grow-Karo</p>
            <p className="text-xs text-slate-500">Trusted investment platform</p>
          </div>
        </Link>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <Link href="/" className="transition hover:text-blue-600">Home</Link>
          <Link href="/dashboard" className="transition hover:text-blue-600">Dashboard</Link>
          <Link href="#trust" className="transition hover:text-blue-600">Security</Link>
          <Link href="#insights" className="transition hover:text-blue-600">Solutions</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/auth" className="flex font-medium text-slate-600 transition hover:text-slate-900 align-middle border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50">
            Log In <UserRoundKey className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/auth?mode=signup"
            className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-6 font-semibold text-white transition duration-300 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20"
          >
            Get Started <MoveRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 text-slate-600 transition hover:bg-slate-50 md:hidden"
          aria-label="Toggle navigation"
        >
          {isOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="mt-4 border-t border-slate-50 pt-4 flex flex-col gap-3 md:hidden">
          <Link
            href="#home"
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
          >
            Home
          </Link>
          <Link
            href="#features"
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
          >
            How it Works
          </Link>
          <Link
            href="#trust"
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
          >
            Security
          </Link>
          <Link
            href="#insights"
            onClick={() => setIsOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-blue-600"
          >
            Solutions
          </Link>
          <hr className="border-slate-50 my-1" />
          <div className="flex flex-col gap-2 px-3 pb-2">
            <Link
              href="/auth"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center rounded-full border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}


