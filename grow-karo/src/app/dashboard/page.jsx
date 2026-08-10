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
  if (process.env.NEXT_PUBLIC_ADMIN_EMAILS?.includes(authUser?.email)) {
    return <AdminDashboard />;
  } else if (
    process.env.NEXT_PUBLIC_REMITTER_EMAILS?.includes(authUser?.email)
  ) {
    return <RemitterDashboard />;
  } else {
    return <UserDashboard />;
  }
};

export default Dashboard;
