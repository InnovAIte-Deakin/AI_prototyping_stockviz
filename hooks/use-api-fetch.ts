"use client";

import * as React from "react";

export type AsyncState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
};

export type UseApiFetchOptions<T> = {
  errorMessage: string;
  invalidMessage?: string;
  url: string | null;
  validate?: (payload: unknown) => payload is T;
};

export const useApiFetch = <T,>({
  errorMessage,
  invalidMessage,
  url,
  validate,
}: UseApiFetchOptions<T>): AsyncState<T> => {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!url) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let aborted = false;
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(url, { signal: controller.signal });
        const payload = (await res.json()) as unknown;

        if (aborted) {
          return;
        }

        if (!res.ok) {
          const msg =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : `Request failed (${res.status})`;
          throw new Error(msg);
        }

        if (validate && !validate(payload)) {
          throw new Error(invalidMessage ?? errorMessage);
        }

        setData(payload as T);
      } catch (e) {
        if (aborted) {
          return;
        }

        if (e instanceof DOMException && e.name === "AbortError") {
          return;
        }

        setError(e instanceof Error ? e.message : errorMessage);
        setData(null);
      } finally {
        if (!aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [errorMessage, invalidMessage, url, validate]);

  return { data, error, isLoading };
};
