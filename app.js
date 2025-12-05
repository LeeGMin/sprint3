import express from "express";
import articleRouter from "./routes/articles.route.js";
import productRouter from "./routes/products.route.js";
import uploadRouter from "./routes/upload.route.js";
import dotenv from "dotenv";
import errorHandler from "./middlewares/errorHandler.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

const bigIntToStringOrBypass = (_, value) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.set("json replacer", bigIntToStringOrBypass);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/upload", uploadRouter); // 이미지 업로드 라우트

app.use("/api/articles", articleRouter);
app.use("/api/products", productRouter);

app.get("/", (req, res) => {
  res.json({
    message: "API Server",
    endpoints: ["/articles", "/products", "/upload"],
  });
});

app.use(errorHandler);

const apiPort = process.env.API_PORT || 3000;
app.listen(apiPort, () => {
  console.log(`Server running on port ${apiPort}`);
});
