import React from 'react';
import { StatsCard } from '@/components/admin/stats-card';
import { DataTable } from '@/components/admin/data-table';
import { CURRENCY_SYMBOL, CURRENCY_SUBUNIT } from '@/config/constants';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingBag, IndianRupee, AlertCircle } from 'lucide-react';
import { connectDB } from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import ProductVariant from '@/models/ProductVariant';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await connectDB();

  let totalRevenue = 0;
  let ordersCount = 0;
  let customersCount = 0;
  let pendingOrdersCount = 0;
  let recentOrdersDocs: any[] = [];
  let lowStockVariants: any[] = [];

  try {
    const [revenueAgg, oCount, cCount, pCount, rOrders, lVariants] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
      ]).catch(() => []),
      Order.countDocuments().catch(() => 0),
      User.countDocuments({ role: 'customer' }).catch(() => 0),
      Order.countDocuments({ status: 'pending' }).catch(() => 0),
      Order.find().sort({ createdAt: -1 }).limit(5).lean().catch(() => []),
      ProductVariant.find({ $expr: { $lte: ['$availableQty', { $ifNull: ['$lowStockThreshold', 5] }] } })
        .populate('productId', 'title')
        .limit(5)
        .lean()
        .catch(() => [])
    ]);

    totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    ordersCount = oCount;
    customersCount = cCount;
    pendingOrdersCount = pCount;
    recentOrdersDocs = rOrders;
    lowStockVariants = lVariants;
  } catch (err) {
    console.error('[AdminDashboard] Error loading metrics:', err);
  }

  const recentOrders = recentOrdersDocs.map((o: any) => ({
    id: o.orderId,
    customer: o.shippingAddress?.name || o.email,
    total: o.pricing?.total || 0,
    status: o.status,
  }));

  const lowStockItems = lowStockVariants.map((v: any) => ({
    id: v._id.toString(),
    title: `${v.productId?.title || 'Variant'} (${v.size || v.color || v.sku})`,
    stock: v.availableQty,
    threshold: v.lowStockThreshold,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">Store Overview</h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Real-time performance metrics and inventory status</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-secondary font-medium shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Store Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatsCard 
          title="Total Revenue" 
          value={(totalRevenue / CURRENCY_SUBUNIT).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
          prefix={CURRENCY_SYMBOL} 
          icon={<IndianRupee className="w-5 h-5 text-brand-700" />} 
        />
        <StatsCard 
          title="Total Orders" 
          value={ordersCount} 
          icon={<ShoppingBag className="w-5 h-5 text-brand-700" />} 
        />
        <StatsCard 
          title="Total Customers" 
          value={customersCount} 
          icon={<Users className="w-5 h-5 text-brand-700" />} 
        />
        <StatsCard 
          title="Pending Orders" 
          value={pendingOrdersCount} 
          icon={<AlertCircle className="w-5 h-5 text-amber-600" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text">Recent Orders</h2>
              <p className="text-xs text-text-secondary">Latest purchases placed on the storefront</p>
            </div>
            <Link href="/admin/orders" className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors">
              View All &rarr;
            </Link>
          </div>
          <DataTable 
            columns={[
              { key: 'id', label: 'Order ID' },
              { key: 'customer', label: 'Customer' },
              { key: 'total', label: 'Total', render: (row: any) => `${CURRENCY_SYMBOL}${(row.total / CURRENCY_SUBUNIT).toLocaleString('en-IN')}` },
              { key: 'status', label: 'Status', render: (row: any) => (
                <Badge variant={row.status === 'confirmed' || row.status === 'delivered' ? 'success' : row.status === 'cancelled' ? 'error' : 'warning'}>
                  {row.status}
                </Badge>
              ) },
            ]}
            data={recentOrders}
          />
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-text">Low Stock Alert</h2>
              <p className="text-xs text-text-secondary">Variants requiring restocking attention</p>
            </div>
            <Link href="/admin/inventory" className="text-xs font-semibold text-brand-700 hover:text-brand-800 transition-colors">
              Manage Inventory &rarr;
            </Link>
          </div>
          <DataTable 
            columns={[
              { key: 'title', label: 'Product / Variant' },
              { key: 'stock', label: 'Available', render: (row: any) => (
                <Badge variant={row.stock === 0 ? 'error' : 'warning'}>{row.stock}</Badge>
              ) },
              { key: 'threshold', label: 'Threshold' },
            ]}
            data={lowStockItems}
          />
        </div>
      </div>
    </div>
  );
}
