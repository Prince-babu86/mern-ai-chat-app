import dotenv from "dotenv";
dotenv.config();

import httpServer from "./src/app.js";
import connectDB from "./src/db/db.js";
import vectorService from "./src/services/vector.service.js";

connectDB();

httpServer.listen(3000, () => {
  console.log(`Server is running 3000 `);
});
