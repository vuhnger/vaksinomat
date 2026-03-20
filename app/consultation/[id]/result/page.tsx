import { notFound } from "next/navigation";
import { getConsultation } from "@/lib/audit/firestore-logger";
import { DoctorReviewBanner } from "@/components/consultation/result/DoctorReviewBanner";
import { VaccineCard } from "@/components/consultation/result/VaccineCard";
import { MalariaCard } from "@/components/consultation/result/MalariaCard";
import { CopyJournalButton } from "@/components/consultation/result/CopyJournalButton";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  params: { id: string };
}

export default async function ResultPage({ params }: Props) {
  const consultation = await getConsultation(params.id);

  if (!consultation || !consultation.result) {
    notFound();
  }

  const result = consultation.result;
  const departureFormatted = format(
    parseISO(result.patientData.departureDate),
    "d. MMMM yyyy",
    { locale: nb }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-lg">Vaksinomat</span>
          </div>
          <Link href="/consultation/new">
            <Button variant="outline" size="sm">
              Ny konsultasjon
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {result.requiresDoctorReview && (
          <DoctorReviewBanner
            flags={result.internkontrollFlags}
            aiNote={result.aiAdvisoryNote}
          />
        )}

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Anbefalingsplan</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Avreise: {departureFormatted}
            </p>
            <p className="text-muted-foreground text-sm">
              {result.patientData.destinations
                .map((d) => d.countryName)
                .join(" → ")}
            </p>
          </div>
          <CopyJournalButton result={result} />
        </div>

        {result.recommendations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Ingen vaksinasjoner anbefalt for dette reisemålet.</p>
          </div>
        ) : (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Anbefalte vaksiner</h2>
            {result.recommendations.map((rec) => (
              <VaccineCard key={rec.vaccineId} recommendation={rec} />
            ))}
          </section>
        )}

        {result.malariaRecommendation && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Malariaprofylakse</h2>
            <MalariaCard recommendation={result.malariaRecommendation} />
          </section>
        )}

        {result.contraindications.length > 0 && (
          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-red-700">
              Kontraindikasjoner
            </h2>
            <div className="space-y-2">
              {result.contraindications.map((ci, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
                >
                  <p className="font-medium">{ci.description}</p>
                  <p className="mt-1">Berørte vaksiner: {ci.affectedVaccineIds.join(", ")}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p>
            Denne anbefalingen er basert på FHIs reisemedisinretningslinjer og er et
            beslutningsstøtteverktøy. Sykepleier er ansvarlig for faglig vurdering.
          </p>
        </div>
      </main>
    </div>
  );
}
