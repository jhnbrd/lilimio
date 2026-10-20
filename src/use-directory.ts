import { useEffect, useState } from "react";
import {
  DIRECTORY_TTL,
  directoryKey,
  fetchDirectory,
  validDirectoryResult,
  type DirectoryCenter,
  type DirectoryResult,
  type DirectoryKind,
} from "./lib/directory";
import { readStored, writeStored } from "./lib/storage";
export function readDirectoryCaches() {
  return readStored<DirectoryResult[]>(
    "lilimio-directory-cache-v2",
    [],
    (v) => Array.isArray(v) && v.length <= 8 && v.every(validDirectoryResult),
  );
}
const resultKey = (r: DirectoryResult) =>
  `${directoryKey(r.center)}:${r.category || "All"}`;
export function useDirectory(center: DirectoryCenter, category: DirectoryKind) {
  const key = `${directoryKey(center)}:${category}`;
  const [request, setRequest] = useState(0);
  const [state, setState] = useState<{
    key: string;
    result: DirectoryResult | null;
    loading: boolean;
    error: string;
  }>(() => ({
    key,
    result: readDirectoryCaches().find((r) => resultKey(r) === key) ?? null,
    loading: false,
    error: "",
  }));
  useEffect(() => {
    const cached =
      readDirectoryCaches().find((r) => resultKey(r) === key) ?? null;
    const fresh =
      cached &&
      Date.now() - Date.parse(cached.fetchedAt) >= 0 &&
      Date.now() - Date.parse(cached.fetchedAt) < DIRECTORY_TTL;
    if (request === 0 || (state.key !== key && fresh)) {
      setState({ key, result: cached, loading: false, error: "" });
      return;
    }
    const controller = new AbortController();
    let active = true;
    setState((previous) => ({
      key,
      result: previous.key === key ? previous.result : cached,
      loading: true,
      error: "",
    }));
    const timeout = setTimeout(
      () =>
        controller.abort(
          new DOMException("Place search timed out", "TimeoutError"),
        ),
      30000,
    );
    fetchDirectory(center, controller.signal, fetch, category)
      .then((result) => {
        if (!active) return;
        setState({ key, result, loading: false, error: "" });
        writeStored(
          "lilimio-directory-cache-v2",
          [
            result,
            ...readDirectoryCaches().filter((r) => resultKey(r) !== key),
          ].slice(0, 8),
        );
      })
      .catch((error) => {
        if (active)
          setState((previous) => ({
            ...previous,
            loading: false,
            error: controller.signal.aborted
              ? "The place search timed out. Try again later."
              : error instanceof Error
                ? error.message
                : "Place search is unavailable.",
          }));
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [key, center, request, category]);
  const result = state.key === key ? state.result : null;
  const age = result ? Date.now() - Date.parse(result.fetchedAt) : Infinity;
  return {
    result,
    loading: state.key === key && state.loading,
    error: state.key === key ? state.error : "",
    stale: age > DIRECTORY_TTL || age < 0,
    load: () => setRequest((value) => value + 1),
  };
}
