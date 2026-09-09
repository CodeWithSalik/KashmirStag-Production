import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatsCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  trend?: number;
}

export function StatsCard({
  title,
  value,
  prefix,
  suffix,
  icon,
  trend,
}: StatsCardProps) {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;

  return (
    <Card padding="md" className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-text-secondary">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon && <div className="text-text-tertiary h-5 w-5">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-text">
          {prefix}{value}{suffix}
        </div>
        
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-text-secondary"
            )}
          >
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : isNegative ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </Card>
  );
}
