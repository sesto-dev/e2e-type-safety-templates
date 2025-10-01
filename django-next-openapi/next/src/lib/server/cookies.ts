import { cookies } from "next/headers";

export async function getCurrentCookies() {
  const cookieStore = await cookies();
  return cookieStore.toString();
}
