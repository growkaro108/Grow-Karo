'use client'
import Loader from '@/components/Loader';
import dynamic from 'next/dynamic';
import React from 'react'
// import RemitterDashboard from '../dashboard/Remitter/RemitterDashboard'
const RemitterDashboard =dynamic(() => import('../dashboard/Remitter/RemitterDashboard'), {
  loading: () => <Loader />,
  ssr: false,
});

const page = () => {
  return (
    <RemitterDashboard />
  )
}

export default page
