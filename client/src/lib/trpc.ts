import { useQuery, useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";

type AnyFunction = (...args: any[]) => Promise<any>;

type QueryOptions = Parameters<typeof useQuery>[0];

type MutationOptions<TData = unknown, TError = unknown, TVariables = unknown> = Parameters<typeof useMutation<TData, TError, TVariables>>[0];

function isQueryOptions(value: any): value is QueryOptions {
  return value && typeof value === "object" && !Array.isArray(value) && ("enabled" in value || "staleTime" in value || "cacheTime" in value || "queryKey" in value);
}

function buildRpcNode(obj: any, path: string[] = []): any {
  const node: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === "function") {
      node[key] = {
        useQuery: (inputOrOptions?: any, maybeOptions?: QueryOptions) => {
          let input = inputOrOptions;
          let options = maybeOptions;
          if (options === undefined && isQueryOptions(inputOrOptions)) {
            options = inputOrOptions;
            input = undefined;
          }

          return useQuery({
            queryKey: [...path, key, input],
            queryFn: async () => {
              if (Array.isArray(input)) {
                return value(...input);
              }
              return value(input);
            },
            enabled: options?.enabled ?? true,
            ...options,
          });
        },
        useMutation: (options?: MutationOptions) => useMutation({
          mutationFn: async (variables: any) => {
            if (Array.isArray(variables)) {
              return value(...variables);
            }
            return value(variables);
          },
          ...options,
        }),
      };
    } else if (typeof value === "object" && value !== null) {
      node[key] = buildRpcNode(value, [...path, key]);
    } else {
      node[key] = value;
    }
  }

  return node;
}

export const trpc = buildRpcNode(api);
