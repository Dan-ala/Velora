import { useState, useCallback } from 'react';

export function useSingleClick() {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, execute };
}
