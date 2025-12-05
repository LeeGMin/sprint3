import express from "express";
import path from "path";
import { uploadSingleImage } from "../utils/image.js";
import { CustomError } from "../utils/CustomError.js"; // 가정: 커스텀 에러 파일 경로 (확장자 필수)

const router = express.Router();

/**
 * @route POST /api/upload/image
 * @desc 단일 이미지 파일 업로드 후 경로 반환
 * @body {string} type - 업로드 유형 ('market' 또는 'article') - multer storage에서 사용됨
 * @file {File} image - 업로드할 이미지 파일
 * @returns {object} 업로드된 파일 정보 (URL 포함)
 */
router.post("/image", uploadSingleImage, (req, res, next) => {
  try {
    // multer 미들웨어 실행 후 req.file이 존재하는지 확인
    if (!req.file) {
      // 파일 업로드 자체가 누락되었거나 fileFilter에서 거부된 경우 (CustomError는 이미 던져졌을 수 있음)
      // 여기서는 파일 누락만 확인하고, 다른 에러는 Multer가 CustomError를 통해 next로 전달하도록 처리합니다.
      return next(new CustomError("업로드할 이미지를 선택해 주세요.", 400));
    }

    // Multer storage에서 사용된 type을 다시 가져옵니다.
    const uploadType = req.body.type || req.query.type || "temp";
    const fileUrl = `/uploads/${uploadType}/${req.file.filename}`;

    res.status(201).json({
      message: "이미지 업로드 성공",
      file: {
        filename: req.file.filename,
        size: req.file.size,
        // req.file.path는 서버 내부 경로이므로, 클라이언트 접근 URL을 반환합니다.
        url: fileUrl,
      },
    });
  } catch (err) {
    // Multer 에러 (예: 용량 초과) 또는 기타 에러 처리
    next(err);
  }
});

export default router;
