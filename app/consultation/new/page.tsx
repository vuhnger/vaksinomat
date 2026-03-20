"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/consultation/wizard/StepIndicator";
import { Step1PatientInfo } from "@/components/consultation/wizard/Step1PatientInfo";
import { Step2TravelInfo } from "@/components/consultation/wizard/Step2TravelInfo";
import { Step3Exposure } from "@/components/consultation/wizard/Step3Exposure";
import { Step4VaccineHistory } from "@/components/consultation/wizard/Step4VaccineHistory";
import { Step5Summary } from "@/components/consultation/wizard/Step5Summary";
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
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function handleStepData(data: Partial<PatientData>) {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep((s) => s + 1);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMsg("");
    try {
      // Create consultation
      const createRes = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error ?? "Kunne ikke opprette konsultasjon");
      }

      const { id } = await createRes.json();

      // Run recommendation engine
      const recRes = await fetch(`/api/consultation/${id}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dynamicAnswers: {} }),
      });

      if (!recRes.ok) {
        throw new Error("Kunne ikke generere anbefaling");
      }

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
          <Step1PatientInfo
            data={formData}
            onNext={handleStepData}
          />
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
          />
        )}
        {currentStep === 5 && (
          <Step5Summary
            data={formData}
            onSubmit={handleSubmit}
            onBack={() => setCurrentStep(4)}
            isLoading={isLoading}
          />
        )}
      </main>
    </div>
  );
}
