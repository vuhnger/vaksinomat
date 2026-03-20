"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PatientData } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";

interface Step5Props {
  data: Partial<PatientData>;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d. MMMM yyyy", { locale: nb });
}

export function Step5Summary({ data, onSubmit, onBack, isLoading }: Step5Props) {
  const primary = data.destinations?.find((d) => !d.isLayover);
  const layovers = data.destinations?.filter((d) => d.isLayover) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bekreft og send</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fødselsår</span>
            <span>{data.birthYear}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gravid</span>
            <span>{data.isPregnant ? "Ja" : "Nei"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Immunsupprimert</span>
            <span>{data.isImmunocompromised ? "Ja" : "Nei"}</span>
          </div>
          {data.allergies && data.allergies.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allergier</span>
              <span>{data.allergies.join(", ")}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Primærdestinasjon</span>
            <span>{primary?.countryName ?? "–"}</span>
          </div>
          {layovers.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mellomlandinger</span>
              <span>{layovers.map((l) => l.countryName).join(", ")}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avreise</span>
            <span>{data.departureDate ? formatDate(data.departureDate) : "–"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Retur</span>
            <span>{data.returnDate ? formatDate(data.returnDate) : "–"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Boform</span>
            <span>
              {data.accommodationType === "hotel" ? "Standard hotell" : "Lokal overnatting"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lokalkontakt</span>
            <span>
              {data.localContact === "minimal" ? "Minimal" : "Tett og langvarig"}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1" disabled={isLoading}>
            Tilbake
          </Button>
          <Button onClick={onSubmit} className="flex-1" disabled={isLoading}>
            {isLoading ? "Genererer anbefaling..." : "Generer anbefalingsplan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
