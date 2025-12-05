import { ValidationError } from "../utils/CustomError.js";

// product 생성/수정 시 유효성 검증 미들웨어
export function validateProductInfo(req, res, next) {
  const { name, description, price, tags } = req.body;

  if (req.method === "POST") {
    if (!name || !description || price === undefined || !tags) {
      throw new ValidationError("상품 등록시 필수 항목이 누락되었습니다.");
    }
  } else if (req.method === "PATCH") {
    if (
      name === undefined &&
      description === undefined &&
      price === undefined &&
      tags === undefined
    ) {
      throw new ValidationError(
        "상품 수정시 최소 한 가지 항목은 입력되어야 합니다."
      );
    }
  }
  if (name !== undefined) {
    if (typeof name !== "string") {
      throw new ValidationError("name은 문자열이어야 합니다.");
    }
    if (name.trim() === "") {
      throw new ValidationError("name은 빈 문자열일 수 없습니다.");
    }
  }
  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    throw new ValidationError("price는 0 이상의 숫자이어야 합니다.");
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
      throw new ValidationError("tags는 문자열 배열이어야 합니다.");
    }
  }
  if (description !== undefined) {
    if (typeof description !== "string") {
      throw new ValidationError("description은 문자열이어야 합니다.");
    }
    if (description.trim() === "") {
      throw new ValidationError("decription은 빈 문자열일 수 없습니다.");
    }
  }

  next();
}

// article 생성/수정시 유효성 검증 미들웨어
export function validateArticleInfo(req, res, next) {
  const { title, content } = req.body;

  if (req.method === "POST") {
    if (!title || !content) {
      throw new ValidationError(
        "게시글 등록시 필수 입력 항목이 누락되었습니다."
      );
    }
  } else if (req.method === "PATCH") {
    if (title === undefined && content === undefined) {
      throw new ValidationError(
        "게시글 수정시 최소 한 가지 항목은 입력되어야 합니다."
      );
    }
  }

  if (title !== undefined) {
    if (typeof title !== "string") {
      throw new ValidationError("title은 문자열이어야 합니다.");
    }
    if (title.trim() === "") {
      throw new ValidationError("title은 빈 문자열일 수 없습니다.");
    }
  }
  if (content !== undefined) {
    if (typeof content !== "string") {
      throw new ValidationError("content는 문자열이어야 합니다.");
    }
    if (content.trim() === "") {
      throw new ValidationError("content는 빈 문자열일 수 없습니다.");
    }
  }

  next();
}

export function validateCommentContent(req, res, next) {
  const { content } = req.body;

  if (req.method === "POST") {
    if (!content) {
      throw new ValidationError("content는 비어있을수 없습니다.");
    }
    if (content.trim() === "") {
      throw new ValidationError("content는 빈 문자열일 수 없습니다.");
    }
    if (typeof content !== "string") {
      throw new ValidationError("content는 빈 문자열일 수 없습니다.");
    }
  }
  if (req.method === "PATCH") {
    if (!content) {
      throw new ValidationError("content는 비어있을수 없습니다.");
    }
    if (content.trim() === "") {
      throw new ValidationError("content는 빈 문자열일 수 없습니다.");
    }
    if (typeof content !== "string") {
      throw new ValidationError("content는 빈 문자열일 수 없습니다.");
    }
  }
  next();
}
