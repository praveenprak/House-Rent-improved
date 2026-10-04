import { API_ORIGIN } from "../api/axios";

// Cloudinary images are full https:// URLs. Older/local-dev uploads are stored
// as "/uploads/xyz.jpg" and are served by the backend, so prefix those.
export function imageUrl(src) {
  if (!src) return src;
  if (/^https?:\/\//i.test(src)) return src;
  return `${API_ORIGIN}${src}`;
}
