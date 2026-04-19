/**
 * tutorImage.ts
 * Shared helper to resolve a tutor's display image.
 *
 * Priority:
 *  1. user.avatar   — stored as a full URL (e.g. http://localhost:8000/storage/...)
 *  2. user.avatar_url — computed accessor, same value
 *  3. tutor.avatar / tutor.avatar_url — some endpoints put it directly on the tutor object
 *  4. ui-avatars.com fallback — deterministic per teacher name, navy background
 */
export function tutorImgSrc(
  userOrTutor: Record<string, unknown> | null | undefined,
  name?: string,
): string {
  if (!userOrTutor) return uiAvatar(name);

  // Most common: stored directly on the user sub-object or the tutor object
  const src =
    (userOrTutor.avatar as string) ||
    (userOrTutor.avatar_url as string) ||
    ((userOrTutor.user as Record<string, unknown>)?.avatar as string) ||
    ((userOrTutor.user as Record<string, unknown>)?.avatar_url as string);

  if (src && src.startsWith('http')) return src;
  if (src) {
    // Relative path — prepend backend base
    const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';
    return `${base}/storage/${src.replace(/^\/?(storage\/)?/, '')}`;
  }

  return uiAvatar(name || (userOrTutor.name as string) || '');
}

function uiAvatar(name = '') {
  const n = encodeURIComponent(name || 'T');
  return `https://ui-avatars.com/api/?name=${n}&size=400&background=1B4965&color=fff&bold=true&format=svg`;
}
