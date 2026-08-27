import { useEffect } from 'react';

/** Force a real HTML file. Never render the SPA Legal shell as the legal pack. */
export function StaticLegalRedirect({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);
  return (
    <p className="p-8 text-sm text-gray-600">
      Opening the legal document… If it does not load, use <a className="underline" href={href}>{href}</a>.
    </p>
  );
}
