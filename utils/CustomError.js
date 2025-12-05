class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

//400 Bad Request : 유효성 검증 실패, 잘못된 요청 에러
export class ValidationError extends ApiError {
  constructor(message) {
    super(400, message);
  }
}

// 404 Not Found : 요청한 데이터를 찾을 수 없음
export class NotFoundError extends ApiError {
  constructor(massage) {
    super(404, massage);
  }
}

export class CustomError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = "CustomError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

export default ApiError;
