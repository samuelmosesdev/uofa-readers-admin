/** Free vs Pro limits for UofA Readers */
export const FREE_LIMITS = {
  maxCourses: 5,
  practiceQuestions: 15,
  documentsPerCourse: 1,
  timedQuiz: false,
};

export const PRO_FEATURES = [
  "Unlimited courses across all faculties",
  "Full practice banks — no 15-question cap",
  "Timed exam-mode quizzes",
  "All documents & materials per course",
  "Priority access to new CBT sets",
  "Progress insights & weak-topic focus",
];

export const FREE_FEATURES = [
  "Up to 5 courses (your department only)",
  "Practice sets capped at 15 questions",
  "1 document per course",
  "Untimed practice only",
];

export function isPro(profile) {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "agent") return true;
  const plan = (profile.plan || profile.subscription || "free").toLowerCase();
  if (plan === "pro" || plan === "paid" || plan === "premium") return true;
  if (profile.subscriptionExpiresAt?.toDate) {
    return profile.subscriptionExpiresAt.toDate() > new Date();
  }
  if (profile.subscriptionExpiresAt instanceof Date) {
    return profile.subscriptionExpiresAt > new Date();
  }
  return false;
}

export function planLabel(profile) {
  return isPro(profile) ? "Pro" : "Free";
}