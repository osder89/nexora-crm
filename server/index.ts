import "dotenv/config";

import next from "next";

import { createServerApp } from "@/server/app";

const port = Number.parseInt(process.env.PORT ?? "4200", 10);
const host = process.env.HOST ?? "0.0.0.0";
const dev = process.env.NODE_ENV === "production" ? false : process.env.npm_lifecycle_event !== "start";

async function start() {
  const nextApp = next({ dev, hostname: host, port });
  const nextHandler = nextApp.getRequestHandler();

  await nextApp.prepare();

  const app = createServerApp((req, res) => nextHandler(req, res));

  app.listen(port, host, () => {
    console.log(`Nexora unificado escuchando en http://${host}:${port}`);
  });
}

start().catch((error) => {
  console.error("No se pudo iniciar Nexora.", error);
  process.exit(1);
});
