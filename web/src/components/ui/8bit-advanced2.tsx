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
    value: "$4.2M",
    change: "+$180K today",

  },
  {
    icon: "ZK",
    title: "Zero-Knowledge Proofs",
    value: "241K",
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
  title = "Stats Dashboard",
  description = "Real-time metrics from the battlefield",
  metrics = defaultMetrics,
  className,
}: Advanced2Props) {
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
          {metrics.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs text-muted-foreground">
                    {metric.title}
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
          ))}
        </div>
      </div>
    </section>
  );
}
