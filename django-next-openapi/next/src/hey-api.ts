// next/src/hey-api.ts
import type { CreateClientConfig } from "./client/client.gen";

export const createClientConfig: CreateClientConfig = (config) => {
  return {
    ...config,
    baseUrl: process.env.NEXT_PUBLIC_API_BASEURL,
    credentials: "include",
  };
};
