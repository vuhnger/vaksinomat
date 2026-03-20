import { format, parseISO } from "date-fns";
import nb from "date-fns/locale/nb";
import type { PatientData, RecommendationResult, VaccineRecommendation } from "@/lib/types";

function formatNorwegianDate(isoDate: string): string {
  return format(parseISO(isoDate), "d. MMMM yyyy", { locale: nb });
}

function getLevelText(level: string): string {
  switch (level) {
    case "required": return "PÅKREVD";
    case "strongly_recommended": return "STERKT ANBEFALT";
    case "recommended": return "ANBEFALT";
    case "consider": return "VURDER";
    default: return level.toUpperCase();
  }
}

function formatVaccineSection(rec: VaccineRecommendation): string {
  const lines: string[] = [];
  lines.push(`● ${rec.displayNameNo.toUpperCase()} – ${getLevelText(rec.level)}`);
  lines.push(`  Indikasjon: ${rec.reason}`);

  if (rec.scheduleVariant === "accelerated") {
    lines.push("  Skjema: Akselerert (pga. kort tid til avreise)");
  }

  for (const dose of rec.datedDoses) {
    const feasibleMark = dose.feasible ? "✓" : "⚠";
    const daysNote =
      dose.daysBeforeTravel >= 0
        ? `${dose.daysBeforeTravel} dager før avreise`
        : `${Math.abs(dose.daysBeforeTravel)} dager ETTER avreise`;
    lines.push(
      `  ${dose.label}: ${formatNorwegianDate(dose.targetDate)} ${feasibleMark} (${daysNote})`
    );
  }

  if (rec.certificateValidFrom) {
    lines.push(
      `  Gulfeberrsertifikat gyldig fra: ${formatNorwegianDate(rec.certificateValidFrom)}`
    );
  }

  if (rec.contraindications.length > 0) {
    lines.push("  ⛔ KONTRAINDIKASJONER:");
    for (const ci of rec.contraindications) {
      lines.push(`    - ${ci.description}`);
    }
  }

  return lines.join("\n");
}

export function formatJournalText(result: RecommendationResult): string {
  const { patientData: patient } = result;
  const today = format(new Date(), "d. MMMM yyyy", { locale: nb });
  const departureFormatted = formatNorwegianDate(patient.departureDate);
  const returnFormatted = formatNorwegianDate(patient.returnDate);

  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════");
  lines.push(`REISEVAKSINASJONSKONSULTASJON – ${today.toUpperCase()}`);
  lines.push("═══════════════════════════════════════════════════════");
  lines.push("");

  // Patient info
  lines.push("PASIENTINFORMASJON:");
  lines.push(`  Fødselsår: ${patient.birthYear}`);
  lines.push(`  Gravid: ${patient.isPregnant ? "Ja" : "Nei"}`);
  lines.push(`  Immunsupprimert: ${patient.isImmunocompromised ? "Ja" : "Nei"}`);
  if (patient.allergies.length > 0) {
    lines.push(`  Allergier: ${patient.allergies.join(", ")}`);
  }
  lines.push("");

  // Travel info
  lines.push("REISEINFORMASJON:");
  const primaryDest = patient.destinations.find((d) => !d.isLayover);
  const layovers = patient.destinations.filter((d) => d.isLayover);
  if (primaryDest) {
    lines.push(`  Primærdestinasjon: ${primaryDest.countryName}`);
  }
  if (layovers.length > 0) {
    lines.push(`  Mellomlandinger: ${layovers.map((l) => l.countryName).join(", ")}`);
  }
  lines.push(`  Avreise: ${departureFormatted}`);
  lines.push(`  Retur: ${returnFormatted}`);
  lines.push(
    `  Boform: ${patient.accommodationType === "hotel" ? "Standard hotell" : "Lokal/landsbyovernatting"}`
  );
  lines.push(
    `  Lokalkontakt: ${patient.localContact === "minimal" ? "Minimal" : "Tett og langvarig"}`
  );
  lines.push("");

  // Internkontroll
  if (result.requiresDoctorReview) {
    lines.push("⚠️  INTERNKONTROLL: KREVER LEGEGJENNOMGANG");
    for (const flag of result.internkontrollFlags) {
      lines.push(`   Flagg: ${flag}`);
    }
    lines.push("");
  }

  // Recommendations
  lines.push("ANBEFALTE VAKSINER:");
  lines.push("─────────────────────────────────────────────────────");
  if (result.recommendations.length === 0) {
    lines.push("  Ingen vaksinasjoner anbefalt for dette reisemålet.");
  } else {
    for (const rec of result.recommendations) {
      lines.push(formatVaccineSection(rec));
      lines.push("");
    }
  }

  // Malaria
  if (result.malariaRecommendation) {
    lines.push("MALARIAPROFYLAKSE:");
    lines.push("─────────────────────────────────────────────────────");
    lines.push(
      `  ${result.malariaRecommendation.displayNameNo}`
    );
    lines.push(
      `  Start: ${formatNorwegianDate(result.malariaRecommendation.startDate)}`
    );
    lines.push(
      `  Slutt: ${formatNorwegianDate(result.malariaRecommendation.stopDate)}`
    );
    lines.push(`  Begrunnelse: ${result.malariaRecommendation.reason}`);
    lines.push("");
  }

  // Contraindications
  if (result.contraindications.length > 0) {
    lines.push("KONTRAINDIKASJONER:");
    lines.push("─────────────────────────────────────────────────────");
    for (const ci of result.contraindications) {
      lines.push(`  ⛔ ${ci.description}`);
      lines.push(
        `     Berørte vaksiner: ${ci.affectedVaccineIds.join(", ")}`
      );
    }
    lines.push("");
  }

  lines.push("─────────────────────────────────────────────────────");
  lines.push(
    `Generert av Vaksinomat (Dr. Dropin) – ${today}`
  );
  lines.push(
    "OBS: Denne vurderingen er basert på FHIs retningslinjer og er ment som et beslutningsstøtteverktøy."
  );

  return lines.join("\n");
}
