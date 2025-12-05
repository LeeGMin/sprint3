import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { CustomError } from "./CustomError.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 상품 이미지와 게시글 이미지 업로드를 처리할 스토리지 설정
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadType = req.body.type || req.query.type || "temp";

    // Node.js 프로세스가 실행되는 프로젝트 루트 디렉토리 기준 'uploads' 폴더 사용
    const uploadPath = path.join(process.cwd(), "uploads", uploadType);

    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(
      null,
      `${file.fieldname}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`
    );
  },
});

// 이미지 업로드 설정 (최대 5MB, 이미지 파일만 허용)
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes =
      /image\/jpeg|image\/jpg|image\/png|image\/gif|image\/webp/;

    if (allowedMimeTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new CustomError(
          "이미지 파일(jpeg, jpg, png, gif, webp)만 업로드 가능합니다.",
          400
        ),
        false
      );
    }
  },
});

export const uploadSingleImage = imageUpload.single("image");
