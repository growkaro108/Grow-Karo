"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Coins,
  HandCoins,
  ImageOff,
  Loader2,
  Trash2,
} from "lucide-react";
import { resolveMediaUrl } from "@/api/apiClient";
import { confirmMessage, errorMessage } from "@/components/Message";
import { StatusBadge } from "../../malik/components/StatusBadge";
import DetailField from "./DetailField";
import { currency, formatDate } from "./portfolioUtils";
import { isReInvestEligible } from "@/app/utils/constant";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";
import { onReInvest } from "../../../../../services/grahakService";
import { userContext } from "@/context/UserContext";
const EnrollConfirmModal = dynamic(() => import("@/app/plan/components/EnrollConfirmModal"), {
  loading: () => <TabLoader message={"Loading Reinvest Form..."} />,
  ssr: false
})

export default function BondDetails({
  bond,
  onBack,
  onExpandImage,
  onWithdraw,
}) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isShowReInvestForm, setIsShowReInvestForm] = useState(false);
  const [isReInvesting, setIsReInvesting] = useState(false);
  const { authUser, schemes, getAllSchemes, updateUserPortfolio } = use(userContext);
  const isApproved = bond.isApproved;
  const handleWithdraw = async () => {
    if (!(await confirmMessage("you want to withdraw this application?")))
      return;
    setIsWithdrawing(true);
    await onWithdraw(bond.userSchemeId);
    setIsWithdrawing(false);
  };
  const userId = authUser?.id;
  const handleReInvest = async (amount, nomineeId, schemeId) => {
    if (!(await confirmMessage("you want to reinvest this application?"))) return;
    setIsReInvesting(true);
    try {

      if (userId == "" || userId == undefined || userId == null) {
        errorMessage("User not found")
        return;
      }
      console.log(userId, schemeId, amount, nomineeId, bond.userSchemeId);
      if (bond.minimumAmount && amount < bond.minimumAmount) {
        errorMessage(`Amount must be greater than or equal to ${currency(bond.minInvestment)}`)
        return;
      }
      if (bond.maximumAmount && amount > bond.maximumAmount) {
        errorMessage(`Amount must be less than or equal to ${currency(bond.maxInvestment)}`)
        return;
      }
      console.log("Reinvesting... with ", schemeId, amount, nomineeId, bond?.userSchemeId);
      const res = await onReInvest(userId, schemeId, amount, nomineeId, bond?.userSchemeId);
      if (res) {
        console.log("Reinvest Successfully...")
        setIsShowReInvestForm(false);
        if (res) {
          updateUserPortfolio(res);
          onBack();
        }
      }
    } catch (error) {
      console.log("Error...", error)
    } finally {
      setTimeout(() => {
        setIsReInvesting(false);
      }, 1500);
    }

  };
  useEffect(() => {
    if (schemes?.length === 0) {
      getAllSchemes();
    }
  }, [getAllSchemes, schemes?.length]);


  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-blue-50/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to holdings
        </button>
        {bond.reinvestedIntoUserSchemeId != null ? <StatusBadge status={"Reinvested"} /> : <StatusBadge status={(bond.status || "pending").toLowerCase()} />}
      </div>
      <div className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <button
            type="button"
            onClick={onExpandImage}
            className="group relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center self-center sm:self-start"
          >
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-950/40 opacity-0 group-hover:opacity-100">
              <ArrowUpRight size={20} className="text-white" />
            </div>
            {resolveMediaUrl(bond.bondImageURL) ? (
              <Image
                src={resolveMediaUrl(bond.bondImageURL)}
                alt={bond.bondNumber || "Bond proof"}
                fill unoptimized sizes="112px"
                className="object-contain"
              />
            ) : (
              <ImageOff size={24} className="text-slate-400" />
            )}
          </button>
          <div className="flex-1 text-center sm:text-left">
            <h3
              className={`text-xl tracking-tight text-slate-900 ${bond.bondNumber ? "font-bold" : "text-red-600 font-light"}`}
            >
              {isApproved && (bond.bondNumber || "Bond Not Generated Yet")}
            </h3>
            <div className="flex flex-col sm:flex-row md:justify-between justify-center mt-1">
              <p className="text-sm font-medium text-slate-400">
                {bond.schemeName}
              </p>
              {isApproved && bond.reinvestedIntoUserSchemeId == null && (
                <span className="text-xs font-semibold text-emerald-600 border border-emerald-500 bg-emerald-50 rounded-xl px-2 py-1">
                  Next profit on {formatDate(bond.nextPayoutDate)}
                </span>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailField
                label={isApproved ? "Submit Amount" : "Amount Applied"}
                value={currency(bond.paidAmount)}
              />
              <DetailField label="Tenure" value={`${bond.tenure} Days`} />
              <DetailField
                label="Yield %"
                value={
                  bond.profitPercentage != null
                    ? `${bond.profitPercentage}%`
                    : "-"
                }
                highlight
              />
              <DetailField
                label="Profit"
                value={currency(bond.profit)}
                highlight
              />
              {isApproved && (
                <DetailField
                  label="Enrollment Date"
                  value={formatDate(bond.enrollmentDate)}
                />
              )}
              {!isApproved && !bond.paymentDates ? (
                <DetailField
                  label="Request Date"
                  value={formatDate(bond.requestDate)}
                />
              ) : (
                <>
                  <DetailField
                    label="Payment Dates"
                    value={formatDate(bond.paidDate)}
                  />
                  {bond?.reinvestedIntoUserSchemeId !== null ? <DetailField
                    label="Re-Inevst Into"
                    value={bond?.reinvestedIntoUserSchemeId}
                  /> : <DetailField
                    label="Maturity Date"
                    value={formatDate(bond.maturityDate)}
                  />}
                </>
              )}
              <DetailField label="Cycle" value={bond.payoutFrequency} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailField label="Nominee Name" value={bond.nominee?.name} />
              <DetailField
                label="Nominee Relation"
                value={bond.nominee?.relation}
              />
              <DetailField
                label="Nominee Aadhar No"
                value={bond.nominee?.aadharNo}
              />
              <DetailField
                label="Nominee Mobile No"
                value={"+91 " + (bond.nominee?.mobileNo || "-")}
              />
            </div>
          </div>
        </div>
        {!isApproved && (
          <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-400">
              Request on: {formatDate(bond.requestDate)}
            </p>
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
            >
              {isWithdrawing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              {isWithdrawing ? "Withdrawing..." : "Withdraw Request"}
            </button>
          </div>
        )}
        {/* reinvest button */}
        {(isReInvestEligible(bond) && bond.status.toLowerCase() === 'matured' && bond.reinvestedIntoUserSchemeId === null) && (
          <div className="mt-8 flex justify-between items-center border-t border-slate-100 pt-6">
            <p className="text-sm font-medium text-slate-400">
              Mature on: {formatDate(bond.maturityDate)}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsShowReInvestForm(true)}
                disabled={isReInvesting}
                className="flex items-center gap-2 rounded-lg border border-emerald-400 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600 disabled:opacity-50 cursor-pointer transition-all duration-300 hover:bg-emerald-600 hover:text-white hover:scale-105"
              >
                {isReInvesting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <HandCoins size={16} />
                )}
                {isReInvesting ? "Reinvesting..." : "Reinvest"}
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg border border-red-400 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-50 cursor-pointer transition-all duration-300 hover:bg-red-600 hover:text-white hover:scale-105"
              >
                {false ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Coins size={16} />
                )}
                {"Reedem"}
              </button>
            </div>
          </div>
        )}




      </div>
      {/* show enrollment form  */}
      {isShowReInvestForm && <EnrollConfirmModal
        AllSchemes={schemes}
        plan={bond}
        enrolling={isReInvesting}
        onConfirm={handleReInvest}
        onCancel={() => setIsShowReInvestForm(false)}
        preAmount={bond.paidAmount + bond.profit - bond.profitReedemed}
        isReInvest={true}
      />}

    </div>
  );
}
