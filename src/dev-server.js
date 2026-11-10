import { createServer } from "node:http";
import { Readable } from "node:stream";
import { handle } from "../dist/server/index.js";

try {
  process.loadEnvFile(".dev.vars");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const env = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
};
const port = Number(process.env.PORT ?? 8787);

createServer(async (incoming, outgoing) => {
  try {
    const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD";
    const request = new Request(new URL(incoming.url, `http://127.0.0.1:${port}`), {
      method: incoming.method,
      headers: incoming.headers,
      ...(hasBody && { body: Readable.toWeb(incoming), duplex: "half" }),
    });
    const response = await handle(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, { "content-type": "application/json" });
    outgoing.end('{"error":"Local server error."}');
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Text Gambit is ready at http://127.0.0.1:${port}`);
});
