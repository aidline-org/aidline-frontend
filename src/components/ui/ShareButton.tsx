'use client';

import { useState } from 'react';

export function ShareButton({
  title,
  text,
  url,
}: {
  title: string;
  text?: string;
  url?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Ignore user cancellation in Web Share API
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Ignore clipboard failures
      }
    }
  };

  return (
    <button type="button" onClick={() => void handleShare()} className="btn btn-primary">
      {copied ? 'Link copied to clipboard!' : 'Share receipt'}
    </button>
  );
}
