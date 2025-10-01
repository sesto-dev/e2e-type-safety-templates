"use server";

import { redirect } from "next/navigation";
import { apiAuthMeRetrieve, apiAuthTokenRefreshCreate } from "~/client";
import { getCurrentCookies } from "./cookies";

export default async function getCurrentUser() {
  const res = await apiAuthMeRetrieve({
    credentials: "include",
    headers: { cookie: await getCurrentCookies() },
  });

  if (res.response.status == 401) {
    const refreshResponse = await apiAuthTokenRefreshCreate();
    if (refreshResponse.response.ok) return redirect("/");
  }

  if (res.error) console.error(res.error);
  if (!res.data) return redirect("/login");

  return res.data;
}
