'use client'
import React from 'react'
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from './ui/menubar'
import Link from 'next/link'

function NavBar() {
  return (
    <Menubar className='hidden sm:flex'>
      <MenubarMenu >
        <MenubarTrigger>
          <Link href={"/seller"}>Sell</Link>
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Favorites</MenubarTrigger>
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