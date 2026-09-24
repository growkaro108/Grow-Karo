"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  X,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { addBulkUsers } from "../../../../../../services/malikService";
import { successMessage, errorMessage } from "@/components/Message";

// Standard sample template content (with valid 11-char IFSC code)
const SAMPLE_CSV_CONTENT = `aadharNo,accountHolderName,accountNumber,address.city,address.pincode,address.state,address.street,address.village,bankName,dob,email,guardian.name,guardian.relation,ifscCode,maritalStatus,name,nominee.aadharNo,nominee.mobileNo,nominee.name,nominee.relation,passwordHash,phone
321231234123,Premlata Devi,809990119998510,Bhagalpur,813113,Bihar,Amanda home,jkilof,Bank of Baroda,04-09-1997,hetal92208@omanarts.com,Hasrajan sah,Father,BARB0AMANDA,Single,Ankit Kumar,763274623266,7654321985,Anandi,Mother,Anand@123,9876543214
451298761234,Sunita Devi,209990223341567,Patna,800001,Bihar,Ashok Nagar Road,rampur,State Bank of India,03-11-1998,ravi.kumar99@fakemail.com,Ramesh Prasad,Father,SBIN0001234,Married,Ravi Kumar,876234512398,9123456780,Sunita Devi,Wife,Ravi@4567,9123456781
562341987651,Meena Kumari,109887654321234,Gaya,823001,Bihar,Station Road,belgachi,Punjab National Bank,19-02-1995,priya.singh21@fakemail.com,Meena Kumari,Mother,PUNB0123456,Single,Priya Singh,239487561234,9988776654,Meena Kumari,Mother,Priya@789,9988776655
673452198760,Rajesh Yadav,309112233445566,Muzaffarpur,842001,Bihar,Gandhi Chowk,dumra,HDFC Bank,25-07-1989,amit.yadav88@fakemail.com,Rajesh Yadav,Father,HDFC0004567,Married,Amit Yadav,398765412309,9876123450,Kavita Yadav,Wife,Amit@2024,9876123451
784563219870,Geeta Sharma,409223344556677,Darbhanga,846001,Bihar,Nehru Path,laheriasarai,Canara Bank,12-04-2000,neha.sharma00@fakemail.com,Geeta Sharma,Mother,CNRB0007890,Single,Neha Sharma,451234987612,9012345678,Geeta Sharma,Mother,Neha@1122,9012345679`;

