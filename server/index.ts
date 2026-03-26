import "dotenv/config";

import { createServerApp } from "@/server/app";

const port = Number.parseInt(process.env.SERVER_PORT ?? "4300", 10);
const app = createServerApp();

app.listen(port, () => {
  console.log(`Nexora backend escuchando en http://localhost:${port}`);
});
