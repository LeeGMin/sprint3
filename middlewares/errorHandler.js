import ApiError from "../utils/CustomError.js";

function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({
      error: "요청한 리소스를 찾을 수 없습니다.",
    });
  }
  // 예상치 못한 서버 에러
  return res.status(500).json({
    error: "예상치 못한 서버 에러가 발생했습니다.",
  });
}

export default errorHandler;
