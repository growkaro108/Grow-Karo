"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { userSignup } from "../../services/grahakService";

export default function AuthSignup({ onSwitch }) {
  // Consolidated all values into a single state object
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    bankName: "",
    holderName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation Rules
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  const validateName = (n) => /^[a-zA-Z\s'-]{2,30}$/.test(n);
  const validatePhone = (p) => /^\+?[1-9]\d{1,14}$/.test(p.replace(/[\s()+-]/g, ""));
  const validateIfsc = (i) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(i); // Standard 11-digit IFSC format

  // Unified input handler
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // // Handle Image Selection and Preview
  // const handleImageChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     if (!file.type.startsWith("image/")) {
  //       return setError("Please upload a valid image file.");
  //     }
  //     // Optional: limit file size (e.g., 2MB)
  //     if (file.size > 2 * 1024 * 1024) {
  //       return setError("Image size must be less than 2MB.");
  //     }
  //     setError("");
  //     setImage(file);
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // 1. Sanitization & Trimming
    const sanitizedFirstName = formData.firstName.trim();
    const sanitizedLastName = formData.lastName.trim();
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedPhone = formData.phone.trim().replace(/[\s()-]/g, ""); // Clean formatting for backend uniformity
    const { password, confirmPassword } = formData;

    // 2. Base Validations
    if (!sanitizedFirstName || !sanitizedLastName || !sanitizedEmail || !sanitizedPhone || !password || !confirmPassword) {
      return setError("Fill all required fields.");
    }
    if (!validateName(sanitizedFirstName)) return setError("Enter a valid first name (2-30 characters, letters only).");
    if (!validateName(sanitizedLastName)) return setError("Enter a valid last name (2-30 characters, letters only).");
    if (!validateEmail(sanitizedEmail)) return setError("Enter a valid email address.");
    if (!validatePhone(sanitizedPhone)) return setError("Enter a valid phone number.");
    if (password.length < 8) return setError("Password must be 8+ characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    // Variables for conditional parameters
    let sanitizedBankName = "";
    let sanitizedHolderName = "";
    let sanitizedAccountNumber = "";
    let sanitizedIfsc = "";

    // 3. Conditional Account Validations
    if (showAccountDetails) {
      sanitizedBankName = formData.bankName.trim();
      sanitizedHolderName = formData.holderName.trim();
      sanitizedAccountNumber = formData.accountNumber.trim();
      sanitizedIfsc = formData.ifscCode.trim().toUpperCase();

      if (!sanitizedBankName || !sanitizedHolderName || !sanitizedAccountNumber || !sanitizedIfsc) {
        return setError("Please complete all bank account details.");
      }
      if (!validateIfsc(sanitizedIfsc)) {
        return setError("Enter a valid 11-digit IFSC code (e.g., SBIN0001234).");
      }
    }

    // 4. Backend Connection (using FormData to support the Image File payload)
    try {
      setLoading(true);
      const payload = {
        name: sanitizedFirstName + " " + sanitizedLastName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        passwordHash: password,
        bankName: sanitizedBankName,
        accountHolderName: sanitizedHolderName,
        accountNumber: sanitizedAccountNumber,
        ifscCode: sanitizedIfsc
      }

      // Append profile picture if selected
      // if (image) {
      //   payload.append("profileImage", image);
      // }

      console.log("before signup", payload);

      const response = await userSignup(payload);
      console.log("Signup response:", response);

      // setMessage(response.message || "Registration successful! Redirecting...");

      // setFormData({
      //   firstName: "", lastName: "", email: "", phone: "",
      //   password: "", confirmPassword: "", bankName: "",
      //   holderName: "", accountNumber: "", ifscCode: ""
      // });
      // setImage(null);
      // setImagePreview("");

      // if (onSwitch) setTimeout(() => onSwitch("login"), 1500);

    } catch (err) {
      setError(err.message || "Network error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-[0_15px_50px_rgba(15,23,42,0.03)]">
      <h2 className="text-xl font-bold text-slate-900 text-center mb-2">Create Your Account</h2>
      <p className="text-xs text-slate-400 text-center mb-6">Start your portfolio management journey.</p>

      {message && <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 text-center">{message}</div>}
      {error && <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600 text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Profile Image Upload & Preview 
        <div className="flex flex-col items-center justify-center pb-2 col-span-1 sm:col-span-2">
          <label className="relative cursor-pointer group">
            <div className="w-20 h-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-slate-300">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="text-slate-400 w-6 h-6 transition-colors group-hover:text-slate-600" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          <span className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Add Profile Picture</span>
        </div>*/}

        {/* First Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">First name</label>
          <input value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} placeholder="John" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Last name</label>
          <input value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} placeholder="Doe" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email</label>
          <input type="email" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} placeholder="name@example.com" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Phone number</label>
          <input type="tel" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} placeholder="+91 987-704-5670" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>

        {/* Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Password</label>
          <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Confirm Password</label>
          <input type={showPassword ? "text" : "password"} value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} placeholder="••••••••" className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300" />
        </div>
        {/* //conditional show password */}
        <div className="flex items-center space-x-2 py-2 col-span-1 sm:col-span-2">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="toggleAccount" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
            Show Password
          </label>
        </div>
        {/* Conditional Setup Checkbox */}
        <div className="flex items-center space-x-2 py-2 col-span-1 sm:col-span-2">
          <input
            type="checkbox"
            id="toggleAccount"
            checked={showAccountDetails}
            onChange={(e) => setShowAccountDetails(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 border-slate-200 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="toggleAccount" className="text-xs text-slate-600 font-medium cursor-pointer select-none">
            Do you want to add account details now?
          </label>
        </div>

        {/* Dynamically Loaded Account Fields */}
        {showAccountDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 col-span-1 sm:col-span-2 transition-all">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="State Bank of India"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => handleInputChange("holderName", e.target.value)}
                placeholder="John Doe"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value.replace(/\D/g, ""))}
                placeholder="1234567890"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 font-mono tracking-wider"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => handleInputChange("ifscCode", e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                className="w-full h-11 px-4 rounded-xl border border-slate-100 bg-slate-50 text-sm focus:outline-none focus:border-slate-300 font-mono tracking-wider"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-semibold transition-colors mt-2 col-span-1 sm:col-span-2 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-500">
        Already have an account? <button onClick={() => onSwitch && onSwitch("login")} className="text-blue-600 font-semibold hover:underline">Sign In</button>
      </div>
    </div>
  );
}
