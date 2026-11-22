"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchOperationsResource } from "@/lib/operations-api";

export function useOperationsTable<T>(resource: string) {
  const [records, setRecords] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await fetchOperationsResource<T>(resource));
    } catch (fetchError) {
      setRecords([]);
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load database records.");
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => {
    let active = true;
    fetchOperationsResource<T>(resource)
      .then((data) => {
        if (!active) return;
        setRecords(data);
        setError("");
      })
      .catch((fetchError) => {
        if (!active) return;
        setRecords([]);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load database records.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resource]);

  return { records, loading, error, refresh };
}
