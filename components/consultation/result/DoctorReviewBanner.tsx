import { AlertTriangle } from "lucide-react";

interface DoctorReviewBannerProps {
  flags: string[];
  aiNote?: string;
}

const FLAG_LABELS: Record<string, string> = {
  pregnant_live_vaccine: "Gravid pasient – levende vaksiner kontraindisert",
  immunocompromised_live_vaccine: "Immunsupprimert – levende vaksiner kontraindisert",
  egg_allergy_yellow_fever: "Eggehviteallergi – Gulfeber kontraindisert",
  hiv_low_cd4: "HIV positiv med lav CD4-telling",
  absolute_contraindication: "Absolutt kontraindikasjon identifisert",
};

export function DoctorReviewBanner({ flags, aiNote }: DoctorReviewBannerProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-800 mb-1">
            Krever legegjennomgang
          </h3>
          <p className="text-sm text-red-700 mb-2">
            Denne saken er flagget for obligatorisk gjennomgang av lege.
          </p>
          <ul className="list-disc list-inside space-y-1">
            {flags.map((flag) => (
              <li key={flag} className="text-sm text-red-700">
                {FLAG_LABELS[flag] ?? flag}
              </li>
            ))}
          </ul>
          {aiNote && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-800">
              {aiNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
