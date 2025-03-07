import React from 'react'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import Link from 'next/link'

function MenuComponent() {
  return (
    <div className='md:hidden'>
        <Sheet>
        <SheetTrigger asChild>
            <Button size='sm' className='bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded-lg'>
                Menu
            </Button>
        </SheetTrigger>
        <SheetContent>
            <SheetHeader>
                <SheetTitle>
                Menu
            </SheetTitle>
            </SheetHeader>
            <div className='flex flex-col gap-2'>
                <Link className='text-gray-600  hover:text-gray-900 transition-colors' href='/tickets'>
                        My Tickets
                </Link>
                <Link className='text-gray-600 hover:text-gray-900 transition-colors' href='/seller'>
                        Sell
                </Link>
                
            </div>
            
        </SheetContent>
    </Sheet>
    </div>
  )
}

export default MenuComponent