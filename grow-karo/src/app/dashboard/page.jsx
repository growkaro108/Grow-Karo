"use client";
import React, { use } from "react";
import dynamic from "next/dynamic";
import Loader from "@/loader/Loader";
import { userContext } from "@/context/UserContext";

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

  if (!AdminDashboard || !RemitterDashboard || !UserDashboard) {
    return <Loader />;
  }
  if (authUser?.email === "wv9304@gmail.com") return <AdminDashboard />;
  return (
    <UserDashboard />
    // <AdminDashboard />
    // <RemitterDashboard />
  );
};

export default Dashboard;
