"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import AuthForm from "@/components/AuthForm";
import Loader from "@/components/Loader";
import { userContext } from "@/context/UserContext";
import { use, useEffect } from "react";

function AuthFormContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  return <AuthForm initialMode={mode} />;
}

const AuthFormWithParams = dynamic(
  //here we are using dynamic import to load the AuthFormContent component asynchronously. 
  // This is useful for code splitting and improving performance, especially if the AuthFormContent
  //  component is large or has heavy dependencies.
  () => Promise.resolve(AuthFormContent),
  {
    loading: () => <Loader />,
    ssr: false
  }
);

export default function LoginPage() {
  const router = useRouter();
  const { authUser } = use(userContext);
  useEffect(() => {
    //  SAFE: This runs strictly AFTER the component finishes rendering
    if (authUser) {
      router.push("/dashboard");
    }
  }, [authUser, router]); // Run whenever these variables change else
  return (
    <div className="max-h-screen bg-slate-50 text-slate-950 flex flex-col">
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 grow">
        <div className="grow flex items-center justify-center py-6">
          <AuthFormWithParams />
        </div>
      </div>
    </div>
  );
}