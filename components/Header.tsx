'use client'; 
import Image from 'next/image';
import React from 'react';
import Logo from "../images/ticket.png";
import NavBar from './NavBar';
import { SignedOut, UserButton, SignedIn, SignInButton } from '@clerk/nextjs';
import SearchBar from './SearchBar';
import Link from 'next/link';

function Header() {
  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='flex flex-col justify-center items-center sm:h-[70px] fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm'>
        <div className='flex w-full items-center  justify-between'>
        <div className='flex gap-5 items-center text-3xl font-semibold'>
          <Link href={"/"} className='flex gap-1 items-center text-3xl font-semibold'>
            <Image width={45} height={45} src={Logo} alt='Logo' />
            <span>QuickTix</span>
          </Link>
          <div className='sm:block hidden'>
            <SearchBar/>
          </div>
        </div>
        <div className='flex gap-2 px-2'>
          <NavBar />
          <SignedIn>
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode='modal'>
              <button className='bg-gray-100 text-gray-800 px-3 py-1 text-sm rounded-lg hover:bg-gray-200 transition border border-gray-300'>
                SignIn
              </button>
            </SignInButton>
          </SignedOut>
        </div>
        </div>
        <div className='sm:hidden mb-4 w-full px-2'>
        <SearchBar/>
        </div>
      </div>
    </div>
  );
}

export default Header;