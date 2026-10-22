"use client";

import React from "react";
import { Search, ChevronDown } from "lucide-react";
import { useSubmissions } from "@/hooks/useSubmissions";
import { SubmissionsFilterPills } from "@/components/submissions/SubmissionsFilterPills";
import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";

export default function SubmissionsPage() {
  const {
    submissions,
    isLoading,
    counts,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    customerFilter,
    setCustomerFilter,
    countryFilter,
    setCountryFilter,
    customerOptions,
    countryOptions,
  } = useSubmissions();

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Top Header & Search Bar (matches Reference Image 1) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Submissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Sites customers have sent for approval. Newest first.
          </p>
        </div>

        {/* Search & Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[260px] sm:w-72">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site, customer or person"
              className="w-full text-xs rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-9 pr-3.5 py-2 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Customer Dropdown */}
          <div className="relative">
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="appearance-none text-xs rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-3 pr-8 py-2 text-slate-700 dark:text-zinc-300 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium"
            >
              <option value="all">Customer: All</option>
              {customerOptions.map((cust) => (
                <option key={cust} value={cust}>
                  {cust}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          {/* Country Dropdown */}
          <div className="relative">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="appearance-none text-xs rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-3 pr-8 py-2 text-slate-700 dark:text-zinc-300 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 cursor-pointer font-medium"
            >
              <option value="all">Country: All</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Filter Pills Navigation */}
      <SubmissionsFilterPills
        activeStatus={statusFilter}
        onChange={setStatusFilter}
        counts={counts}
      />

      {/* Data Table */}
      <SubmissionsTable submissions={submissions} isLoading={isLoading} />
    </div>
  );
}
