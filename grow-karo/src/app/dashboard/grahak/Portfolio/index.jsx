"use client";

import { use, useCallback, useMemo, useState } from "react";
import { withdrawUserScheme } from "../../../../../services/grahakService";
import { allRounderMessage } from "@/components/Message";
import { userContext } from "@/context/UserContext";
import ImageLightbox from "./ImageLightbox";
import BondDetails from "./BondDetails";
import PortfolioTable from "./PortfolioTable";

export default function Portfolio({ refresh, loading }) {
  const [selectedBond, setSelectedBond] = useState(null);
  const [lightboxBond, setLightboxBond] = useState(null);
  const { authUser, portfolio } = use(userContext);
  const sortedHoldings = useMemo(() => [...(portfolio?.holdings || [])].sort((a, b) => Number.parseFloat(b.investmentAmount || 0) - Number.parseFloat(a.investmentAmount || 0)), [portfolio?.holdings]);
  const handleWithdraw = useCallback(async (userSchemeId) => {
    try {
      const response = await withdrawUserScheme(userSchemeId, authUser?.id);
      allRounderMessage(response);
      if (response.status === "success") { await refresh(); setSelectedBond(null); }
    } catch (error) { console.error("Failed to withdraw application:", error); }
  }, [authUser, refresh]);

  return <div className="flex flex-col gap-6 p-1 sm:p-6 bg-slate-50 min-h-screen font-sans">{selectedBond ? <BondDetails bond={selectedBond} onBack={() => setSelectedBond(null)} onExpandImage={() => setLightboxBond(selectedBond)} onWithdraw={handleWithdraw} /> : <PortfolioTable holdings={sortedHoldings} loading={loading} onOpenDetails={setSelectedBond} onOpenLightbox={setLightboxBond} />}{lightboxBond?.schemeName && <ImageLightbox bond={lightboxBond} onClose={() => setLightboxBond(null)} />}</div>;
}
