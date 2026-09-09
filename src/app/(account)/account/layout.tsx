import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const payload = token ? verifyJwt(token) : null;
  if (!payload) redirect("/login");

  return <>{children}</>;
}
