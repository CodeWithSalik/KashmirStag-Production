import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'pirzadasalik543@gmail.com';
const REQUIRED_CONFIRMATION = 'WIPE_KASHMIRSTAG_PRODUCTION';

async function main() {
  console.log('====================================================');
  console.log('  KASHMIRSTAG PRODUCTION DATABASE CLEAN-SLATE SCRIPT');
  console.log('====================================================\n');

  const { connectDB } = await import('../src/lib/db');
  const User = (await import('../src/models/User')).default;
  const Category = (await import('../src/models/Category')).default;
  const Collection = (await import('../src/models/Collection')).default;
  const Product = (await import('../src/models/Product')).default;
  const ProductVariant = (await import('../src/models/ProductVariant')).default;
  const Order = (await import('../src/models/Order')).default;
  const Payment = (await import('../src/models/Payment')).default;
  const Cart = (await import('../src/models/Cart')).default;
  const Review = (await import('../src/models/Review')).default;
  const Wishlist = (await import('../src/models/Wishlist')).default;
  const AuditLog = (await import('../src/models/AuditLog')).default;
  const InventoryTransaction = (await import('../src/models/InventoryTransaction')).default;
  const Shipment = (await import('../src/models/Shipment')).default;
  const Coupon = (await import('../src/models/Coupon')).default;
  const CouponUsage = (await import('../src/models/CouponUsage')).default;
  const Notification = (await import('../src/models/Notification')).default;
  const Address = (await import('../src/models/Address')).default;

  await connectDB();
  console.log('[DB] Connected to MongoDB Atlas.\n');

  // 1. Gather current counts across all collections
  const countsBefore = {
    products: await Product.countDocuments(),
    variants: await ProductVariant.countDocuments(),
    categories: await Category.countDocuments(),
    collections: await Collection.countDocuments(),
    orders: await Order.countDocuments(),
    payments: await Payment.countDocuments(),
    carts: await Cart.countDocuments(),
    reviews: await Review.countDocuments(),
    wishlists: await Wishlist.countDocuments(),
    auditLogs: await AuditLog.countDocuments(),
    inventoryTransactions: await InventoryTransaction.countDocuments(),
    shipments: await Shipment.countDocuments(),
    coupons: await Coupon.countDocuments(),
    couponUsages: await CouponUsage.countDocuments(),
    notifications: await Notification.countDocuments(),
    addresses: await Address.countDocuments(),
    totalUsers: await User.countDocuments(),
  };

  const adminUser = await User.findOne({ email: ADMIN_EMAIL });

  console.log('--- CURRENT DATABASE STATE ---');
  console.table(countsBefore);

  console.log(`\nProtected Admin Check:`);
  if (adminUser) {
    console.log(`  [FOUND] Admin user: ${adminUser.email} (Name: ${adminUser.name}, Role: ${adminUser.role}, Status: ${adminUser.status})`);
  } else {
    console.log(`  [NOT FOUND] Admin user ${ADMIN_EMAIL} does not exist yet. It will be created if confirmed.`);
  }

  // 2. Check confirmation
  const isConfirmed =
    process.env.PRODUCTION_RESET_CONFIRM === REQUIRED_CONFIRMATION ||
    process.argv.includes('--confirm');

  if (!isConfirmed) {
    console.log('\n====================================================');
    console.log('  DRY RUN MODE — ZERO CHANGES APPLIED');
    console.log('====================================================');
    console.log(`To execute the production clean-slate purge, set:`);
    console.log(`  PRODUCTION_RESET_CONFIRM="${REQUIRED_CONFIRMATION}"`);
    console.log(`or pass --confirm command line argument.`);
    console.log('\nExample:');
    console.log(`  $env:PRODUCTION_RESET_CONFIRM="${REQUIRED_CONFIRMATION}"; npx tsx scripts/reset-production-data.ts`);
    process.exit(0);
  }

  // 3. Execution Phase
  console.log('\n====================================================');
  console.log('  CONFIRMATION VERIFIED: EXECUTING SAFE PURGE');
  console.log('====================================================\n');

  console.log('[1/4] Purging test orders, transactions, and payments...');
  await Promise.all([
    Order.deleteMany({}),
    Payment.deleteMany({}),
    Cart.deleteMany({}),
    Review.deleteMany({}),
    Wishlist.deleteMany({}),
    AuditLog.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Shipment.deleteMany({}),
    CouponUsage.deleteMany({}),
    Notification.deleteMany({}),
    Address.deleteMany({}),
  ]);
  console.log('      Done.');

  console.log('[2/4] Purging test catalog (products, variants, categories, collections)...');
  await Promise.all([
    Product.deleteMany({}),
    ProductVariant.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
  ]);
  console.log('      Done.');

  console.log('[3/4] Purging test users while preserving admin account...');
  const deletedUsersResult = await User.deleteMany({ email: { $ne: ADMIN_EMAIL } });
  console.log(`      Deleted ${deletedUsersResult.deletedCount} non-admin user(s).`);

  // Verify / Ensure Admin Account
  let finalAdmin = await User.findOne({ email: ADMIN_EMAIL });
  if (finalAdmin) {
    finalAdmin.role = 'admin';
    finalAdmin.status = 'active';
    finalAdmin.emailVerified = true;
    await finalAdmin.save();
    console.log(`      Admin account verified & active: ${ADMIN_EMAIL}`);
  } else {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    finalAdmin = await User.create({
      name: 'Salik Pirzada',
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
    });
    console.log(`      Admin account created: ${ADMIN_EMAIL}`);
  }

  console.log('[4/4] Verifying clean database state...');
  const countsAfter = {
    products: await Product.countDocuments(),
    variants: await ProductVariant.countDocuments(),
    categories: await Category.countDocuments(),
    collections: await Collection.countDocuments(),
    orders: await Order.countDocuments(),
    payments: await Payment.countDocuments(),
    carts: await Cart.countDocuments(),
    reviews: await Review.countDocuments(),
    wishlists: await Wishlist.countDocuments(),
    auditLogs: await AuditLog.countDocuments(),
    inventoryTransactions: await InventoryTransaction.countDocuments(),
    shipments: await Shipment.countDocuments(),
    coupons: await Coupon.countDocuments(),
    couponUsages: await CouponUsage.countDocuments(),
    notifications: await Notification.countDocuments(),
    addresses: await Address.countDocuments(),
    totalUsers: await User.countDocuments(),
  };

  console.log('\n--- POST-PURGE DATABASE STATE ---');
  console.table(countsAfter);

  console.log('\n====================================================');
  console.log('  SAFE CLEAN-SLATE RESET COMPLETED SUCCESSFULLY');
  console.log(`  Admin account [${ADMIN_EMAIL}] preserved and active.`);
  console.log('====================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[FATAL] Script error:', err);
  process.exit(1);
});
