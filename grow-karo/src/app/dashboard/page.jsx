"use client";
import React, { use, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Loader from "@/loader/Loader";
import { userContext } from "@/context/UserContext";
import { remitterContext } from "@/context/RemitterContext";
import { useRouter } from "next/navigation";

const AdminDashboard = dynamic(() => import("./malik/AdminDashboard"), {
  loading: () => <Loader />,
  ssr: false,
});
const RemitterDashboard = dynamic(
  () => import("./Remitter/RemitterDashboard"),
  {
    loading: () => <Loader />,
    ssr: false,
  },
);
const UserDashboard = dynamic(() => import("./grahak/UserDashboard"), {
  loading: () => <Loader />,
  ssr: false,
});

const Dashboard = () => {
  const { authUser } = use(userContext);
  const { authRemitter } = use(remitterContext);
  const router = useRouter();

  const isAdmin = useMemo(() => {
    if (!authUser?.email) return false;

    const adminEmails =
      (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

    return adminEmails.includes(authUser.email.trim().toLowerCase());
  }, [authUser]);

  const shouldRedirect = !authUser && !authRemitter;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/auth");
    }
  }, [shouldRedirect, router]);

  if (isAdmin) return <AdminDashboard />;
  if (authUser) return <UserDashboard />;
  if (authRemitter) return <RemitterDashboard />;

  return <Loader />;
};

export default Dashboard;