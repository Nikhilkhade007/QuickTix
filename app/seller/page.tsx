'use server'
import SellerDashboard from '@/components/sellerComponents/SellerDashboard';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react'

async function SellerPage() {
    const {userId} = await auth();
    if (!userId) redirect("/")
  return (
    <div className='mt-16 min-h-screen bg-gray-50'>
        <SellerDashboard/>
    </div>
  )
}

export default SellerPage