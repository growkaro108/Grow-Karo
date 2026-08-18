"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import TabLoader from "@/loader/TabLoader";

const AuthLogin = dynamic(() => import("./AuthLogin"), {
  loading: () => <TabLoader message="Loading login form..." />,
  ssr: false
});
const AuthSignup = dynamic(() => import("./signup/AuthSignup"), {
  loading: () => <TabLoader message="Loading signup form..." />,
  ssr: false
});
const AuthForgot = dynamic(() => import("./AuthForgot"), {
  loading: () => <TabLoader message="Loading forgot password form..." />,
  ssr: false
});

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
