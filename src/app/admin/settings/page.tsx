'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold text-text">Store Settings</h1>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">General Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Store Name</label>
            <Input defaultValue="KashmirStag" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Email</label>
            <Input defaultValue="pirzadasalik116@gmail.com" />
          </div>
          <Button>Save Changes</Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Maintenance Mode</h2>
        <p className="text-sm text-text-secondary">Enable maintenance mode to prevent customers from accessing the store.</p>
        <div className="flex gap-4">
          <Button variant="outline" className="text-red-500 border-red-500 hover:bg-red-50">Enable Maintenance Mode</Button>
        </div>
      </Card>
    </div>
  );
}
