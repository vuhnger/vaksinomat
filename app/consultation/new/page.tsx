"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/consultation/wizard/StepIndicator";
import { Step1PatientInfo } from "@/components/consultation/wizard/Step1PatientInfo";
import { Step2TravelInfo } from "@/components/consultation/wizard/Step2TravelInfo";
import { Step3Exposure } from "@/components/consultation/wizard/Step3Exposure";
import { Step4VaccineHistory } from "@/components/consultation/wizard/Step4VaccineHistory";
import { Step5Summary } from "@/components/consultation/wizard/Step5Summary";
import { getCandidateVaccineIds } from "@/lib/data/client-candidates";
import { saveConsultationResult } from "@/lib/consultation-session";
import type { PatientData } from "@/lib/types";

const STEPS = [
  { number: 1, label: "Pasient" },
  { number: 2, label: "Reise" },
  { number: 3, label: "Eksponering" },
  { number: 4, label: "Historikk" },
  { number: 5, label: "Bekreft" },
];

export default function NewConsultationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<PatientData>>({
    allergies: [],
    destinations: [],
    previousVaccinations: [],
    isPregnant: false,
    isImmunocompromised: false,
    accommodationType: "hotel",
    localContact: "minimal",
  });
  const [candidateVaccineIds, setCandidateVaccineIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleStepData(data: Partial<PatientData>) {
    const updated = { ...formData, ...data };
    setFormData(updated);

    // Recompute candidates after step 2 (destinations) or step 3 (exposure) changes
    const nextStep = currentStep + 1;
    if (currentStep >= 2) {
      const destinations = updated.destinations ?? [];
      const accommodation = updated.accommodationType ?? "hotel";
      const contact = updated.localContact ?? "minimal";
      if (destinations.length > 0) {
        setCandidateVaccineIds(getCandidateVaccineIds(destinations, accommodation, contact));
      }
    }

    setCurrentStep(nextStep);
  }

  async function handleSubmit(data: Partial<PatientData>) {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const payload = { ...formData, ...data };
      setFormData(payload);

      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Kunne ikke opprette konsultasjon");
      }

      const { id, result } = await res.json();
      saveConsultationResult(id, result);
      router.push(`/consultation/${id}/result`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "En feil oppstod");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-lg">Vaksinomat</span>
            <span className="text-muted-foreground text-sm">– Dr. Dropin</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        {currentStep === 1 && (
          <Step1PatientInfo data={formData} onNext={handleStepData} />
        )}
        {currentStep === 2 && (
          <Step2TravelInfo
            data={formData}
            onNext={handleStepData}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3Exposure
            data={formData}
            onNext={handleStepData}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4VaccineHistory
            data={formData}
            onNext={handleStepData}
            onBack={() => setCurrentStep(3)}
            candidateVaccineIds={candidateVaccineIds}
          />
        )}
        {currentStep === 5 && (
          <Step5Summary
            data={formData}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(4)}
            isLoading={isLoading}
            candidateVaccineIds={candidateVaccineIds}
          />
        )}
      </main>
    </div>
  );
}
