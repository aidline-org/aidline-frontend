'use client';

import { useState } from 'react';

export function ShareReceipt({ title }: { title: string }) {
  const [label, setLabel] = useState('Share receipt');

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setLabel('Link copied');
      } else {
        setLabel('Copy the link from your address bar');
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setLabel('Could not share');
      }
    }
  }

  return (
    <button type="button" onClick={() => void share()} className="btn btn-secondary">
      {label}
    </button>
  );
}
