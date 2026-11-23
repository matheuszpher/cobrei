import { useCallback, useEffect, useState } from 'react';
import { api, erroMsg } from './api';

export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let ativo = true;
    setLoading(true);
    setError(null);
    api
      .get<T>(path)
      .then((d) => ativo && setData(d))
      .catch((e) => ativo && setError(erroMsg(e)))
      .finally(() => ativo && setLoading(false));
    return () => {
      ativo = false;
    };
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload, setData };
}
