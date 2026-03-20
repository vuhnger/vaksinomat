import { GoogleGenerativeAI } from "@google/generative-ai";
import type { RecommendationResult } from "@/lib/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateAdvisoryNote(
  result: RecommendationResult
): Promise<string> {
  const { patientData: patient, recommendations, contraindications, malariaRecommendation } = result;

  const prompt = `
Du er et medisinsk beslutningsstøttesystem for Dr. Dropin.
Gi en kort, faglig rådgivende merknad (maks 3 setninger) for sykepleieren basert på denne reisevaksinasjonskonsultasjonen.
VIKTIG: Du er KUN rådgivende. Alle anbefalinger er allerede regelbasert generert.

Pasient: Fødselsår ${patient.birthYear}, ${patient.isPregnant ? "gravid" : "ikke gravid"}, ${patient.isImmunocompromised ? "immunsupprimert" : "ikke immunsupprimert"}
Destinasjoner: ${patient.destinations.map((d) => d.countryName).join(", ")}
Avreise: ${patient.departureDate}, Retur: ${patient.returnDate}
Boform: ${patient.accommodationType}, Lokalkontakt: ${patient.localContact}

Anbefalte vaksiner: ${recommendations.map((r) => `${r.displayNameNo} (${r.level})`).join(", ") || "Ingen"}
${malariaRecommendation ? `Malariaprofylakse: ${malariaRecommendation.displayNameNo}` : ""}
${contraindications.length > 0 ? `Kontraindikasjoner: ${contraindications.map((c) => c.description).join("; ")}` : ""}
${result.requiresDoctorReview ? "OBS: Saken krever legegjennomgang." : ""}

Gi en kort norsk rådgivende merknad:
  `.trim();

  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
  const response = await model.generateContent(prompt);
  return response.response.text();
}
