import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./lib/db.js";

const port = Number(process.env.PORT) || 3001;

async function main() {
  await connectDB();
  app.listen(port, () => {
    console.log(`🚀 API server listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
