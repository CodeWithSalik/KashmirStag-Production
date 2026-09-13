import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Link from "next/link";
import { formatPrice } from "@/lib/money";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800';
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-800';
    case 'processing':
    case 'packed':
      return 'bg-purple-100 text-purple-800';
    case 'cancelled':
    case 'refunded':
      return 'bg-rose-100 text-rose-800';
    case 'return_requested':
    case 'returned':
    case 'pending':
    default:
      return 'bg-amber-100 text-amber-800';
  }
}

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  const user = token ? verifyJwt(token) : null;

  await connectDB();

  const orders = user
    ? await Order.find({ userId: user.sub }).sort({ createdAt: -1 }).lean()
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-brand-700 font-medium hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order._id.toString()}
              className="border border-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <div className="font-medium">
                  Order #{order.orderId || order._id.toString().slice(-6).toUpperCase()}
                </div>
                <div className="text-sm text-text-tertiary">
                  {new Date(order.createdAt).toLocaleDateString('en-IN')}
                </div>
                <span className={`mt-1 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${getStatusBadgeClass(order.status)}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatPrice(order.pricing?.total ?? 0)}
                </div>
                <div className="text-sm text-text-secondary">
                  {order.items?.length ?? 0} items
                </div>
              </div>
              <Link
                href={`/account/orders/${order.orderId || order._id}`}
                className="text-brand-700 font-medium text-sm hover:underline"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
