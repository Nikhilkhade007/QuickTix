'use client'
import React from 'react'
import { Menubar,MenubarMenu,  MenubarTrigger } from './ui/menubar'
import Link from 'next/link'

function NavBar() {
  return (
    <Menubar className='hidden md:flex'>
      <MenubarMenu >
        <MenubarTrigger>
          <Link href={"/seller"}>Sell</Link>
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>
          <Link href={"/tickets"}>
          My Tickets</Link>
        </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  )
}

export default NavBar