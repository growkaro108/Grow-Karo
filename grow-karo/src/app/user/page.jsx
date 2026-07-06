'use client'
import Loader from '@/components/Loader';
import dynamic from 'next/dynamic';
import React from 'react'
// import UserDashboard from '../dashboard/grahak/UserDashboard'
const UserDashboard =dynamic(() => import('../dashboard/grahak/UserDashboard'), {
  loading: () => <Loader />,
  ssr: false,
});
const page = () => {
  return (
    <UserDashboard />
  )
}

export default page
