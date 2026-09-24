export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const AADHAR_REGEX = /^\d{12}$/;
export const MIN_AGE_YEARS = 3;
export const RESEND_COOLDOWN_SECONDS = 99;
export const validateEmail = (email) => EMAIL_REGEX.test(email);
export const validateName = (n) => NAME_REGEX.test(n);
export const validatePhone = (p) =>
  /^\+?[1-9]\d{1,14}$/.test(p.replace(/[\s()+-]/g, ""));
export const validateIfsc = (i) => IFSC_REGEX.test(i);
export const validatePincode = (p) => PINCODE_REGEX.test(p);
export const validateAadhar = (a) => AADHAR_REGEX.test(a.replace(/\s/g, ""));

export const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
];

export const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  dob: "",
  maritalStatus: "",
  aadharNo: "",
  guardianName: "",
  guardianRelation: "",
  street: "",
  village: "",
  city: "",
  state: "",
  pincode: "",
  nomineeName: "",
  nomineeAadhar: "",
  nomineeMobile: "",
  nomineeRelation: "",
  bankName: "",
  holderName: "",
  accountNumber: "",
  ifscCode: "",
};

export const STEPS = [
  {
    key: "email",
    title: "Verify your email",
    subtitle: "We'll send a one-time code to confirm it's you.",
    fields: [],
  },
  {
    key: "personal",
    title: "Personal information",
    subtitle: "This should match your government-issued ID.",
    fields: [
      "name",
      "phone",
      "dob",
      "maritalStatus",
      "aadharNo",
      "guardianName",
      "guardianRelation",
    ],
  },
  {
    key: "security",
    title: "Set a password",
    subtitle: "Choose something you don't use elsewhere.",
    fields: ["password", "confirmPassword"],
  },
  {
    key: "address",
    title: "Address details",
    subtitle: "Your current residential address.",
    fields: ["street", "village", "city", "state", "pincode"],
  },
  {
    key: "nominee",
    title: "Nominee details",
    subtitle: "Who should inherit this account.",
    fields: [
      "nomineeName",
      "nomineeRelation",
      "nomineeAadhar",
      "nomineeMobile",
    ],
  },
  {
    key: "bank",
    title: "Bank details",
    subtitle: "Optional — add now or later from your profile.",
    fields: [],
  },
];
export const calculateAge = (dobString) => {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
};
export const buildValidators = (formData) => ({
  name: (v) => {
    const t = v.trim();
    if (!t) return "Name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  phone: (v) => {
    const t = v.trim();
    if (!t) return "Phone number is required.";
    if (!validatePhone(t)) return "Enter a valid phone number.";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Must be at least 8 characters.";
    if (!PASSWORD_REGEX.test(v))
      return "Add an uppercase, lowercase, number & symbol.";
    return "";
  },
  confirmPassword: (v) => {
    if (!v) return "Confirm your password.";
    if (v !== formData.password) return "Passwords do not match.";
    return "";
  },
  dob: (v) => {
    if (!v) return "Date of birth is required.";
    const dob = new Date(v);
    if (Number.isNaN(dob.getTime())) return "Enter a valid date.";
    if (dob > new Date()) return "Date of birth cannot be in the future.";
    if (calculateAge(v) < MIN_AGE_YEARS)
      return `You must be at least ${MIN_AGE_YEARS} years old.`;
    return "";
  },
  maritalStatus: (v) => (!v ? "Select a marital status." : ""),
  aadharNo: (v) => {
    const t = v.trim();
    if (!t) return "Aadhaar number is required.";
    if (!validateAadhar(t)) return "Enter a valid 12-digit Aadhaar number.";
    return "";
  },
  guardianName: (v) => {
    const t = v.trim();
    if (!t) return "";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  guardianRelation: (v) => {
    if (formData.guardianName.trim() && !v)
      return "Select the guardian's relation.";
    return "";
  },
  street: (v) => (!v.trim() ? "Street address is required." : ""),
  village: (v) => (!v.trim() ? "Village / town is required." : ""),
  city: (v) => (!v.trim() ? "City is required." : ""),
  state: (v) => (!v ? "Select a state." : ""),
  pincode: (v) => {
    const t = v.trim();
    if (!t) return "Pincode is required.";
    if (!validatePincode(t)) return "Enter a valid 6-digit pincode.";
    return "";
  },
  nomineeName: (v) => {
    const t = v.trim();
    if (!t) return "Nominee name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  nomineeAadhar: (v) => {
    const t = v.trim();
    if (!t) return "Nominee Aadhaar number is required.";
    if (!validateAadhar(t)) return "Enter a valid 12-digit Aadhaar number.";
    return "";
  },
  nomineeMobile: (v) => {
    const t = v.trim();
    if (!t) return "Nominee mobile number is required.";
    if (!validatePhone(t)) return "Enter a valid mobile number.";
    return "";
  },
  nomineeRelation: (v) => (!v ? "Select relation with nominee." : ""),
  bankName: (v) => (!v.trim() ? "Select a bank." : ""),
  holderName: (v) => {
    const t = v.trim();
    if (!t) return "Account holder name is required.";
    if (!validateName(t)) return "Letters only, 2-50 characters.";
    return "";
  },
  accountNumber: (v) => (!v.trim() ? "Account number is required." : ""),
  ifscCode: (v) => {
    const t = v.trim().toUpperCase();
    if (!t) return "IFSC code is required.";
    if (!validateIfsc(t)) return "Enter a valid IFSC code (e.g., SBIN0001234).";
    return "";
  },
});
