import { useEffect } from 'react';

const META_NAME = 'google-site-verification';
const META_DATA_ATTR = 'data-frizerino-gsc';

export function SearchConsoleVerification() {
  useEffect(() => {
    const verificationToken = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;
    if (!verificationToken) return undefined;

    const existingMeta = document.querySelector(
      `meta[name="${META_NAME}"][${META_DATA_ATTR}="true"]`
    ) as HTMLMetaElement | null;

    const meta = existingMeta ?? document.createElement('meta');
    meta.setAttribute('name', META_NAME);
    meta.setAttribute('content', verificationToken);
    meta.setAttribute(META_DATA_ATTR, 'true');

    if (!existingMeta) {
      document.head.appendChild(meta);
    }

    return () => {
      if (meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, []);

  return null;
}
