import express from "express";
import cors from "cors";
import userRoute from "./api/user.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

app.get("/user", userRoute);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});