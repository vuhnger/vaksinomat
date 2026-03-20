import { getPendingReviews } from "@/lib/audit/firestore-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { nb } from "date-fns/locale";
import type { Consultation } from "@/lib/types";

function formatDate(isoStr: string): string {
  return format(parseISO(isoStr), "d. MMM yyyy HH:mm", { locale: nb });
}

function getFlagLabel(flag: string): string {
  const labels: Record<string, string> = {
    pregnant_live_vaccine: "Gravid",
    immunocompromised_live_vaccine: "Immunsupprimert",
    egg_allergy_yellow_fever: "Eggehviteallergi",
    hiv_low_cd4: "HIV/lav CD4",
    absolute_contraindication: "Absolutt KI",
  };
  return labels[flag] ?? flag;
}

function ConsultationRow({ consultation }: { consultation: Consultation }) {
  const result = consultation.result;
  const patient = consultation.patientData;
  const primary = patient.destinations.find((d) => !d.isLayover);

  return (
    <Card className="mb-3">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">
              {primary?.countryName ?? "Ukjent destinasjon"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Opprettet: {formatDate(consultation.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              Avreise: {patient.departureDate}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="warning">Venter</Badge>
            {result?.internkontrollFlags.map((flag) => (
              <Badge key={flag} variant="destructive" className="text-xs">
                {getFlagLabel(flag)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <a
            href={`/consultation/${consultation.id}/result`}
            className="text-xs text-blue-600 underline"
          >
            Se anbefalingsplan
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminPage() {
  let pending: Consultation[] = [];

  try {
    pending = await getPendingReviews();
  } catch {
    // Firestore may not be configured in all environments
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="font-semibold text-lg">Vaksinomat</span>
            <span className="text-muted-foreground text-sm">– Legepanel</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gjennomgangskø</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Flaggede saker som krever legegjennomgang
            </p>
          </div>
          <Badge variant={pending.length > 0 ? "destructive" : "secondary"}>
            {pending.length} venter
          </Badge>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Ingen saker venter gjennomgang.</p>
          </div>
        ) : (
          <div>
            {pending.map((c) => (
              <ConsultationRow key={c.id} consultation={c} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
