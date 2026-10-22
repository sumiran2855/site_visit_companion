"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SiteSubmission, SubmissionStatus } from "@/types/submission";
import { SubmissionService } from "@/services/submission.service";

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<SiteSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SubmissionService.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Status Tab Counts
  const counts = useMemo(() => {
    return {
      all: submissions.length,
      new: submissions.filter((s) => s.status === "new").length,
      in_review: submissions.filter((s) => s.status === "in_review").length,
      waiting_for_customer: submissions.filter(
        (s) => s.status === "waiting_for_customer"
      ).length,
      approved: submissions.filter((s) => s.status === "approved").length,
      draft: submissions.filter((s) => s.status === "draft").length,
    };
  }, [submissions]);

  // Distinct Customers for Dropdown
  const customerOptions = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.customer) set.add(s.customer);
    });
    return Array.from(set).sort();
  }, [submissions]);

  // Distinct Countries for Dropdown
  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    submissions.forEach((s) => {
      if (s.location.country) set.add(s.location.country);
    });
    return Array.from(set).sort();
  }, [submissions]);

  // Filtered Submissions List
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      // 1. Status Filter
      if (statusFilter !== "all" && s.status !== statusFilter) {
        return false;
      }

      // 2. Customer Filter
      if (
        customerFilter !== "all" &&
        s.customer.toLowerCase() !== customerFilter.toLowerCase()
      ) {
        return false;
      }

      // 3. Country Filter
      if (
        countryFilter !== "all" &&
        s.location.country.toLowerCase() !== countryFilter.toLowerCase()
      ) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.siteName.toLowerCase().includes(q);
        const matchesCustomer = s.customer.toLowerCase().includes(q);
        const matchesPerson = s.sentBy.toLowerCase().includes(q);
        const matchesCity = s.location.city.toLowerCase().includes(q);
        const matchesState = s.location.state.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesCustomer &&
          !matchesPerson &&
          !matchesCity &&
          !matchesState
        ) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, statusFilter, customerFilter, countryFilter, searchQuery]);

  return {
    submissions: filteredSubmissions,
    totalCount: submissions.length,
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
    refreshSubmissions: loadSubmissions,
  };
}

