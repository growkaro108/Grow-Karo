"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MoveRight, UserRoundKey, Menu, X, Home, LayoutDashboardIcon, NotebookPen, Send } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Centralized route definition to eliminate redundancy
  const navLinks = [
    { href: "/", label: "Home",icon : Home },
    { href: "/dashboard", label: "Admin", icon: LayoutDashboardIcon },
    // { href: "/user", label: "User", icon: LayoutDashboardIcon },
    // { href: "/remitter", label: "Remitter", icon: LayoutDashboardIcon },
    { href: "/about", label: "About Us", icon: NotebookPen },
    { href: "/solution", label: "Solutions", icon: Send  },
  ];

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
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1 py-1 transition-colors hover:text-blue-600 ${
                  isActive ? "text-blue-600 font-semibold" : "text-slate-600"
                }`}
              >
               <span>{link.icon && <link.icon className="h-5 w-5 lg:h-4 lg:w-4" />}</span> <span className=" lg:block hidden">{link.label}</span>
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-blue-600 transition-all" />
                )}
              </Link>
            );
          })}
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
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="mt-4 border-t border-slate-50 pt-4 flex flex-col gap-1 md:hidden">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-50/60 text-blue-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
              >
                <span>{link.label}</span>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
              </Link>
            );
          })}
          
          <hr className="border-slate-100 my-2 mx-2" />
          
          <div className="flex flex-col gap-2 px-2 pb-2">
            <Link
              href="/auth"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Log In
            </Link>
            <Link
              href="/auth?mode=signup"
              onClick={() => setIsOpen(false)}
              className="flex h-11 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-blue-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}