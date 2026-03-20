"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientData, PreviousVaccination } from "@/lib/types";

interface Step4Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
  onBack: () => void;
}

const BASIC_VACCINES = [
  { id: "dtap", label: "dTP (Difteri, Tetanus, Kikhoste)" },
  { id: "mmr", label: "MMR (Meslinger, Kusma, Røde hunder)" },
  { id: "polio", label: "Polio" },
  { id: "varicella", label: "Varicella (Vannkopper)" },
];

const TRAVEL_VACCINES = [
  { id: "hep_a", label: "Hepatitt A" },
  { id: "hep_b", label: "Hepatitt B" },
  { id: "hep_ab", label: "Hepatitt A+B" },
  { id: "yellow_fever", label: "Gulfeber" },
  { id: "typhoid_inj", label: "Tyfoid" },
  { id: "rabies", label: "Rabies" },
  { id: "japanese_encephalitis", label: "Japansk encefalitt" },
  { id: "meningococcal", label: "Meningokokk" },
];

export function Step4VaccineHistory({ data, onNext, onBack }: Step4Props) {
  const initPrev = data.previousVaccinations ?? [];
  const [vaccinations, setVaccinations] = useState<PreviousVaccination[]>(initPrev);

  function toggleVaccine(id: string) {
    setVaccinations((prev) => {
      const existing = prev.find((v) => v.vaccineId === id);
      if (existing) {
        return prev.filter((v) => v.vaccineId !== id);
      }
      return [...prev, { vaccineId: id, completed: true }];
    });
  }

  function setDoseYear(id: string, year: string) {
    const y = parseInt(year, 10);
    setVaccinations((prev) =>
      prev.map((v) =>
        v.vaccineId === id
          ? { ...v, lastDoseYear: isNaN(y) ? undefined : y }
          : v
      )
    );
  }

  function isChecked(id: string) {
    return vaccinations.some((v) => v.vaccineId === id);
  }

  function getYear(id: string) {
    return vaccinations.find((v) => v.vaccineId === id)?.lastDoseYear?.toString() ?? "";
  }

  function renderVaccineRow(vac: { id: string; label: string }) {
    return (
      <div key={vac.id} className="flex items-center gap-3 py-2">
        <input
          type="checkbox"
          id={`vac-${vac.id}`}
          checked={isChecked(vac.id)}
          onChange={() => toggleVaccine(vac.id)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor={`vac-${vac.id}`} className="text-sm flex-1">
          {vac.label}
        </label>
        {isChecked(vac.id) && (
          <Input
            placeholder="År"
            value={getYear(vac.id)}
            onChange={(e) => setDoseYear(vac.id, e.target.value)}
            className="w-24 h-8 text-sm"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
          />
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vaksinasjonshistorikk</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Kryss av hvilke vaksiner pasienten har mottatt tidligere. Oppgi siste dose-år hvis kjent.
        </p>

        <div>
          <Label className="text-base">Grunnvaksiner</Label>
          <div className="mt-2 divide-y">
            {BASIC_VACCINES.map(renderVaccineRow)}
          </div>
        </div>

        <div>
          <Label className="text-base">Reisevaksiner</Label>
          <div className="mt-2 divide-y">
            {TRAVEL_VACCINES.map(renderVaccineRow)}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Tilbake
          </Button>
          <Button
            onClick={() => onNext({ previousVaccinations: vaccinations })}
            className="flex-1"
          >
            Neste: Oppsummering
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
