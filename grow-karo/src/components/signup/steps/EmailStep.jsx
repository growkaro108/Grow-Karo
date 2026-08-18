import { fieldBaseClass, fieldStateClass } from "../formFields";

export default function EmailStep({
  formData,
  emailVerified,
  otp,
  setOtp,
  sendingOtp,
  verifyingOtp,
  otpSent,
  otpMessage,
  otpError,
  resendCooldown,
  handleSendOtp,
  handleVerifyOtp,
  handleInputChange,
}) {
  const sendOtpLabel = sendingOtp
    ? "Sending..."
    : resendCooldown > 0
      ? `Resend in ${resendCooldown}s`
      : otpSent
        ? "Resend OTP"
        : "Send OTP";

  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">
          Email <span className="text-rose-400">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={formData.email}
            disabled={emailVerified}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="name@growwkaro.com"
            autoFocus
            className={`${fieldBaseClass} flex-1 ${fieldStateClass(false)} disabled:text-emerald-600 disabled:bg-emerald-50 disabled:border-emerald-100`}
          />
          {!emailVerified && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || resendCooldown > 0}
              className="h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap disabled:bg-slate-400 flex-shrink-0"
            >
              {sendOtpLabel}
            </button>
          )}
          {emailVerified && (
            <span className="h-11 px-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold flex items-center whitespace-nowrap flex-shrink-0">
              ✓ Verified
            </span>
          )}
        </div>

        {otpSent && !emailVerified && (
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP"
              maxLength={6}
              className={`${fieldBaseClass} flex-1 ${fieldStateClass(false)} tracking-widest`}
            />
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap disabled:bg-slate-400 flex-shrink-0"
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}

        {otpMessage && (
          <p className="text-[11px] text-emerald-600 mt-1">{otpMessage}</p>
        )}
        {otpError && (
          <p className="text-[11px] text-rose-600 mt-1">{otpError}</p>
        )}
      </div>
    </div>
  );
}
