// Production entry for hosts that start the app by running a single Node file
// (Hostinger's Node.js apps). Equivalent to `next start`. Run `npm run build:web` first.
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import next from "next";

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`Lately Lebanon web listening on port ${port}`);
  });
});
