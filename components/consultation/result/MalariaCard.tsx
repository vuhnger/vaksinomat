import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MalariaRecommendation } from "@/lib/types";
import { format, parseISO } from "date-fns";
import nb from "date-fns/locale/nb";
import { Bug } from "lucide-react";

interface MalariaCardProps {
  recommendation: MalariaRecommendation;
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "d. MMMM yyyy", { locale: nb });
}

export function MalariaCard({ recommendation: rec }: MalariaCardProps) {
  return (
    <Card className="border-l-4 border-l-purple-500 mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-600" />
          Malariaprofylakse
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-semibold mb-2">{rec.displayNameNo}</p>
        <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start</span>
            <span className="font-medium">{formatDate(rec.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Slutt</span>
            <span className="font-medium">{formatDate(rec.stopDate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
