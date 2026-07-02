export default function SimplifiedInvesting() {
  const items = [
    {
      title: "Connect Accounts",
      description: "Connect your bank accounts into your accounts.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )
    },
    {
      title: "Set Goals",
      description: "Set goals your investment and how to setup set goals.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )
    },
    {
      title: "Optimize & Grow",
      description: "Optimize and investment and optimize more & grow.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    }
  ];

  return (
    <section id="features" className="rounded-3xl sm:rounded-4xl bg-white p-6 sm:p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Simplified Investing</h2>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex flex-col items-center text-center p-4 group">
            {/* Centered Circle Icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 border border-blue-100/50 mb-4 transition duration-300 group-hover:scale-110 group-hover:bg-blue-100/70">
              {item.icon}
            </div>
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
