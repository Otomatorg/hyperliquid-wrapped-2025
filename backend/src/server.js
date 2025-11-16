import express from "express";
import cors from "cors";
import userRoute from "./api/user.js";
import imageRoute from "./api/image.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies (increase limit for image generation)
app.use(express.json({ limit: '10mb' }));

app.get("/user", userRoute);
app.get("/image", imageRoute);
app.post("/image", imageRoute);
app.get("/generate-image", imageRoute);
app.post("/generate-image", imageRoute);

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`📸 Image generation: GET/POST http://localhost:${PORT}/image`);
});