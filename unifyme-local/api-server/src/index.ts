import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = Number(process.env.PORT) || 3000;

async function main() {
  await connectDB();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});