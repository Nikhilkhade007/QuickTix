'use client'
import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Spinner from '@/components/Spinner';
import { CalendarDays, Search, SearchIcon, Ticket } from 'lucide-react';
import EventCard from '@/components/EventCard';
function page() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || "";
    const events = useQuery(api.events.search,{searchParam:query || ""})
    console.log("query",query)
    const upcomingEvents = events?.filter(event=> event.eventDate > Date.now()).sort((a,b)=> a.eventDate - b.eventDate)
    const pastEvents = events?.filter(event=> event.eventDate <= Date.now()).sort((a,b)=> b.eventDate - a.eventDate)
    if (!events){
        return (
            <Spinner/>
        )
    }
  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='px-4 mt-4'>
            <div className='flex items-center gap-3 '>
                <SearchIcon className='w-6 h-6 text-gray-400'/>
                <div className='flex flex-col gap-1'>
                    <h1 className='font-bold text-2xl text-gray-900'>Search Results for &quot;{query}&quot;</h1>
                    <p className='text-gray-600'>Found {events.length} events</p>
                </div>
            </div>
        </div>
        {
            events.length === 0 &&(
                <div className='text-center py-12 bg-white rounded-xl shadow-sm'>
                    <SearchIcon className='w-12 h-12 text-gray-300 mx-auto mb-4'/>
                    <h3 className='text-lg font-medium text-gray-900'>
                        No events found
                    </h3>
                    <p>
                        Search some other event by name,location
                    </p>
                </div>
            )
        }
        <div className='flex mt-4 items-center justify-between mb-8'>
            <div>
                <h1 className='font-bold text-3xl text-gray-900'>
                    Upcoming Events
                </h1>
                <p className='mt-2 text-gray-600'>
                    Discover & book tickets for amazing events
                </p>
            </div>
            <div className='px-4 py-2 gap-2 shadow-sm rounded-lg bg-white border border-gray-100'>
                <div className='flex gap-2 items-center text-gray-600'>
                    <CalendarDays className='w-5 h-5'/>
                    <span className='font-medium'>
                        {upcomingEvents?.length} Upcoming Events
                    </span>
                </div>
            </div>
        </div>
        { upcomingEvents?.length?(
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
                {upcomingEvents?.map(events=>(
                    <EventCard key={events._id} eventId={events._id}/>
                ))}
            </div>
        ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center mb-12">
          <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No upcoming events
          </h3>
          <p className="text-gray-600 mt-1">Check back later for new events</p>
        </div>
        )}
        {(pastEvents?.length ?? 0) > 0 && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents?.map((event) => (
              <EventCard key={event._id} eventId={event._id} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default page