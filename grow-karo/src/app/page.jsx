'use client';
// import HeroSection from "@/components/HeroSection";
// import TrustSection from "@/components/TrustSection";
// import AssetAllocation from "@/components/AssetAllocation";
// import SimplifiedInvesting from "@/components/SimplifiedInvesting";
// import FooterSection from "@/components/FooterSection";
import Loader from "@/loader/Loader";
import dynamic from "next/dynamic";
const HeroSection = dynamic(() => import("@/components/HeroSection"), {
  loading: () => <Loader />,
  ssr: false,
});
const TrustSection = dynamic(() => import("@/components/TrustSection"), {
  loading: () => <Loader />,
  ssr: false,
});
const AssetAllocation = dynamic(() => import("@/components/AssetAllocation"), {
  loading: () => <Loader />,
  ssr: false,
});
const SimplifiedInvesting = dynamic(
  () => import("@/components/SimplifiedInvesting"),
  {
    loading: () => <Loader />,
    ssr: false,
  },
);
const FooterSection = dynamic(() => import("@/components/FooterSection"), {
  loading: () => <Loader />,
  ssr: false,
});
export default function Home() {
  if (!HeroSection || !TrustSection || !AssetAllocation || !SimplifiedInvesting || !FooterSection) {
    return <Loader />;
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <HeroSection />
        <TrustSection />
        <AssetAllocation />
        <SimplifiedInvesting />
        <FooterSection />
      </div>
    </div>
  );
}

