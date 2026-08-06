import React, { use, useState } from "react";
import { currency } from "../malik/utils";
import { allRounderMessage, infoMessage } from "@/components/Message";
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import BankSelect from "@/components/BankSelect";
import {
  withdrawProfit,
  withdrawProgressScheme,
} from "../../../../services/grahakService";
import { userContext } from "@/context/UserContext";
const AggresiveTop = dynamic(() => import("./AgressiveTop"), {
  loading: () => (
    <div className="flex justify-center items-center h-24 p-2">
      <Loader2 className="animate-spin" size={12} />
      <span className="ml-2">Loading...</span>
    </div>
  ),
  ssr: false,
});

export const FormFields = ({
  label,
  name,
  value,
  placeholder,
  handleInputChange,
  useProfileAccount,
  type,
}) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#5B5648] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type || "text"}
        required
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={handleInputChange}
        disabled={useProfileAccount}
        className={`w-full px-3 py-2.5 text-sm border border-[#E4DFD3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B4893E]/25 focus:border-[#B4893E] transition-all uppercase tracking-wider ${
          useProfileAccount
            ? "bg-[#FAF7F0] text-[#8C8672] cursor-not-allowed"
            : "text-[#0B1B2E]"
        }`}
      />
    </div>
  );
};

export default function WithdrawFormComponent({
  onCancel,
  userData,
  withdrawType,
}) {
  const isAggressive = withdrawType === "aggressive";
  const { fetchHoldings } = use(userContext);
  const [payload, setPayload] = useState({
    userId: userData?.id,
    schemeId: "",
    amount: 0,
    bankDetailsId: userData?.bankDetailsId,
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: "",
    },
    isAggressive: isAggressive,
  });
  const [useProfileAccount, setUseProfileAccount] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedAmount, setSubmittedAmount] = useState(0);
  const [error, setError] = useState("");

  const CURRENT_BALANCE = userData?.totalProfit;
  const MIN_WITHDRAWAL_AMOUNT = 1000.0;
  const MAX_WITHDRAWAL_AMOUNT = 100000.0;

  const handleCheckboxChange = (e) => {
    // console.log(userData);
    const checked = e.target.checked;
    if (
      userData.accountNumber == null ||
      userData.ifscCode == null ||
      userData?.accountNumber == "" ||
      userData?.ifscCode == ""
    ) {
      setError("Data not available. Please update your bank details.");
      infoMessage("Please fill in all bank details.");
      return;
    }
    setUseProfileAccount(checked);

    if (checked) {
      //update payload
      setPayload({
        ...payload,
        bankDetails: {
          accountNumber: userData.accountNumber,
          ifscCode: userData.ifscCode,
          accountHolderName: userData.accountHolderName,
          bankName: userData.bankName,
          bankDetailsId: userData.bankDetailsId,
        },
      });
    } else {
      //clear payload
      setPayload({
        ...payload,
        bankDetails: {
          accountNumber: "",
          ifscCode: "",
          accountHolderName: "",
          bankName: "",
        },
      });
    }
  };

  //handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isAggressive && !selectedScheme) {
      setError("Please select a withdrawal scheme to continue.");
      return;
    }

    const numericAmount = selectedScheme.amount;

    if (!isAggressive && (Number.isNaN(numericAmount) || numericAmount <= 0)) {
      setError("Please enter a valid withdrawal amount." + numericAmount);
      return;
    }
    if (
      !isAggressive &&
      (numericAmount < MIN_WITHDRAWAL_AMOUNT ||
        numericAmount > MAX_WITHDRAWAL_AMOUNT)
    ) {
      setError(
        `Please enter an amount between ${currency(MIN_WITHDRAWAL_AMOUNT)} and ${currency(MAX_WITHDRAWAL_AMOUNT)}.`,
      );
      return;
    }
    if (!isAggressive && numericAmount > CURRENT_BALANCE) {
      setError(
        `Insufficient balance. You can withdraw up to ${currency(CURRENT_BALANCE)}.`,
      );
      return;
    }
    if (!payload.bankDetails.accountNumber || !payload.bankDetails.ifscCode) {
      setError("Please fill in all bank details.");
      return;
    }

    // setSubmittedAmount(numericAmount);
    setIsSubmitting(true);
    // console.log(payload);
    // setTimeout(() => {

    // }, 1200);
    const data = {
      userId: payload.userId,
      schemeId: selectedScheme.schemeId,
      userSchemeId: selectedScheme.userSchemeId,
      amount: selectedScheme.amount,
      bankDetailsId: payload.bankDetails.bankDetailsId,
      isAggressive: payload.isAggressive,
      profit: selectedScheme.amount,
      bankDetails: payload.bankDetails.bankDetailsId
        ? null
        : payload.bankDetails,
    };

    // console.log(data);
    let res;
    try {
      if (isAggressive) {
        res = await withdrawProgressScheme(data);
      } else {
        res = await withdrawProfit(data);
      }
      if (res.status === "success") {
        setIsSuccess(true);
        fetchHoldings();
        setTimeout(() => {
          setIsSubmitting(false);
        }, 3000);
        onCancel();
      } else {
        setError(res?.message);
        setIsSubmitting(false);
      }
    } catch (error) {
      setError(error);
      setIsSubmitting(false);
    } finally {
      allRounderMessage(res);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, dataset } = e.target;

    setPayload((prevPayload) => {
      if (dataset.nested === "bankDetails") {
        return {
          ...prevPayload,
          bankDetails: {
            ...prevPayload.bankDetails,
            [name]: value,
          },
        };
      }

      // Top-level inputs (amount, schemeId, etc.)
      return {
        ...prevPayload,
        [name]: value,
      };
    });
  };

  const fontImport = (
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');`}</style>
  );

  if (isSuccess) {
    const netPayout = isAggressive
      ? selectedScheme.amount - selectedScheme.penalty
      : submittedAmount;

    return (
      <div
        className=" max-w-md mx-auto my-8 rounded-xl border border-[#E4DFD3] bg-slate-100 shadow-sm overflow-hidden -mt-3"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* for extra font add <style> tag  */}
        {fontImport}
        <div className="h-1 bg-linear-to-r from-[#B4893E] to-[#D9BC7E]" />
        <div className="p-8 text-center">
          <div className="w-14 h-14 bg-[#0B1B2E] text-[#D9BC7E] rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={26} strokeWidth={2} />
          </div>
          <h3 className="text-xl font-semibold text-[#0B1B2E]">
            Withdrawal Requested
          </h3>
          <p className="text-sm text-[#5B5648] mt-2">
            Your request has been submitted for processing.
          </p>

          <div className="mt-6 rounded-lg  divide-y divide-[#EFEBE0] text-left">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-[#5B5648]">Withdrawal amount</span>
              <span
                className="font-semibold text-[#0B1B2E] tabular-nums text-base"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                {currency(submittedAmount)}
              </span>
            </div>
            {isAggressive && (
              <>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-[#5B5648]">Scheme</span>
                  <span className="font-medium text-[#0B1B2E]">
                    {selectedScheme.name}
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 text-sm">
                  <span className="text-[#5B5648]">Net payout</span>
                  <span className="font-semibold text-[#1F6F54] tabular-nums">
                    {currency(netPayout)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 p-3 bg-[#FAF3E3] border border-[#EDDDB3] rounded-lg text-xs font-medium text-[#7A5B1E] flex items-start gap-2 text-left">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>
              Funds will credit to your account
              {withdrawType === "general"
                ? " within 24–48 hours"
                : " after admin approval"}
              .
            </span>
          </div>

          <button
            onClick={onCancel}
            className="mt-6 w-full py-2.5 bg-[#0B1B2E] hover:bg-[#16283F] text-white font-medium text-sm rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="max-w-md mx-auto my-8 rounded-xl border border-[#E4DFD3] bg-white shadow-sm relative overflow-hidden -mt-3"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {fontImport}
      <div className="h-1 bg-linear-to-r from-[#B4893E] to-[#D9BC7E]" />

      {isSubmitting && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <div className="w-9 h-9 border-4 border-[#B4893E] border-t-transparent rounded-full animate-spin motion-reduce:animate-none" />
          <span className="text-xs font-semibold text-[#0B1B2E] tracking-wide">
            Processing request…
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#0B1B2E]">
              {withdrawType === "general"
                ? "Withdraw Funds"
                : "Aggressive Withdrawal"}
            </h2>
            <p className={`text-xs ${"text-[#8C8672]"} mt-0.  5`}>
              {withdrawType === "general"
                ? "Transfer funds securely to your bank account."
                : "Aggressive withdrawal add penality if you withdraw funds before the maturity of the scheme."}
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-[#8C8672] hover:text-[#0B1B2E] p-1.5 rounded-md hover:bg-[#FAF7F0] transition-all duration-200 hover:rotate-90"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5">
          <AggresiveTop
            // holdings={holdings}
            value={selectedScheme?.id || null}
            onChange={setSelectedScheme}
            isAggressive={isAggressive}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FBF3F2] text-[#8C3B34] border border-[#EAD9D6] rounded-lg text-xs font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </span>
            <button
              type="button"
              className="text-[#8C3B34] hover:text-[#6E2B26] p-0.5 rounded"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* {!isAggressive && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#5B5648] uppercase tracking-wider mb-1.5">
                Amount to Withdraw (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                name="amount"
                value={payload.amount}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 text-sm border border-[#E4DFD3] rounded-lg text-[#0B1B2E] placeholder-[#B7B1A0] focus:outline-none focus:ring-2 focus:ring-[#B4893E]/25 focus:border-[#B4893E] transition-all font-medium tabular-nums"
              />
            </div>
          )} */}

          <FormFields
            label="Bank Account Number"
            name="accountNumber"
            value={payload.bankDetails.accountNumber}
            placeholder="e.g. 58XXX10XXX8907"
            handleInputChange={handleInputChange}
            useProfileAccount={useProfileAccount}
            type="text"
          />

          <FormFields
            label="IFSC / Bank Routing Code"
            name="ifscCode"
            value={payload.bankDetails.ifscCode}
            placeholder="e.g. SBIN0001234"
            handleInputChange={handleInputChange}
            useProfileAccount={useProfileAccount}
            type="text"
          />
          <BankSelect
            value={payload.bankDetails.bankName}
            onChange={handleInputChange}
            disabled={useProfileAccount}
          />
          <FormFields
            label="Account Holder Name"
            name="accountHolderName"
            value={payload.bankDetails.accountHolderName}
            placeholder="e.g. Rahul Kumar"
            handleInputChange={handleInputChange}
            useProfileAccount={useProfileAccount}
          />

          <div className="sm:col-span-2 border-t border-[#EFEBE0] pt-3">
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={useProfileAccount}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-[#D8D2C2] accent-[#B4893E] focus:ring-[#B4893E]/25"
              />
              <span className="text-xs font-medium text-[#5B5648] group-hover:text-[#0B1B2E] transition-colors">
                Use registered bank details
              </span>
            </label>
          </div>

          <div className="sm:col-span-2 flex items-start gap-2 text-[11px] text-[#8C8672] px-0.5">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#B4893E]" />
            <span>
              Your bank details are encrypted and used only for this transfer.
            </span>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-[#0B1B2E] hover:bg-[#16283F] text-white font-medium text-sm rounded-lg transition-colors shadow-sm shadow-[#0B1B2E]/10"
            >
              Confirm &amp; Withdraw
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
