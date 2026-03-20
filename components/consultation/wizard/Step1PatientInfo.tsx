"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientData } from "@/lib/types";

interface Step1Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
}

export function Step1PatientInfo({ data, onNext }: Step1Props) {
  const [birthYear, setBirthYear] = useState(data.birthYear?.toString() ?? "");
  const [isPregnant, setIsPregnant] = useState(data.isPregnant ?? false);
  const [isImmunocompromised, setIsImmunocompromised] = useState(
    data.isImmunocompromised ?? false
  );
  const [error, setError] = useState("");

  function handleNext() {
    const year = parseInt(birthYear, 10);
    if (!birthYear || isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setError("Oppgi et gyldig fødselsår.");
      return;
    }
    setError("");
    onNext({ birthYear: year, isPregnant, isImmunocompromised });
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

        <Button onClick={handleNext} className="w-full">
          Neste: Reiseinformasjon
        </Button>
      </CardContent>
    </Card>
  );
}
