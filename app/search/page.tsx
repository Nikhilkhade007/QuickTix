"use client";
import React, { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import Spinner from "@/components/Spinner";
import SearchResults from "@/components/SearchResults"; // New component

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="px-4 mt-4">
        <div className="flex items-center gap-3 ">
          <SearchIcon className="w-6 h-6 text-gray-400" />
          <h1 className="font-bold text-2xl text-gray-900">Search Results</h1>
        </div>
      </div>

      {/* Suspense ensures proper rendering */}
      <Suspense fallback={<Spinner />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
