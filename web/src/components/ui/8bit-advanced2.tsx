import React, { useState, useEffect } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";
import { Progress } from "@/components/ui/8bit/progress";


export interface MetricCard {
  change?: string;
  icon: ReactNode;
  progress?: number;
  title: string;
  value: string;
}

interface Advanced2Props {
  className?: string;
  description?: string;
  metrics?: MetricCard[];
  title?: string;
}

const defaultMetrics: MetricCard[] = [
  {
    icon: "VC",
    title: "Cards Minted",
    value: "8,492",
    change: "+142 today",
    progress: 78,
  },
  {
    icon: "VOL",
    title: "Shielded Volume",
    value: "$4,241,092",
    change: "+$180K today",

  },
  {
    icon: "ZK",
    title: "Zero-Knowledge Proofs",
    value: "241,042",
    change: "+12% this month",
    progress: 45,
  },
  {
    icon: "SEC",
    title: "Privacy Score",
    value: "99",
    change: "+1 this week",
    progress: 99,
  },
];

export default function Advanced2({
  title = "Network Status",
  description = "",
  metrics: propMetrics,
  className,
}: Advanced2Props) {
  const [metrics, setMetrics] = useState(propMetrics || defaultMetrics);

  useEffect(() => {
    if (propMetrics) {
      setMetrics(propMetrics);
      return;
    }

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => {
        if (m.title === "Cards Minted") {
          const v = parseInt(m.value.replace(/,/g, '')) + (Math.random() > 0.7 ? 1 : 0);
          return { ...m, value: v.toLocaleString() };
        }
        if (m.title === "Shielded Volume") {
          const v = parseInt(m.value.replace(/[^0-9]/g, '')) + Math.floor(Math.random() * 100);
          return { ...m, value: `$${v.toLocaleString()}` };
        }
        if (m.title === "Zero-Knowledge Proofs") {
          const v = parseInt(m.value.replace(/,/g, '')) + Math.floor(Math.random() * 3);
          return { ...m, value: v.toLocaleString() };
        }
        return m;
      }));
    }, 1500);

    return () => clearInterval(interval);
  }, [propMetrics]);

  return (
    <section className={cn("w-full px-4 py-8", className)}>
      <div className="mx-auto max-w-4xl">
        {(title || description) && (
          <div className="mb-10 text-center">
            {title && (
              <h2 className="retro mb-3 font-bold text-2xl tracking-tight md:text-3xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="retro text-muted-foreground text-[9px]">{description}</p>
            )}
          </div>
        )}

        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          {metrics.map((metric) => {
            let dotColor = "";
            let dotBgColor = "";
            if (metric.title === "Cards Minted") {
              dotColor = "bg-green-500";
              dotBgColor = "bg-green-400";
            } else if (metric.title === "Shielded Volume") {
              dotColor = "bg-blue-500";
              dotBgColor = "bg-blue-400";
            } else if (metric.title === "Zero-Knowledge Proofs") {
              dotColor = "bg-purple-500";
              dotBgColor = "bg-purple-400";
            }

            return (
            <Card key={metric.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
                    {metric.title}
                    {dotColor && (
                      <span className="relative flex h-2 w-2">
                        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotBgColor)}></span>
                        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor)}></span>
                      </span>
                    )}
                  </CardTitle>
                  <span className="retro font-bold text-sm">{metric.icon}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="retro mb-1 font-bold text-2xl">
                  {metric.value}
                </div>
                {metric.change && (
                  <p className="retro mb-2 text-muted-foreground text-[10px]">
                    {metric.change}
                  </p>
                )}
                {metric.progress !== undefined && (
                  <Progress className="h-2" value={metric.progress} />
                )}
              </CardContent>
            </Card>
          )})}
        </div>
      </div>
    </section>
  );
}
