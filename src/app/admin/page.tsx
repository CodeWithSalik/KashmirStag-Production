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

  // Aggregate live metrics from MongoDB
  const [revenueAgg, ordersCount, customersCount, pendingOrdersCount, recentOrdersDocs, lowStockVariants] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$pricing.total' } } }
    ]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments({ status: 'pending' }),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    ProductVariant.find({ $expr: { $lte: ['$availableQty', '$lowStockThreshold'] } })
      .populate('productId', 'title')
      .limit(5)
      .lean()
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text">Live Dashboard</h1>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live MongoDB
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Revenue" 
          value={(totalRevenue / CURRENCY_SUBUNIT).toLocaleString('en-IN', { minimumFractionDigits: 2 })} 
          prefix={CURRENCY_SYMBOL} 
          icon={<IndianRupee />} 
        />
        <StatsCard 
          title="Total Orders" 
          value={ordersCount} 
          icon={<ShoppingBag />} 
        />
        <StatsCard 
          title="Total Customers" 
          value={customersCount} 
          icon={<Users />} 
        />
        <StatsCard 
          title="Pending Orders" 
          value={pendingOrdersCount} 
          icon={<AlertCircle />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-brand-600 hover:underline">
              View All →
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

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Low Stock Items</h2>
            <Link href="/admin/inventory" className="text-sm text-brand-600 hover:underline">
              Manage Inventory →
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
