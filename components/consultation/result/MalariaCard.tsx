import { Card, CardContent } from "@/components/ui/card";
import type { MalariaRecommendation } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowDown, ArrowRight, Bug, CalendarRange } from "lucide-react";

interface MalariaCardProps {
  recommendation: MalariaRecommendation;
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "d. MMMM yyyy", { locale: nb });
}

export function MalariaCard({ recommendation: rec }: MalariaCardProps) {
  return (
    <Card className="overflow-hidden border border-emerald-200 bg-emerald-50/70 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-lime-500" />
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Bug className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Malariaprofylakse</p>
            <h3 className="text-xl font-semibold tracking-tight">{rec.displayNameNo}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{rec.reason}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarRange className="h-4 w-4" />
            Tidslinje for tabletter
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold">Start</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{formatDate(rec.startDate)}</p>
              <p className="text-sm text-muted-foreground">Begynn før avreise</p>
            </div>

            <div className="flex justify-center py-2 text-muted-foreground sm:py-0">
              <ArrowDown className="h-5 w-5 sm:hidden" />
              <ArrowRight className="hidden h-5 w-5 sm:block" />
            </div>

            <div className="flex-1 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold">Slutt</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{formatDate(rec.stopDate)}</p>
              <p className="text-sm text-muted-foreground">Fortsett etter hjemkomst</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
