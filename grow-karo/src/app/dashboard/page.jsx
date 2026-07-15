"use client";
import React from "react";
import dynamic from "next/dynamic";
import Loader from "@/loader/Loader";

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
  if (!AdminDashboard || !RemitterDashboard || !UserDashboard) {
    return <Loader />;
  }
  return (
    <UserDashboard />
    // <AdminDashboard />
    // <RemitterDashboard />
  );
};

export default Dashboard;
