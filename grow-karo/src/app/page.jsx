import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TrustSection from "@/components/TrustSection";
import AssetAllocation from "@/components/AssetAllocation";
import SimplifiedInvesting from "@/components/SimplifiedInvesting";
import FooterSection from "@/components/FooterSection";
// import Loader from "@/components/Loader";

export default function Home() {
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

