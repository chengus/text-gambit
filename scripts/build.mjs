import { mkdir, readFile, writeFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [template, style, client, worker] = await Promise.all([
  read("../src/page.html"),
  read("../src/style.css"),
  read("../src/client.js"),
  read("../src/worker.js"),
]);
const page = template
  .replace("__PAGE_STYLE__", () => style)
  .replace("__PAGE_CLIENT__", () => client);
await mkdir(new URL("../dist/server/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../dist/server/index.js", import.meta.url),
  worker.replace("__PAGE_HTML__", () => JSON.stringify(page)),
);
console.log("Built dist/server/index.js");
