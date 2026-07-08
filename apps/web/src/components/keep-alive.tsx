'use client';

import { useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const INTERVAL = 5 * 60 * 1000;

export function KeepAlive() {
  const pingingRef = useRef(false);

  useEffect(() => {
    const ping = () => {
      if (pingingRef.current) return;
      pingingRef.current = true;
      fetch(`${API_URL}/products?limit=1`, { signal: AbortSignal.timeout(20000) })
        .catch(() => {})
        .finally(() => { pingingRef.current = false; });
    };

    const id = setInterval(ping, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return null;
}
