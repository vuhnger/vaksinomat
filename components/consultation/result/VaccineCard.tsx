import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VaccineRecommendation } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { AlertCircle, ArrowDown, ArrowRight, CheckCircle2, ShieldPlus, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaccineCardProps {
  recommendation: VaccineRecommendation;
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "d. MMM yyyy", { locale: nb });
}

const LEVEL_CONFIG = {
  required: {
    label: "Påkrevd",
    badge: "destructive" as const,
    accent: "from-red-500 to-rose-500",
    surface: "border-red-200 bg-red-50/70",
  },
  strongly_recommended: {
    label: "Sterkt anbefalt",
    badge: "default" as const,
    accent: "from-sky-500 to-cyan-500",
    surface: "border-sky-200 bg-sky-50/70",
  },
  recommended: {
    label: "Anbefalt",
    badge: "secondary" as const,
    accent: "from-emerald-500 to-teal-500",
    surface: "border-emerald-200 bg-emerald-50/70",
  },
  consider: {
    label: "Vurder",
    badge: "outline" as const,
    accent: "from-amber-400 to-orange-400",
    surface: "border-amber-200 bg-amber-50/70",
  },
  not_recommended: {
    label: "Anbefales ikke",
    badge: "outline" as const,
    accent: "from-slate-400 to-slate-500",
    surface: "border-slate-200 bg-slate-50/70",
  },
};

export function VaccineCard({ recommendation: rec }: VaccineCardProps) {
  const config = LEVEL_CONFIG[rec.level];

  return (
    <Card className={cn("overflow-hidden border shadow-sm", config.surface)}>
      <div className={cn("h-1 w-full bg-gradient-to-r", config.accent)} />
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldPlus className="h-4 w-4" />
              Reiseplan for vaksine
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{rec.displayNameNo}</h3>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{rec.reason}</p>
          </div>
          <Badge variant={config.badge}>{config.label}</Badge>
        </div>

        {rec.scheduleVariant === "accelerated" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Akselerert skjema valgt på grunn av kort tid til avreise.
          </div>
        )}

        <div className="rounded-2xl border border-border/70 bg-white/80 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Roadmap frem mot avreise</p>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Doser i rekkefølge</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            {rec.datedDoses.map((dose, index) => (
              <div key={dose.doseNumber} className="flex flex-col sm:flex-row sm:flex-1 sm:items-center sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl border border-border bg-background px-4 py-4 shadow-sm">
                  <div
                    className={cn(
                      "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                      dose.feasible ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {dose.feasible ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{dose.label}</p>
                    <p className="text-lg font-semibold tracking-tight">{formatDate(dose.targetDate)}</p>
                    <p
                      className={cn(
                        "text-sm",
                        dose.daysBeforeTravel >= 0 ? "text-muted-foreground" : "font-medium text-red-600"
                      )}
                    >
                      {dose.daysBeforeTravel >= 0
                        ? `${dose.daysBeforeTravel} dager for avreise`
                        : `${Math.abs(dose.daysBeforeTravel)} dager etter avreise`}
                    </p>
                    {dose.note && <p className="text-xs text-muted-foreground">{dose.note}</p>}
                  </div>
                </div>

                {index < rec.datedDoses.length - 1 && (
                  <div className="flex justify-center py-2 text-muted-foreground sm:px-1 sm:py-0">
                    <ArrowDown className="h-5 w-5 sm:hidden" />
                    <ArrowRight className="hidden h-5 w-5 sm:block" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {rec.certificateValidFrom && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Sertifikatet er gyldig fra <span className="font-semibold">{formatDate(rec.certificateValidFrom)}</span>.
          </div>
        )}

        {rec.contraindications.length > 0 && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            {rec.contraindications.map((ci, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-red-800">
                <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{ci.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
