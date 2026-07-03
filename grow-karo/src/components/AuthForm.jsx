"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const AuthLogin = dynamic(() => import("./AuthLogin"), { ssr: false });
const AuthSignup = dynamic(() => import("./AuthSignup"), { ssr: false });
const AuthForgot = dynamic(() => import("./AuthForgot"), { ssr: false });

export default function AuthForm({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);

  return (
    <div className="w-full max-w-md">
      {mode === "login" && <AuthLogin onSwitch={setMode} />}
      {mode === "signup" && <AuthSignup onSwitch={setMode} />}
      {mode === "forgot" && <AuthForgot onSwitch={setMode} />}
    </div>
  );
}
