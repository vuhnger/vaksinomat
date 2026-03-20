"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientData, AllergyType } from "@/lib/types";

interface Step1Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
}

const ALLERGY_OPTIONS: { value: AllergyType; label: string }[] = [
  { value: "egg", label: "Egg" },
  { value: "gelatin", label: "Gelatin" },
  { value: "latex", label: "Latex" },
  { value: "neomycin", label: "Neomycin" },
  { value: "yeast", label: "Gjær" },
  { value: "other", label: "Annet" },
];

export function Step1PatientInfo({ data, onNext }: Step1Props) {
  const [birthYear, setBirthYear] = useState(data.birthYear?.toString() ?? "");
  const [isPregnant, setIsPregnant] = useState(data.isPregnant ?? false);
  const [isImmunocompromised, setIsImmunocompromised] = useState(
    data.isImmunocompromised ?? false
  );
  const [allergies, setAllergies] = useState<AllergyType[]>(data.allergies ?? []);
  const [error, setError] = useState("");

  function toggleAllergy(allergy: AllergyType) {
    setAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  }

  function handleNext() {
    const year = parseInt(birthYear, 10);
    if (!birthYear || isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setError("Oppgi et gyldig fødselsår.");
      return;
    }
    setError("");
    onNext({
      birthYear: year,
      isPregnant,
      isImmunocompromised,
      allergies,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pasientinformasjon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="birthYear">Fødselsår</Label>
          <Input
            id="birthYear"
            type="number"
            placeholder="f.eks. 1985"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            min="1900"
            max={new Date().getFullYear()}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="space-y-3">
          <Label>Helse</Label>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pregnant"
              checked={isPregnant}
              onChange={(e) => setIsPregnant(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="pregnant" className="text-sm">
              Pasient er gravid
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="immunocompromised"
              checked={isImmunocompromised}
              onChange={(e) => setIsImmunocompromised(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="immunocompromised" className="text-sm">
              Pasient er immunsupprimert
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Kjente allergier (valgfritt)</Label>
          <div className="grid grid-cols-2 gap-2">
            {ALLERGY_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`allergy-${option.value}`}
                  checked={allergies.includes(option.value)}
                  onChange={() => toggleAllergy(option.value)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`allergy-${option.value}`} className="text-sm">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleNext} className="w-full">
          Neste: Reiseinformasjon
        </Button>
      </CardContent>
    </Card>
  );
}
