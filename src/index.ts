addEventListener("fetch", (event) => {
  event.respondWith(respondfetch(event.request));
});

async function respondfetch(request) {
  try {
    const url = new URL(request.url);
    const refererUrl = decodeURIComponent(url.searchParams.get("referer") || "");
    const targetUrl = decodeURIComponent(url.searchParams.get("url") || "");
    const originUrl = decodeURIComponent(url.searchParams.get("origin") || "");
    const proxyAll = decodeURIComponent(url.searchParams.get("all") || "");
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36';

    if (!targetUrl) {
      return new Response("Invalid URL", { status: 400 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Referer: refererUrl || "",
        Origin: originUrl || "",
        "User-Agent": userAgent,
      },
    });

    let modifiedM3u8;
    if (targetUrl.includes(".m3u8")) {
      modifiedM3u8 = await response.text();
      const targetUrlTrimmed = `${encodeURIComponent(
        targetUrl.replace(/([^/]+\.m3u8)$/, "").trim()
      )}`;
      const encodedUrl = encodeURIComponent(refererUrl);
      const encodedOrigin = encodeURIComponent(originUrl);
      modifiedM3u8 = modifiedM3u8.split("\n").map((line) => {
        if (line.startsWith("#") || line.trim() == '') {
          return line;
        }
        else if(proxyAll == 'yes' && line.startsWith('http')){ //https://yourproxy.com/?url=https://somevideo.m3u8&all=yes
          return `${url.origin}?url=${line}`;
        }
        return `?url=${targetUrlTrimmed}${line}${originUrl ? `&origin=${encodedOrigin}` : ""
      }${refererUrl ? `&referer=${encodedUrl}` : ""
          }`;
      }).join("\n");
    }

    return new Response(modifiedM3u8 || response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type":
          response.headers?.get("Content-Type") ||
          "application/vnd.apple.mpegurl",
      },
    });
  } catch (e) {
    return new Response(e.message, { status: 500 });
  }
}
