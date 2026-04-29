// V1.2 — Defensive helper for SQLite write paths.
//
// expo-sqlite surfaces native errors through the React Native bridge in a few
// shapes:
//   • plain { message: "Error code : FOREIGN KEY constraint failed" }
//   • wrapped { message: "Call to function ... rejected.", cause: { message: ... } }
//   • bridge-stringified message that concatenates outer + cause with "→ Caused by:"
//
// `isForeignKeyError` checks every plausible surface (message, cause.message,
// toString, stack) so the check works regardless of which shape the bridge
// emits today. Used by repository writes that may race with profile deletion.

export const isForeignKeyError = (e) => {
  if (!e) return false;
  const surfaces = [
    typeof e === 'string' ? e : '',
    e?.message,
    e?.cause?.message,
    typeof e?.toString === 'function' ? e.toString() : '',
    e?.stack,
  ].filter(Boolean);
  const combined = surfaces.join(' | ');
  return /FOREIGN KEY|foreign key|SQLITE_CONSTRAINT/i.test(combined);
};
