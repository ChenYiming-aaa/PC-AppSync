import { useState, useEffect, useRef } from 'react';
import { queueIconLoad } from '../api/scanner';
import type { Application } from '../types';
import { getAppIconUrl } from './categorize';

interface IconMap {
  [appName: string]: string | null;
}

export function useAppIcons(apps: Application[]): IconMap {
  const [icons, setIcons] = useState<IconMap>({});
  const loaded = useRef<Set<string>>(new Set());

  useEffect(() => {
    const toLoad = apps.filter(a => {
      if (loaded.current.has(a.name)) return false;
      // Skip if CDN has an icon (fast, no extraction needed)
      if (getAppIconUrl(a.name)) return false;
      return true;
    });
    if (toLoad.length === 0) return;

    toLoad.forEach(a => loaded.current.add(a.name));

    let cancelled = false;
    (async () => {
      for (const app of toLoad) {
        if (cancelled) break;
        const b64 = await queueIconLoad(app);
        if (!cancelled && b64) {
          setIcons(prev => ({ ...prev, [app.name]: b64 }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [apps]);

  return icons;
}
