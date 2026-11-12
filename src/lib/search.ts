export function readTokens(value: string | string[] | undefined) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map((item) => item.trim()).filter(Boolean);
}

export function searchHref(path: string, q: string, tokens: string[], scope: string) {
  const params = new URLSearchParams();
  for (const token of tokens) params.append("token", token);
  if (q.trim()) params.set("q", q.trim());
  if (scope && scope !== "all") params.set("scope", scope);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function searchFilterKey(q: string, tokens: string[], scope: string) {
  return JSON.stringify({ q: q.trim(), tokens, scope: scope || "all" });
}
