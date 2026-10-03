'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { shortAddress } from '@/lib/format';

import { useWallet } from './WalletProvider';

export function WalletButton() {
  const { state, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  if (state.status === 'loading') {
    return <span className="btn btn-secondary w-[9.5rem] opacity-40" aria-hidden="true" />;
  }

  if (state.status === 'missing') {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer"
        className="btn btn-secondary"
      >
        Install Freighter
      </a>
    );
  }

  if (state.status === 'disconnected') {
    return (
      <button type="button" className="btn btn-primary" onClick={() => void connect()}>
        Connect wallet
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="btn btn-secondary figure gap-2 text-sm"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {state.wrongNetwork && <span className="h-2 w-2 bg-danger" aria-label="Wrong network" />}
        {shortAddress(state.address, 5)}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-60 border border-rule bg-paper-raised py-2 text-sm">
          {state.wrongNetwork && (
            <p className="border-b border-rule px-4 pb-2 text-danger">
              Freighter is on another network. Switch it to testnet.
            </p>
          )}
          <Link
            href={`/donors/${state.address}`}
            className="block px-4 py-2 text-ink hover:bg-paper-sunk"
            onClick={() => setOpen(false)}
          >
            My giving
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-ink hover:bg-paper-sunk"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
