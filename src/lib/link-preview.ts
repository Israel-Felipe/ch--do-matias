function absoluteUrl(candidate: string, pageUrl: string): string | null {
  try {
    return new URL(candidate, pageUrl).toString();
  } catch {
    return null;
  }
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

async function fetchOgImage(pageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(pageUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;

    const html = (await res.text()).slice(0, 300_000);
    const finalUrl = res.url || pageUrl;
    const candidates = [
      extractMetaContent(html, "og:image"),
      extractMetaContent(html, "og:image:secure_url"),
      extractMetaContent(html, "og:image:url"),
      extractMetaContent(html, "twitter:image"),
      extractMetaContent(html, "twitter:image:src"),
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const absolute = absoluteUrl(candidate, finalUrl);
      if (absolute?.startsWith("http")) return absolute;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchMicrolinkImage(pageUrl: string): Promise<string | null> {
  try {
    const endpoint = new URL("https://api.microlink.io");
    endpoint.searchParams.set("url", pageUrl);
    endpoint.searchParams.set("palette", "false");
    endpoint.searchParams.set("audio", "false");
    endpoint.searchParams.set("video", "false");
    endpoint.searchParams.set("iframe", "false");

    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      data?: { image?: { url?: string } | string | null };
    };
    if (data.status !== "success") return null;
    const image = data.data?.image;
    if (!image) return null;
    if (typeof image === "string") return image;
    return image.url || null;
  } catch {
    return null;
  }
}

/** Busca imagem de preview de um link (og:image / microlink), como no WhatsApp. */
export async function resolveLinkImage(rawUrl: string): Promise<string | null> {
  let pageUrl: string;
  try {
    pageUrl = new URL(rawUrl.trim()).toString();
  } catch {
    return null;
  }

  return (await fetchOgImage(pageUrl)) || (await fetchMicrolinkImage(pageUrl));
}
