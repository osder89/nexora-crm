import type { NextApiRequest, NextApiResponse } from "next";

import { createApiApp } from "@/server/app";

const apiApp = createApiApp();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
    externalResolver: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return apiApp(req as never, res as never);
}
