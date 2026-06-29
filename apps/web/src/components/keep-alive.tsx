'use client';

import { useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const INTERVAL = 10 * 60 * 1000;

export function KeepAlive() {
  useEffect(() => {
    const ping = () => {
      fetch(`${API_URL}/products?limit=1`, { signal: AbortSignal.timeout(10000) }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, INTERVAL);
    return () => clearInterval(id);
  }, []);

  return null;
}
