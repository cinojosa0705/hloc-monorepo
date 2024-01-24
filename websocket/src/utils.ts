import { StringSetMap } from "./types";

export function parseQueryString(query: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = query.split('&');

    for (const pair of pairs) {
        const [key, value] = pair.split('=');
        params[key] = value;
    }

    return params;
}

export function parseTableNames(tableNames: string[]): { Mpgs: StringSetMap, Assets: StringSetMap, Ticks: string[] } {
  const Mpgs = new Map<string, Set<string>>();
  const Assets = new Map<string, Set<string>>();
  const Ticks = new Set<string>();

  tableNames.forEach(tableName => {
    const parts = tableName.split('_');
    const mpgName = parts[0];
    const tickSize = parts.slice(-2).join('_');
    const productName = parts.slice(1, -2).join('_');

    if (!Mpgs.has(mpgName)) {
      Mpgs.set(mpgName, new Set());
    }
    Mpgs.get(mpgName)?.add(productName);

    if (!Assets.has(productName)) {
      Assets.set(productName, new Set());
    }
    Assets.get(productName)?.add(mpgName);

    Ticks.add(tickSize);
  });

  return {
    Mpgs,
    Assets,
    Ticks: Array.from(Ticks)
  };
}

export function StringMapToObject(StringMap: StringSetMap) {
    return Object.fromEntries(Array.from(StringMap).map(([key, value]) => [key, Array.from(value)]))
}