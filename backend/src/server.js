import express from "express";
import userRoute from "./api/user.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.get("/user", userRoute);

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});