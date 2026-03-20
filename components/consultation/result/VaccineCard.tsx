import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { VaccineRecommendation } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VaccineCardProps {
  recommendation: VaccineRecommendation;
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "d. MMM yyyy", { locale: nb });
}

const LEVEL_CONFIG = {
  required: {
    label: "PÅKREVD",
    variant: "destructive" as const,
    className: "border-l-4 border-l-red-500",
  },
  strongly_recommended: {
    label: "STERKT ANBEFALT",
    variant: "default" as const,
    className: "border-l-4 border-l-blue-500",
  },
  recommended: {
    label: "ANBEFALT",
    variant: "secondary" as const,
    className: "border-l-4 border-l-green-500",
  },
  consider: {
    label: "VURDER",
    variant: "outline" as const,
    className: "border-l-4 border-l-yellow-500",
  },
  not_recommended: {
    label: "ANBEFALES IKKE",
    variant: "outline" as const,
    className: "border-l-4 border-l-gray-400",
  },
};

export function VaccineCard({ recommendation: rec }: VaccineCardProps) {
  const config = LEVEL_CONFIG[rec.level];

  return (
    <Card className={cn("mb-3", config.className)}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-base">{rec.displayNameNo}</h3>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>

        {rec.scheduleVariant === "accelerated" && (
          <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mb-3">
            Akselerert skjema valgt pga. kort tid til avreise
          </p>
        )}

        <div className="space-y-1.5">
          {rec.datedDoses.map((dose) => (
            <div
              key={dose.doseNumber}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{dose.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{formatDate(dose.targetDate)}</span>
                {dose.feasible ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    dose.daysBeforeTravel >= 0
                      ? "text-muted-foreground"
                      : "text-red-600 font-medium"
                  )}
                >
                  {dose.daysBeforeTravel >= 0
                    ? `${dose.daysBeforeTravel}d før avreise`
                    : `${Math.abs(dose.daysBeforeTravel)}d etter avreise`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {rec.certificateValidFrom && (
          <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
            <span className="text-blue-800">
              Gulfeberrsertifikat gyldig fra:{" "}
              <strong>{formatDate(rec.certificateValidFrom)}</strong>
            </span>
          </div>
        )}

        {rec.contraindications.length > 0 && (
          <div className="mt-3 space-y-1">
            {rec.contraindications.map((ci, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{ci.description}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
