import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import https from "https";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Stream proxy endpoint
  app.get("/api/proxy/stream", async (req, res) => {
    const targetUrl = req.query.url as string;
    const referer = req.query.referer as string;

    if (!targetUrl) {
      return res.status(400).send("Missing url parameter");
    }

    try {
      const urlObj = new URL(targetUrl);
      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          ...(referer && { "Referer": referer }),
          "Origin": referer ? new URL(referer).origin : undefined,
          "Accept": "*/*"
        }
      };

      const protocol = urlObj.protocol === "https:" ? https : http;
      
      const proxyReq = protocol.get(targetUrl, options, (proxyRes) => {
        // Handle chunked/m3u8 files
        const contentType = proxyRes.headers["content-type"] || "";
        const isM3u8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl");

        if (isM3u8) {
          let body = "";
          proxyRes.on("data", (chunk) => { body += chunk; });
          proxyRes.on("end", () => {
            const lines = body.split("\n");
            const rewrittenLines = lines.map(line => {
              line = line.trim();
              if (line && !line.startsWith("#")) {
                // It's a URI
                let absoluteUri = line;
                if (!line.startsWith("http")) {
                  // Resolve relative URL
                  absoluteUri = new URL(line, targetUrl).toString();
                }
                return `/api/proxy/stream?url=${encodeURIComponent(absoluteUri)}&referer=${encodeURIComponent(referer || "")}`;
              }
              // Also check for URI="..." in #EXT-X-STREAM-INF or #EXT-X-MEDIA or #EXT-X-KEY
              if (line.startsWith("#EXT-X-KEY:") && line.includes("URI=")) {
                return line.replace(/URI="([^"]+)"/, (match, p1) => {
                  let absoluteUri = p1;
                  if (!p1.startsWith("http")) {
                    absoluteUri = new URL(p1, targetUrl).toString();
                  }
                  return `URI="/api/proxy/stream?url=${encodeURIComponent(absoluteUri)}&referer=${encodeURIComponent(referer || "")}"`;
                });
              }
              return line;
            });

            // Pass through important headers
            res.status(proxyRes.statusCode || 200);
            res.set("Content-Type", contentType || "application/vnd.apple.mpegurl");
            res.set("Access-Control-Allow-Origin", "*");
            res.send(rewrittenLines.join("\n"));
          });
        } else {
          // It's a TS chunk or key or something else, pipe it directly
          res.status(proxyRes.statusCode || 200);
          if (contentType) res.set("Content-Type", contentType);
          res.set("Access-Control-Allow-Origin", "*");
          
          if (proxyRes.headers["content-length"]) {
             res.set("Content-Length", proxyRes.headers["content-length"]);
          }

          proxyRes.pipe(res);
        }
      });

      proxyReq.on("error", (err) => {
        console.error("Proxy request error:", err);
        res.status(500).send("Proxy error");
      });

    } catch (err: any) {
      console.error("Invalid URL:", err);
      res.status(400).send("Invalid URL");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
