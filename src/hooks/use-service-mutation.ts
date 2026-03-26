"use client";

import { useState } from "react";

import { getBackendErrorMessage } from "@/services/backend/error";

type MutationState = {
  pending: boolean;
  error: string | null;
};

type MutationOptions<T> = {
  onSuccess?: (result: T) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

export function useServiceMutation<T = void>(mutation: (formData: FormData) => Promise<T>, options: MutationOptions<T> = {}) {
  const [state, setState] = useState<MutationState>({
    pending: false,
    error: null,
  });

  async function submit(formData: FormData) {
    setState({
      pending: true,
      error: null,
    });

    try {
      const result = await mutation(formData);
      await options.onSuccess?.(result);
      setState({
        pending: false,
        error: null,
      });
      return result;
    } catch (error) {
      const nextError = getBackendErrorMessage(error, "No se pudo completar la operacion.");
      setState({
        pending: false,
        error: nextError,
      });
      await options.onError?.(error);
      throw error;
    }
  }

  function resetError() {
    setState((current) => ({
      ...current,
      error: null,
    }));
  }

  return {
    ...state,
    submit,
    resetError,
  };
}