export default function AddBulkUserModal({ isOpen, onClose, onUsersAdded }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState([]);
  const [validations, setValidations] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // RFC-4180 compliant CSV line parser
  const parseCsvLine = (line) => {
    const values = [];
    let sb = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          sb += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        values.push(sb.trim());
        sb = "";
      } else {
        sb += c;
      }
    }
    values.push(sb.trim());
    return values;
  };

  const parseCsvText = (text) => {
    const rawLines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return [];

    let headerLine = rawLines[0];
    if (headerLine.charCodeAt(0) === 0xfeff) {
      headerLine = headerLine.substring(1);
    }
    const headers = parseCsvLine(headerLine).map((h) => h.trim());

    const rows = [];
    for (let i = 1; i < rawLines.length; i++) {
      const cols = parseCsvLine(rawLines[i]);
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = idx < cols.length ? cols[idx].trim() : "";
      });
      rows.push(obj);
    }
    return rows;
  };

  // Client-side row validation
  const validateRow = (row, index) => {
    const errors = [];
    const warnings = [];

    const name = row.name || row["user.name"] || "";
    const email = row.email || row["user.email"] || "";
    const phone = row.phone || row["user.phone"] || "";
    const password = row.passwordHash || row.password || "";
    const aadharNo = row.aadharNo || "";
    const dob = row.dob || "";
    const bankName = row.bankName || "";
    const ifscCode = (row.ifscCode || "").toUpperCase();
    const accountNumber = row.accountNumber || "";
    const accountHolderName = row.accountHolderName || "";

    // 1. Mandatory core fields
    if (!name) errors.push("Missing full name");
    if (!email) {
      errors.push("Missing email");
    } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      errors.push("Invalid email format");
    }

    if (!phone) {
      errors.push("Missing phone number");
    } else if (!/^\d{10}$/.test(phone)) {
      errors.push(`Phone must be 10 digits (got: ${phone})`);
    }

    if (!password) {
      errors.push("Missing password");
    } else {
      const pwdRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])(?=\S+$).{8,64}$/;
      if (!pwdRegex.test(password)) {
        errors.push("Password must be 8-64 chars with uppercase, lowercase, digit, and special char");
      }
    }

    // 2. Aadhaar
    if (aadharNo && !/^\d{12}$/.test(aadharNo)) {
      errors.push(`Aadhaar must be 12 digits (got: ${aadharNo})`);
    }

    // 3. DOB check
    if (dob) {
      const isIso = /^\d{4}-\d{2}-\d{2}$/.test(dob);
      const isIndian = /^\d{2}-\d{2}-\d{4}$/.test(dob) || /^\d{2}\/\d{2}\/\d{4}$/.test(dob);
      if (!isIso && !isIndian) {
        errors.push(`Invalid DOB format: ${dob} (use YYYY-MM-DD or DD-MM-YYYY)`);
      }
    }

    // 4. Bank details
    const hasAnyBank = bankName || ifscCode || accountNumber || accountHolderName;
    if (hasAnyBank) {
      if (!bankName) errors.push("Bank name is required with bank details");
      if (!accountHolderName) errors.push("Account holder name is required");
      if (!accountNumber || !/^\d{9,18}$/.test(accountNumber)) {
        errors.push(`Account number must be 9-18 digits (got: ${accountNumber || "empty"})`);
      }
      if (!ifscCode) {
        errors.push("IFSC code is required with bank details");
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        errors.push(
          `Invalid IFSC: '${ifscCode}' (${ifscCode.length} chars). Must be 11 chars (e.g., SBIN0001234)`
        );
      }
    }

    return {
      index: index + 1,
      row,
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      errorMessage("Please upload a valid .csv file.");
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setResultSummary(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const rows = parseCsvText(text);
        if (rows.length === 0) {
          errorMessage("The selected CSV file has no records.");
          setParsedRows([]);
          setValidations([]);
          return;
        }
        const vResults = rows.map((r, i) => validateRow(r, i));
        setParsedRows(rows);
        setValidations(vResults);
      } catch (err) {
        console.error("Error parsing CSV:", err);
        errorMessage("Failed to read CSV: " + err.message);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "growkaro_bulk_users_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      errorMessage("Please select and parse a CSV file first.");
      return;
    }

    const invalidCount = validations.filter((v) => !v.isValid).length;
    if (invalidCount > 0) {
      const proceed = window.confirm(
        `There are ${invalidCount} rows with formatting or validation errors. Valid rows will be saved, but invalid rows will be skipped. Do you want to proceed?`
      );
      if (!proceed) return;
    }

    setIsProcessing(true);
    try {
      // Build structured payload
      const payload = parsedRows.map((r) => {
        return {
          name: r.name || r["user.name"] || "",
          email: r.email || r["user.email"] || "",
          phone: r.phone || r["user.phone"] || "",
          passwordHash: r.passwordHash || r.password || "",
          dob: r.dob || null,
          maritalStatus: r.maritalStatus || "Single",
          aadharNo: r.aadharNo || "",
          guardian: {
            name: r["guardian.name"] || r.guardianName || "",
            relation: r["guardian.relation"] || r.guardianRelation || "",
          },
          address: {
            street: r["address.street"] || r.street || "",
            village: r["address.village"] || r.village || "",
            city: r["address.city"] || r.city || "",
            state: r["address.state"] || r.state || "",
            pincode: r["address.pincode"] || r.pincode || "",
          },
          nominee: {
            name: r["nominee.name"] || r.nomineeName || "",
            aadharNo: r["nominee.aadharNo"] || r.nomineeAadharNo || "",
            mobileNo: r["nominee.mobileNo"] || r.nomineeMobileNo || "",
            relation: r["nominee.relation"] || r.nomineeRelation || "",
          },
          bankName: r.bankName || "",
          accountHolderName: r.accountHolderName || "",
          accountNumber: r.accountNumber || "",
          ifscCode: (r.ifscCode || "").toUpperCase(),
        };
      });

      const res = await addBulkUsers(payload);
      if (res) {
        setResultSummary(res);
        if (res.successCount > 0) {
          successMessage(`Successfully added ${res.successCount} users!`);
          if (onUsersAdded) {
            await onUsersAdded();
          }
        }
      }
    } catch (err) {
      console.error("Bulk upload error:", err);
      errorMessage(err.message || "Failed to upload bulk users");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalCount = validations.length;
  const validCount = validations.filter((v) => v.isValid).length;
  const invalidCount = totalCount - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-800 bg-[#111827] shadow-2xl shadow-black/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-[Space_Grotesk] text-lg font-semibold text-slate-100">
                Bulk Add Users via CSV
              </h3>
              <p className="text-xs text-slate-400">
                Upload CSV file containing user details, bank info, address, and nominees
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Action bar: Sample download & instructions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-slate-200">CSV Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400">
                <li>
                  <strong className="text-slate-300">Required:</strong> name, email, phone (10 digits), passwordHash (8-64 chars with Aa1@)
                </li>
                <li>
                  <strong className="text-slate-300">Bank Details (Optional):</strong> If provided, IFSC must be strictly 11 characters (e.g. SBIN0001234), and Account Number 9-18 digits.
                </li>
                <li>
                  <strong className="text-slate-300">DOB:</strong> Supports both <code className="text-teal-400">DD-MM-YYYY</code> and <code className="text-teal-400">YYYY-MM-DD</code>.
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-500/40 bg-teal-950/40 px-3 py-2 text-xs font-medium text-teal-300 transition hover:bg-teal-900/50 hover:text-teal-200"
            >
              <Download className="h-3.5 w-3.5" />
              Download Sample CSV
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
              dragActive
                ? "border-teal-400 bg-teal-950/20"
                : file
                ? "border-teal-500/50 bg-slate-900/40"
                : "border-slate-700/80 bg-slate-900/20 hover:border-slate-600 hover:bg-slate-900/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <Upload className="h-6 w-6" />
              </div>
              {fileName ? (
                <div>
                  <p className="text-sm font-medium text-teal-300">{fileName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Click or drag another file to replace</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Click to select CSV file, or drag and drop here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Accepts standard .csv files</p>
                </div>
              )}
            </div>
          </div>

          {/* Validation stats & Warnings */}
          {validations.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                  <p className="text-xs text-slate-400">Total Rows</p>
                  <p className="text-xl font-semibold text-slate-100">{totalCount}</p>
                </div>
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3">
                  <p className="text-xs text-emerald-400">Valid Rows</p>
                  <p className="text-xl font-semibold text-emerald-300">{validCount}</p>
                </div>
                <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3">
                  <p className="text-xs text-rose-400">Rows with Issues</p>
                  <p className="text-xl font-semibold text-rose-300">{invalidCount}</p>
                </div>
              </div>

              {invalidCount > 0 && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-xs text-amber-200">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-amber-300">
                      {invalidCount} row{invalidCount > 1 ? "s have" : " has"} validation errors:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-amber-200/90 max-h-28 overflow-y-auto">
                      {validations
                        .filter((v) => !v.isValid)
                        .map((v) => (
                          <li key={v.index}>
                            Row {v.index} ({v.row.name || v.row.email || "Unknown"}):{" "}
                            {v.errors.join("; ")}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result summary banner */}
          {resultSummary && (
            <div
              className={`rounded-xl border p-4 ${
                resultSummary.failureCount === 0
                  ? "border-emerald-800/60 bg-emerald-950/30 text-emerald-200"
                  : "border-slate-800 bg-slate-900 text-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <p className="font-semibold text-slate-100">
                    Processed {resultSummary.total} row(s): {resultSummary.successCount} saved,{" "}
                    {resultSummary.failureCount} failed.
                  </p>
                </div>
              </div>
              {resultSummary.errors?.length > 0 && (
                <div className="mt-3 border-t border-slate-800 pt-2 text-xs">
                  <p className="font-medium text-rose-400 mb-1">Failed Records:</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 max-h-32 overflow-y-auto">
                    {resultSummary.errors.map((err, i) => (
                      <li key={i}>
                        Row {err.row} ({err.email || "N/A"}): {err.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Table Preview */}
          {validations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Preview ({validations.length} records)
              </p>
              <div className="max-h-60 overflow-x-auto overflow-y-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-slate-800 bg-slate-900/90 text-slate-400 backdrop-blur">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Bank & IFSC</th>
                      <th className="px-3 py-2">Nominee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#0F172A] text-slate-300">
                    {validations.map((v) => (
                      <tr key={v.index} className={v.isValid ? "" : "bg-rose-950/10"}>
                        <td className="px-3 py-2 text-slate-500 font-mono">{v.index}</td>
                        <td className="px-3 py-2">
                          {v.isValid ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid
                            </span>
                          ) : (
                            <span
                              title={v.errors.join("; ")}
                              className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Error
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-200">
                          {v.row.name || v.row["user.name"] || "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-400">{v.row.email || "-"}</td>
                        <td className="px-3 py-2 text-slate-400">{v.row.phone || "-"}</td>
                        <td className="px-3 py-2">
                          {v.row.bankName ? (
                            <span className="text-slate-300">
                              {v.row.bankName} (
                              <span
                                className={
                                  (v.row.ifscCode || "").length === 11
                                    ? "text-teal-400"
                                    : "text-rose-400 font-bold"
                                }
                              >
                                {v.row.ifscCode || "no-ifsc"}
                              </span>
                              )
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {v.row["nominee.name"] || v.row.nomineeName || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-[#111827]">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 && `${validCount} of ${totalCount} rows ready to process`}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isProcessing || parsedRows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Saving Users...
                </>
              ) : (
                <>
                  <UserCheck className="h-3.5 w-3.5" />
                  Save {validCount} Users to Database
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
