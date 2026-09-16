/**
 * Minimal class joiner. Deliberately not `clsx` + `tailwind-merge` — this app
 * does not need another dependency for what is eight lines, and none of the
 * primitives rely on conflict resolution (variants own their own properties).
 */
export type ClassValue = string | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
