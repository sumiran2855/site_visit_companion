"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminService } from "@/services/admin.service";
import { useTranslation } from "@/i18n";
import type { RetentionStorageMetrics, RetentionCleanupResult } from "@/types/admin";

export function useAdminRetention() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isCompanyAdmin = user?.role === "company_admin";

  const [metrics, setMetrics] = useState<RetentionStorageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastRunResult, setLastRunResult] = useState<RetentionCleanupResult | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRetentionData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    }
    setErrorMessage(null);

    try {
      const data = await AdminService.getRetentionStorageMetrics(365);
      if (!isMountedRef.current) return;
      setMetrics(data);
      if (data.lastCleanup) {
        setLastRunResult(data.lastCleanup);
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.error("[useAdminRetention] Failed to load retention metrics:", err);
      const msg =
        err instanceof Error
          ? err.message
          : t(
              "retention.notifications.metricsLoadFailed",
              "Failed to load real-time retention metrics. Please check connection."
            );
      setErrorMessage(msg);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [t]);

  useEffect(() => {
    let isCancelled = false;
    AdminService.getRetentionStorageMetrics(365)
      .then((data) => {
        if (!isCancelled) {
          setMetrics(data);
          if (data.lastCleanup) {
            setLastRunResult(data.lastCleanup);
          }
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          console.error("[useAdminRetention] Failed to load retention metrics:", err);
          const msg =
            err instanceof Error
              ? err.message
              : t(
                  "retention.notifications.metricsLoadFailed",
                  "Failed to load real-time retention metrics. Please check connection."
                );
          setErrorMessage(msg);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [t]);

  const onRefresh = useCallback(() => {
    fetchRetentionData(true);
  }, [fetchRetentionData]);

  const triggerCleanup = useCallback(async () => {
    setIsRunning(true);
    setShowConfirmModal(false);
    try {
      const res = await AdminService.runRetentionCleanup(365);
      if (isMountedRef.current) {
        setLastRunResult(res);
      }
      await fetchRetentionData(true);

      if (res.purgedVisits > 0 || res.deletedFilesCount > 0) {
        setNotification({
          title: t(
            "retention.notifications.purgeCompletedTitle",
            "Retention Purge Completed"
          ),
          message: t(
            "retention.notifications.purgeCompletedMessage",
            "Successfully purged {{visits}} expired visit(s) and deleted {{files}} file(s), freeing {{space}} MB.",
            {
              visits: res.purgedVisits,
              files: res.deletedFilesCount,
              space: res.freedSpaceMB,
            }
          ),
          type: "success",
        });
      } else {
        setNotification({
          title: t(
            "retention.notifications.verificationCompletedTitle",
            "Retention Verification Completed"
          ),
          message: t(
            "retention.notifications.verificationCompletedMessage",
            "No visits or media older than 365 days were found. All system data remains in compliance."
          ),
          type: "info",
        });
      }
    } catch (e: unknown) {
      console.error("[useAdminRetention] Purge failed:", e);
      setNotification({
        title: t("retention.notifications.purgeFailedTitle", "Purge Failed"),
        message:
          e instanceof Error
            ? e.message
            : t(
                "retention.notifications.purgeFailedMessage",
                "Failed to execute retention cleanup."
              ),
        type: "error",
      });
    } finally {
      if (isMountedRef.current) {
        setIsRunning(false);
      }
    }
  }, [fetchRetentionData, t]);

  return {
    isSuperAdmin,
    isCompanyAdmin,
    metrics,
    isLoading,
    isRefreshing,
    isRunning,
    errorMessage,
    lastRunResult,
    showConfirmModal,
    setShowConfirmModal,
    notification,
    setNotification,
    fetchRetentionData,
    onRefresh,
    triggerCleanup,
  };
}

