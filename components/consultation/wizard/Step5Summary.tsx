"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import type { PatientData, AllergyType } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { getRelevantAllergyTypes } from "@/lib/data/client-candidates";

interface Step5Props {
  data: Partial<PatientData>;
  onSubmit: (data: Partial<PatientData>) => void;
  onBack: () => void;
  isLoading: boolean;
  candidateVaccineIds: string[];
}

const BASIC_VACCINE_IDS = ["dtap", "mmr", "varicella"];

const ALLERGY_LABELS: Record<AllergyType, string> = {
  egg: "Egg",
  gelatin: "Gelatin",
  latex: "Latex",
  neomycin: "Neomycin",
  yeast: "Gjær",
  other: "Andre allergier",
};

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d. MMMM yyyy", { locale: nb });
}

export function Step5Summary({ data, onSubmit, onBack, isLoading, candidateVaccineIds }: Step5Props) {
  const [allergies, setAllergies] = useState<AllergyType[]>(data.allergies ?? []);

  function toggleAllergy(a: AllergyType) {
    setAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  function handleSubmit() {
    onSubmit({ allergies });
  }

  const relevantAllergyTypes = getRelevantAllergyTypes(
    [...BASIC_VACCINE_IDS, ...candidateVaccineIds],
    data.previousVaccinations ?? []
  );
  const shouldShowAllergies = relevantAllergyTypes.length > 0;
  const primary = data.destinations?.find((d) => !d.isLayover);
  const layovers = data.destinations?.filter((d) => d.isLayover) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allergier og bekreftelse</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {shouldShowAllergies && (
          <>
            <div className="space-y-3">
              <Label className="text-base">Kjente allergier (kun det som fortsatt er relevant)</Label>
              <p className="text-xs text-muted-foreground">
                Vi viser bare allergier som kan være relevante for vaksinene som fortsatt kan bli aktuelle.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {relevantAllergyTypes.map((allergyType) => (
                  <div key={allergyType} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`allergy-${allergyType}`}
                      checked={allergies.includes(allergyType)}
                      onChange={() => toggleAllergy(allergyType)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor={`allergy-${allergyType}`} className="text-sm">
                      {ALLERGY_LABELS[allergyType]}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
          </>
        )}

        {/* Summary */}
        <div className="space-y-2 text-sm">
          <p className="font-medium text-muted-foreground uppercase text-xs tracking-wide">Oppsummering</p>
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
          {allergies.length > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allergier</span>
              <span>{allergies.map((a) => ALLERGY_LABELS[a]).join(", ")}</span>
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
          <Button onClick={handleSubmit} className="flex-1" disabled={isLoading}>
            {isLoading ? "Genererer anbefaling..." : "Generer anbefalingsplan"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
