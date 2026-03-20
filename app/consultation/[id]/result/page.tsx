import { notFound } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import { ArrowDown, CalendarDays, MapPinned, ShieldCheck, Stethoscope } from "lucide-react";
import { getConsultation } from "@/lib/audit/firestore-logger";
import { DoctorReviewBanner } from "@/components/consultation/result/DoctorReviewBanner";
import { VaccineCard } from "@/components/consultation/result/VaccineCard";
import { MalariaCard } from "@/components/consultation/result/MalariaCard";
import { CopyJournalButton } from "@/components/consultation/result/CopyJournalButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getVaccines } from "@/lib/data/loader";

function getHumanReadableVaccineName(vaccineNameMap: Record<string, string>, vaccineId: string): string {
  return vaccineNameMap[vaccineId] ?? "Ukjent vaksine";
}

interface Props {
  params: { id: string };
}

export default async function ResultPage({ params }: Props) {
  const consultation = await getConsultation(params.id);

  if (!consultation || !consultation.result) {
    notFound();
  }

  const result = consultation.result;
  const vaccineNameMap = Object.fromEntries(getVaccines().map((v) => [v.id, v.displayNameNo]));
  const departureFormatted = format(parseISO(result.patientData.departureDate), "d. MMMM yyyy", {
    locale: nb,
  });
  const destinations = result.patientData.destinations.map((d) => d.countryName).join(" -> ");
  const roadmapCount = result.recommendations.length + (result.malariaRecommendation ? 1 : 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef6ff_40%,#f8fafc_100%)]">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <span className="text-sm font-bold">V</span>
            </div>
            <div>
              <p className="font-semibold text-lg">Vaksinomat</p>
              <p className="text-sm text-muted-foreground">Reiseplan for vaksinering</p>
            </div>
          </div>
          <Link href="/consultation/new">
            <Button variant="outline" size="sm">
              Ny konsultasjon
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:py-10">
        {result.requiresDoctorReview && (
          <DoctorReviewBanner flags={result.internkontrollFlags} aiNote={result.aiAdvisoryNote} />
        )}

        <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
          <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#ffffff_45%,#ffffff_100%)] shadow-sm">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Anbefalingsplan</p>
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Her er et tydelig løp frem mot avreise
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Planen under viser hvilke tiltak som bør gjøres, i hvilken rekkefølge, og når de bør tas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-800">
                    <CalendarDays className="h-4 w-4" />
                    Avreise
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{departureFormatted}</p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-800">
                    <MapPinned className="h-4 w-4" />
                    Reise
                  </div>
                  <p className="text-sm font-medium leading-6">{destinations}</p>
                </div>
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-800">
                    <ShieldCheck className="h-4 w-4" />
                    Tiltak
                  </div>
                  <p className="text-lg font-semibold tracking-tight">{roadmapCount}</p>
                  <p className="text-sm text-muted-foreground">punkter i planen</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <Card className="border border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Journalnotat</p>
                  <p className="text-sm text-muted-foreground">Kopier planen direkte til journalen</p>
                </div>
                <CopyJournalButton result={result} />
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Stethoscope className="h-4 w-4" />
                  Klinisk oppfølging
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  Planen er basert på FHIs reisemedisinske anbefalinger. Endelig vurdering gjøres i konsultasjonen.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Roadmap</h2>
            <p className="text-sm text-muted-foreground">
              Følg planen nedenfor fra topp til bunn. Hvert kort viser neste steg og datoer i tydelig rekkefølge.
            </p>
          </div>

          {roadmapCount === 0 ? (
            <Card className="border border-slate-200 bg-white/90 shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-lg">Ingen vaksiner eller profylakse er aktuelle for dette reisemålet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {result.recommendations.map((rec, index) => (
                <div key={rec.vaccineId} className="space-y-4">
                  <VaccineCard recommendation={rec} />
                  {index < result.recommendations.length - 1 && (
                    <div className="flex justify-center text-slate-400">
                      <ArrowDown className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}

              {result.malariaRecommendation && result.recommendations.length > 0 && (
                <div className="flex justify-center text-slate-400">
                  <ArrowDown className="h-6 w-6" />
                </div>
              )}

              {result.malariaRecommendation && <MalariaCard recommendation={result.malariaRecommendation} />}
            </div>
          )}
        </section>

        {result.contraindications.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-red-800">Viktige hensyn</h2>
            <div className="grid gap-3">
              {result.contraindications.map((ci, idx) => (
                <Card key={idx} className="border border-red-200 bg-red-50 shadow-sm">
                  <CardContent className="space-y-2 p-4 text-sm text-red-900">
                    <p className="font-medium">{ci.description}</p>
                    <p>
                      Berørte vaksiner: {ci.affectedVaccineIds.map((id) => getHumanReadableVaccineName(vaccineNameMap, id)).join(", ")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
