"use client";

import { healthCheck } from "@/api/generalApi";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function FooterSection() {
  const [backendHealth, setBackendHealth] = useState("Checking...");
  const [isHealthy, setIsHealthy] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBackendHealth = async () => {
      try {
        const response = await healthCheck();

        // Handle fetch Response vs direct data object from API client
        let data;
        if (response && typeof response.json === "function") {
          if (response.ok) {
            data = await response.json();
          } else {
            throw new Error("Response not ok");
          }
        } else {
          data = response;
        }

        if (isMounted) {
          const statusText =
            typeof data === "string" ? data : "Online" || "Healthy";
          setBackendHealth(statusText);
          setIsHealthy(true);
        }
      } catch (error) {
        console.error("Error fetching backend health status:", error);
        if (isMounted) {
          setBackendHealth("Offline");
          setIsHealthy(false);
        }
      }
    };

    fetchBackendHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="mx-auto w-full max-w-7xl rounded-3xl border border-slate-100 bg-white p-6 shadow-xs sm:p-8 lg:p-10">
      {/* Top Row: Navigation Links and Social Media Icons */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Footer Navigation"
          className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500"
        >
          <Link
            href="/about"
            className="transition-colors hover:text-slate-900"
          >
            About
          </Link>
          <Link
            href="#terms"
            className="transition-colors hover:text-slate-900"
          >
            Terms
          </Link>
          <Link
            href="/solution"
            className="transition-colors hover:text-slate-900"
          >
            Solution
          </Link>
        </nav>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          {[
            {
              name: "Facebook",
              href: "#",
              icon: (
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              ),
            },
            {
              name: "Instagram",
              href: "#",
              icon: (
                <svg
                  className="h-4 w-4 fill-none stroke-current"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              ),
            },
            {
              name: "LinkedIn",
              href: "#",
              icon: (
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              ),
            },
            {
              name: "X",
              href: "#",
              icon: (
                <svg
                  className="h-4 w-4 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ),
            },
          ].map((social) => (
            <Link
              key={social.name}
              href={social.href}
              aria-label={social.name}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:text-slate-700"
            >
              {social.icon}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Row: Platform metadata, Copyright, and Dynamic System Status */}
      <div className="flex flex-col gap-4 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
          Secure Investment Platform
        </p>

        <p className="font-medium text-slate-500">
          © {new Date().getFullYear()} Groww-Karo. All rights reserved.
        </p>

        {/* Dynamic Backend Status Indicator Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
          <span className="relative flex h-2 w-2">
            {isHealthy === true && (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </>
            )}
            {isHealthy === false && (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            )}
            {isHealthy === null && (
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
            )}
          </span>
          <span>
            Status: <strong className="text-slate-800">{backendHealth}</strong>
          </span>
        </div>
      </div>
    </footer>
  );
}
