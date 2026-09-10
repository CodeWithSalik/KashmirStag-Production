import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { handleApiError, successResponse } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import Setting from '@/models/Setting';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

const DEFAULT_SETTINGS: Record<string, any> = {
  storeName: 'KashmirStag',
  supportEmail: 'support@kashmirstag.com',
  supportPhone: '+91 9906000000',
  freeShippingThreshold: 1999,
  standardShippingRate: 99,
  maintenanceMode: false,
  orderPrefix: 'KS',
  announcementBarText: 'Crafted in Kashmir • Free shipping on orders over ₹1,999',
  announcementBarActive: true,
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAdmin(request);

    const settingsDocs = await Setting.find({}).lean();
    const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const doc of settingsDocs) {
      settingsMap[doc.key] = doc.value;
    }

    return successResponse(settingsMap);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const admin = requireAdmin(request);
    const body = await request.json();

    const updates = body.settings || body;
    if (!updates || typeof updates !== 'object') {
      return handleApiError(new Error('Invalid settings payload'));
    }

    const adminId = admin.sub && mongoose.Types.ObjectId.isValid(admin.sub) 
      ? new mongoose.Types.ObjectId(admin.sub) 
      : undefined;

    const ops = Object.entries(updates).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: {
          $set: {
            value,
            ...(adminId ? { updatedBy: adminId } : {}),
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await Setting.bulkWrite(ops as any);
    }

    await AuditLog.create({
      actorId: admin.sub,
      action: 'UPDATE_SETTINGS',
      entity: 'setting',
      changes: updates,
    }).catch(() => {});

    const settingsDocs = await Setting.find({}).lean();
    const settingsMap: Record<string, any> = { ...DEFAULT_SETTINGS };
    for (const doc of settingsDocs) {
      settingsMap[doc.key] = doc.value;
    }

    return successResponse(settingsMap, 'Settings saved successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
