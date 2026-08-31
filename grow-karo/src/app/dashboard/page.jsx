"use client";
import React, { use } from "react";
import dynamic from "next/dynamic";
import Loader from "@/loader/Loader";
import { userContext } from "@/context/UserContext";
import { remitterContext } from "@/context/RemitterContext";

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
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) ?? [];
  const isAdmin = adminEmails.includes(authUser?.email);
  if (!AdminDashboard || !RemitterDashboard || !UserDashboard) {
    return <Loader />;
  }
  if (isAdmin) {
    return <AdminDashboard />;
  } else if (authRemitter) {
    return <RemitterDashboard />;
  } else {
    return <UserDashboard />;
  }
};

export default Dashboard;
