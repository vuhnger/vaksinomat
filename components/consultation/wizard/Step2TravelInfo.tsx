"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus } from "lucide-react";
import type { PatientData, Destination } from "@/lib/types";

interface Country {
  code: string;
  nameNo: string;
}

interface Step2Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
  onBack: () => void;
}

export function Step2TravelInfo({ data, onNext, onBack }: Step2Props) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [primarySearch, setPrimarySearch] = useState("");
  const [primaryCountry, setPrimaryCountry] = useState<Country | null>(null);
  const [layovers, setLayovers] = useState<Destination[]>(
    data.destinations?.filter((d) => d.isLayover) ?? []
  );
  const [layoverSearch, setLayoverSearch] = useState("");
  const [departureDate, setDepartureDate] = useState(data.departureDate ?? "");
  const [returnDate, setReturnDate] = useState(data.returnDate ?? "");
  const [showPrimaryDropdown, setShowPrimaryDropdown] = useState(false);
  const [showLayoverDropdown, setShowLayoverDropdown] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/countries?q=" + encodeURIComponent(primarySearch))
      .then((r) => r.json())
      .then(setCountries)
      .catch(console.error);
  }, [primarySearch]);

  const filteredLayoverCountries = countries.filter(
    (c) => c.nameNo.toLowerCase().includes(layoverSearch.toLowerCase())
  );

  function addLayover(country: Country) {
    if (layovers.some((l) => l.countryCode === country.code)) return;
    setLayovers((prev) => [
      ...prev,
      { countryCode: country.code, countryName: country.nameNo, isLayover: true },
    ]);
    setLayoverSearch("");
    setShowLayoverDropdown(false);
  }

  function removeLayover(code: string) {
    setLayovers((prev) => prev.filter((l) => l.countryCode !== code));
  }

  function handleNext() {
    if (!primaryCountry) {
      setError("Velg primærdestinasjon.");
      return;
    }
    if (!departureDate) {
      setError("Oppgi avreisedato.");
      return;
    }
    if (!returnDate) {
      setError("Oppgi returdato.");
      return;
    }
    if (new Date(returnDate) <= new Date(departureDate)) {
      setError("Returdato må være etter avreisedato.");
      return;
    }
    setError("");

    const destinations: Destination[] = [
      { countryCode: primaryCountry.code, countryName: primaryCountry.nameNo, isLayover: false },
      ...layovers,
    ];

    onNext({ destinations, departureDate, returnDate });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reiseinformasjon</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary destination */}
        <div className="space-y-2 relative">
          <Label>Primærdestinasjon</Label>
          <Input
            placeholder="Søk etter land..."
            value={primaryCountry ? primaryCountry.nameNo : primarySearch}
            onChange={(e) => {
              setPrimarySearch(e.target.value);
              setPrimaryCountry(null);
              setShowPrimaryDropdown(true);
            }}
            onFocus={() => setShowPrimaryDropdown(true)}
          />
          {showPrimaryDropdown && primarySearch && !primaryCountry && (
            <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {countries.slice(0, 10).map((c) => (
                <button
                  key={c.code}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                  onClick={() => {
                    setPrimaryCountry(c);
                    setShowPrimaryDropdown(false);
                  }}
                >
                  {c.nameNo}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layovers */}
        <div className="space-y-2">
          <Label>Mellomlandinger (valgfritt)</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {layovers.map((l) => (
              <span
                key={l.countryCode}
                className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
              >
                {l.countryName}
                <button onClick={() => removeLayover(l.countryCode)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <Input
              placeholder="Legg til mellomlanding..."
              value={layoverSearch}
              onChange={(e) => {
                setLayoverSearch(e.target.value);
                setShowLayoverDropdown(true);
              }}
              onFocus={() => setShowLayoverDropdown(true)}
            />
            {showLayoverDropdown && layoverSearch && (
              <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredLayoverCountries.slice(0, 10).map((c) => (
                  <button
                    key={c.code}
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => addLayover(c)}
                  >
                    {c.nameNo}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departure">Avreisedato</Label>
            <Input
              id="departure"
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="return">Returdato</Label>
            <Input
              id="return"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Tilbake
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Neste: Eksponeringsprofil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
