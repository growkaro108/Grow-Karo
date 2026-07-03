import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="rounded-3xl sm:rounded-4xl bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      {/* Top Row: Links and Social Icons */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-500">
          <Link href="#about" className="transition hover:text-slate-900">About</Link>
          <Link href="#terms" className="transition hover:text-slate-900">Terms</Link>
          <Link href="#privacy" className="transition hover:text-slate-900">Privacy</Link>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-3">
          {[
            {
              href: "#",
              icon: (
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              ),
            },
            {
              href: "#",
              icon: (
                <svg className="h-4.5 w-4.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              ),
            },
            {
              href: "#",
              icon: (
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              ),
            },
            {
              href: "#",
              icon: (
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              ),
            },
          ].map((social, idx) => (
            <Link
              key={idx}
              href={social.href}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-100 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition duration-300"
            >
              {social.icon}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Row: Platform label and Copyright */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <p>Secure Investment Platform</p>
        <p className="normal-case tracking-normal text-slate-400 font-semibold">© Copyright Grow-Karo.</p>
      </div>
    </footer>
  );
}
