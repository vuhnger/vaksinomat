"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PatientData, AccommodationType, LocalContactType } from "@/lib/types";
import { Hotel, Home, Users, UserCheck } from "lucide-react";

interface Step3Props {
  data: Partial<PatientData>;
  onNext: (data: Partial<PatientData>) => void;
  onBack: () => void;
}

export function Step3Exposure({ data, onNext, onBack }: Step3Props) {
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(
    data.accommodationType ?? "hotel"
  );
  const [localContact, setLocalContact] = useState<LocalContactType>(
    data.localContact ?? "minimal"
  );

  function handleNext() {
    onNext({ accommodationType, localContact });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eksponeringsprofil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Boform under reisen</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccommodationType("hotel")}
              className={cn(
                "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                accommodationType === "hotel"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Hotel className="w-6 h-6" />
              <span className="text-sm font-medium">Standard hotell</span>
              <span className="text-xs text-muted-foreground text-center">
                God standard, hygienisk mat
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAccommodationType("local")}
              className={cn(
                "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                accommodationType === "local"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Home className="w-6 h-6" />
              <span className="text-sm font-medium">Lokal overnatting</span>
              <span className="text-xs text-muted-foreground text-center">
                Landsbyovernatting, lokalt miljø
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Kontakt med lokalbefolkning</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLocalContact("minimal")}
              className={cn(
                "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                localContact === "minimal"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-sm font-medium">Minimal</span>
              <span className="text-xs text-muted-foreground text-center">
                Typisk turistkontakt
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLocalContact("extensive")}
              className={cn(
                "p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors",
                localContact === "extensive"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm font-medium">Tett og langvarig</span>
              <span className="text-xs text-muted-foreground text-center">
                Humanitært arbeid, feltarbeid
              </span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Tilbake
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Neste: Vaksinasjonshistorikk
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
