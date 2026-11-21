export default async function handler(req, res) {
  const { term } = req.query;

  if (!term || !term.trim()) {
    return res.status(200).json({ results: [] });
  }

  try {
    const encoded = encodeURIComponent(term.trim());
    const [idRes, usRes] = await Promise.allSettled([
      fetch(
        `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=10`
      ),
      fetch(
        `https://itunes.apple.com/search?term=${encoded}&country=US&media=music&entity=song&limit=6`
      ),
    ]);

    const combinedRaw = [];

    if (idRes.status === "fulfilled" && idRes.value.ok) {
      const idJson = await idRes.value.json();
      combinedRaw.push(...(idJson.results || []));
    }

    if (usRes.status === "fulfilled" && usRes.value.ok) {
      const usJson = await usRes.value.json();
      combinedRaw.push(...(usJson.results || []));
    }

    const seen = new Set();
    const uniqueTracks = [];

    for (const item of combinedRaw) {
      const uniqueKey = `${item.trackName?.toLowerCase()}-${item.artistName?.toLowerCase()}`;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueTracks.push({
          trackId: item.trackId,
          trackName: item.trackName,
          artistName: item.artistName,
          coverUrl: item.artworkUrl100
            ? item.artworkUrl100.replace("100x100bb", "600x600bb")
            : "",
          songUrl: item.trackViewUrl,
          previewUrl: item.previewUrl || null,
        });
      }
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ results: uniqueTracks.slice(0, 12) });
  } catch (error) {
    console.error("Error API search-music:", error);
    return res.status(500).json({ error: "Gagal mengambil katalog lagu." });
  }
}