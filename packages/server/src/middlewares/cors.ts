import { getAllowedOrigins, isAllowedOrigin } from "@common/allowedOrigins";
import cors from "cors";

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
});

export { getAllowedOrigins };
