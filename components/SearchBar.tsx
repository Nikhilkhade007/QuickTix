"use client";

import {  SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="max-w-4xl  mx-auto">
      <form onSubmit={handleSearch} className="relative flex gap-2 items-center justify-center">
      <div className="relative flex-grow">
              <Input placeholder="Search for the event" value={query} onChange={e=>setQuery(e.target.value)}/>
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <Button onClick={handleSearch} type='submit' size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
              Search
            </Button >
      </form>
    </div>
  );
}