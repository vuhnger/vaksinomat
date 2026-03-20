"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientData, PreviousVaccination } from "@/lib/types";
import { getVaccineDisplayName, getVaccineHistoryConfig } from "@/lib/data/client-vaccines";

interface Step4Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
  onBack: () => void;
  candidateVaccineIds: string[];
}

const BASIC_VACCINES = [
  { id: "dtap", label: "dTP (Difteri, Tetanus, Kikhoste)" },
  { id: "mmr", label: "MMR (Meslinger, Kusma, Røde hunder)" },
  { id: "varicella", label: "Varicella (Vannkopper)" },
];

export function Step4VaccineHistory({ data, onNext, onBack, candidateVaccineIds }: Step4Props) {
  const [vaccinations, setVaccinations] = useState<PreviousVaccination[]>(
    data.previousVaccinations ?? []
  );
  const [doseYearInputs, setDoseYearInputs] = useState<Record<string, string>>(
    Object.fromEntries(
      (data.previousVaccinations ?? []).map((vaccination) => [
        vaccination.vaccineId,
        vaccination.lastDoseYear?.toString() ?? "",
      ])
    )
  );
  const minDoseYear = data.birthYear ?? 1900;
  const maxDoseYear = new Date().getFullYear();

  function getNormalizedDoseYear(year: string): number | undefined {
    if (!/^\d{4}$/.test(year)) {
      return undefined;
    }

    const parsedYear = parseInt(year, 10);
    if (parsedYear < minDoseYear || parsedYear > maxDoseYear) {
      return undefined;
    }

    return parsedYear;
  }

  function getEntry(id: string): PreviousVaccination | undefined {
    return vaccinations.find((v) => v.vaccineId === id);
  }

  function isChecked(id: string) {
    return vaccinations.some((v) => v.vaccineId === id);
  }

  function getDosesCompleted(id: string): number {
    return getEntry(id)?.dosesCompleted ?? 0;
  }

  function getYear(id: string): string {
    return doseYearInputs[id] ?? getEntry(id)?.lastDoseYear?.toString() ?? "";
  }

  function toggleSingleDose(id: string) {
    setVaccinations((prev) => {
      const has = prev.some((v) => v.vaccineId === id);
      if (has) return prev.filter((v) => v.vaccineId !== id);
      return [...prev, { vaccineId: id, completed: true }];
    });
    setDoseYearInputs((prev) => {
      if (isChecked(id)) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return prev;
    });
  }

  function setDoses(id: string, doses: number) {
    const { completionDoses } = getVaccineHistoryConfig(id);
    setVaccinations((prev) => {
      const without = prev.filter((v) => v.vaccineId !== id);
      if (doses === 0) return without;
      return [
        ...without,
        {
          vaccineId: id,
          dosesCompleted: doses,
          completed: doses >= completionDoses,
        },
      ];
    });
    if (doses === 0) {
      setDoseYearInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function setDoseYear(id: string, year: string) {
    setDoseYearInputs((prev) => ({ ...prev, [id]: year }));
  }

  function commitDoseYear(id: string) {
    const normalizedYear = getNormalizedDoseYear(getYear(id));

    setVaccinations((prev) =>
      prev.map((v) =>
        v.vaccineId === id
          ? {
              ...v,
              lastDoseYear: normalizedYear,
            }
          : v
      )
    );

    setDoseYearInputs((prev) => ({
      ...prev,
      [id]: normalizedYear?.toString() ?? "",
    }));
  }

  function getSubmissionVaccinations(): PreviousVaccination[] {
    return vaccinations.map((vaccination) => ({
      ...vaccination,
      lastDoseYear: getNormalizedDoseYear(doseYearInputs[vaccination.vaccineId] ?? ""),
    }));
  }

  function renderVaccineRow(vac: { id: string; label: string }) {
    const { maxSelectableDoses, completionDoses } = getVaccineHistoryConfig(vac.id);
    const isMultiDose = maxSelectableDoses > 1;
    const dosesCompleted = getDosesCompleted(vac.id);

    return (
      <div key={vac.id} className="py-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm">{vac.label}</span>
          {isMultiDose ? (
            <div className="flex items-center gap-1">
              {Array.from({ length: maxSelectableDoses + 1 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDoses(vac.id, i)}
                  className={`w-8 h-8 rounded text-xs font-medium border transition-colors ${
                    dosesCompleted === i
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {i === 0 ? "Nei" : `${i}`}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="checkbox"
              id={`vac-${vac.id}`}
              checked={isChecked(vac.id)}
              onChange={() => toggleSingleDose(vac.id)}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
        </div>
        {isMultiDose && (
          <p className="mt-1 text-xs text-muted-foreground">
            Full serie: {completionDoses} dose{completionDoses > 1 ? "r" : ""}
            {maxSelectableDoses > completionDoses ? ` (kan registreres opptil ${maxSelectableDoses})` : ""}.
          </p>
        )}
        {(isChecked(vac.id) || dosesCompleted > 0) && (
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Siste dose:</span>
            <Input
              placeholder={`År fra ${minDoseYear}`}
              value={getYear(vac.id)}
              onChange={(e) => setDoseYear(vac.id, e.target.value)}
              onBlur={() => commitDoseYear(vac.id)}
              className="w-32 h-7 text-sm"
              type="number"
              min={minDoseYear}
              max={maxDoseYear}
            />
          </div>
        )}
      </div>
    );
  }

  // Show only candidate travel vaccines
  const relevantTravelVaccines = candidateVaccineIds
    .map((id) => {
      const label = getVaccineDisplayName(id);
      return label ? { id, label } : null;
    })
    .filter((vaccine): vaccine is { id: string; label: string } => vaccine !== null);

  const relevantTravelVaccineNames = relevantTravelVaccines.map((vaccine) => vaccine.label);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vaksinasjonshistorikk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Vi viser bare reisevaksiner som er aktuelle for denne reisen. For vaksiner som gis i serie, oppgi antall doser pasienten faktisk har mottatt.
        </p>

        {relevantTravelVaccineNames.length > 0 && (
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Aktuelle reisevaksiner for denne reisen: {relevantTravelVaccineNames.join(", ")}.
          </div>
        )}

        <div>
          <Label className="text-base">Grunnvaksiner</Label>
          <div className="mt-2 divide-y">
            {BASIC_VACCINES.map(renderVaccineRow)}
          </div>
        </div>

        {relevantTravelVaccines.length > 0 && (
          <div>
            <Label className="text-base">Reisevaksiner (aktuelt for destinasjon)</Label>
            <div className="mt-2 divide-y">
              {relevantTravelVaccines.map(renderVaccineRow)}
            </div>
          </div>
        )}

        {relevantTravelVaccines.length === 0 && (
          <div className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
            Ingen spesifikke reisevaksiner er aktuelle ut fra destinasjon og eksponeringsprofil akkurat nå. Registrer bare grunnvaksiner hvis det er relevant eller usikkert.
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Tilbake
          </Button>
          <Button
            onClick={() => onNext({ previousVaccinations: getSubmissionVaccinations() })}
            className="flex-1"
          >
            Neste: Allergier og bekreftelse
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
