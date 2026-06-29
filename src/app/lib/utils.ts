import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { SectionLink } from '../components/util';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

export const toAbsolutePath = (input: string): string => {
  return `/${trimSlashes(input)}`;
};

export const normalizePathForMatch = (input: string): string => {
  const [pathname] = input.split(/[?#]/);
  return trimSlashes(pathname);
};

/**
 * Filters out null values
 * @param value
 * @returns
 */
export const filterOutNull = <T>(value: T): value is NonNullable<T> => value !== null;

/**
 * Whether a section has any side-nav content worth reserving the left column for. Mirrors what
 * `SideNav` actually renders: a subsection contributes only if it has a non-empty `menu` or is a
 * `dynamic` registry slot (filled client-side from the live entity lists). A section whose
 * subsections are all empty (e.g. a standalone page with no children) renders nothing, so the
 * caller drops the sidebar gutter and lets the content go full width.
 *
 * Lives here (not in `components/util`) so it is importable as a runtime value by client modules —
 * `components/util` pulls in server-only deps (`fs`, the docs backend) and must stay type-only there.
 */
export const hasRenderableNav = (section?: SectionLink | null): boolean =>
  !!section?.subSections?.some((sub) => (sub.menu && sub.menu.length > 0) || !!sub.dynamic);
