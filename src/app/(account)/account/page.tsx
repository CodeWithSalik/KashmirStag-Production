import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Link from "next/link";

export default async function AccountDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const user = token ? verifyJwt(token) : null;

  await connectDB();

  const totalOrders = user ? await Order.countDocuments({ userId: user.sub }) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-secondary p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-2">Profile Information</h2>
          <p className="text-text-secondary">{user?.email}</p>
          <div className="mt-4">
            <Link href="/account/profile" className="text-brand-700 text-sm font-medium hover:underline">
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="bg-surface-secondary p-6 rounded-lg border border-border">
          <h2 className="text-lg font-semibold mb-2">Order Summary</h2>
          <p className="text-text-secondary">You have {totalOrders} total orders.</p>
          <div className="mt-4">
            <Link href="/account/orders" className="text-brand-700 text-sm font-medium hover:underline">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
