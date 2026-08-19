/** Canonical roles for UofA Readers */

export const ROLES = {
  ADMIN: "admin",
  ALPHA: "alphaAgent",
  AGENT: "agent",
  COURSE_REP: "courseRep",
  USER: "user",
};

export const ROLE_LABELS = {
  admin: "Admin",
  alphaAgent: "Alpha Agent (Master)",
  agent: "Agent",
  courseRep: "Course Rep",
  user: "Student",
};

/** Roles an Admin may assign */
export const ADMIN_ASSIGNABLE = [
  "user",
  "courseRep",
  "agent",
  "alphaAgent",
  "admin",
];

/** Roles an Alpha Agent may assign (never admin) */
export const ALPHA_ASSIGNABLE = ["user", "courseRep", "agent"];

export function roleOf(profile) {
  return profile?.role || "user";
}

export function isAdmin(profile) {
  return roleOf(profile) === ROLES.ADMIN;
}

export function isAlpha(profile) {
  return roleOf(profile) === ROLES.ALPHA;
}

export function isAgent(profile) {
  return roleOf(profile) === ROLES.AGENT;
}

export function isCourseRep(profile) {
  return roleOf(profile) === ROLES.COURSE_REP;
}

export function isStaff(profile) {
  const r = roleOf(profile);
  return r === ROLES.ADMIN || r === ROLES.ALPHA || r === ROLES.AGENT;
}

/** Can approve requests */
export function canApprove(profile) {
  return isAdmin(profile) || isAlpha(profile);
}

/** Can send platform announcements */
export function canAnnounce(profile) {
  return isAdmin(profile) || isAlpha(profile);
}

/** Dashboard path after login */
export function homePathFor(profile) {
  const r = roleOf(profile);
  if (r === ROLES.ADMIN) return "/admin";
  if (r === ROLES.ALPHA || r === ROLES.AGENT) return "/agent";
  return "/dashboard";
}

/**
 * ProtectedRoute-style check.
 * requiredRole: single role or array. Special:
 *  - "staff" => admin | alpha | agent
 *  - "approver" => admin | alpha
 *  - "user" => student side including courseRep
 */
export function matchesRequiredRole(profile, requiredRole) {
  if (!requiredRole) return true;
  const r = roleOf(profile);
  if (Array.isArray(requiredRole)) return requiredRole.includes(r);
  if (requiredRole === "staff") return isStaff(profile);
  if (requiredRole === "approver") return canApprove(profile);
  if (requiredRole === "user") return r === "user" || r === "courseRep";
  if (requiredRole === "agent") return r === "agent" || r === "alphaAgent";
  return r === requiredRole;
}