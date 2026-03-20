import type { Consultation, RecommendationResult, PatientData } from "@/lib/types";

// Lazy-initialize firebase-admin to avoid issues in client-side code
let db: FirebaseFirestore.Firestore | null = null;

async function getDb(): Promise<FirebaseFirestore.Firestore> {
  if (db) return db;

  const { initializeApp, getApps } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");

  if (getApps().length === 0) {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT;
    if (!projectId) {
      throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
    }
    initializeApp({ projectId });
    // settings() must be called before any Firestore operations and only once
    db = getFirestore();
    db.settings({ ignoreUndefinedProperties: true });
  } else {
    db = getFirestore();
  }

  return db;
}

export async function saveConsultation(
  id: string,
  patientData: PatientData,
  result: RecommendationResult,
  nurseId?: string
): Promise<void> {
  const firestore = await getDb();
  const now = new Date().toISOString();

  const consultation: Consultation = {
    id,
    patientData,
    result,
    status: result.requiresDoctorReview ? "pending_review" : "approved",
    requiresDoctorReview: result.requiresDoctorReview,
    nurseId,
    createdAt: now,
    updatedAt: now,
  };

  await firestore.collection("consultations").doc(id).set(consultation);
}

export async function updateConsultationResult(
  id: string,
  result: RecommendationResult
): Promise<void> {
  const firestore = await getDb();
  const now = new Date().toISOString();

  await firestore.collection("consultations").doc(id).update({
    result,
    requiresDoctorReview: result.requiresDoctorReview,
    status: result.requiresDoctorReview ? "pending_review" : "approved",
    updatedAt: now,
  });
}

export async function getConsultation(id: string): Promise<Consultation | null> {
  const firestore = await getDb();
  const doc = await firestore.collection("consultations").doc(id).get();

  if (!doc.exists) return null;
  return doc.data() as Consultation;
}

export async function updateConsultationStatus(
  id: string,
  status: "approved" | "rejected",
  doctorId: string,
  doctorNote?: string
): Promise<void> {
  const firestore = await getDb();
  const now = new Date().toISOString();

  await firestore.collection("consultations").doc(id).update({
    status,
    doctorId,
    doctorNote,
    updatedAt: now,
  });
}

export async function getPendingReviews(): Promise<Consultation[]> {
  const firestore = await getDb();
  const snapshot = await firestore
    .collection("consultations")
    .where("status", "==", "pending_review")
    .limit(50)
    .get();

  const results = snapshot.docs.map((doc) => doc.data() as Consultation);
  results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return results;
}
