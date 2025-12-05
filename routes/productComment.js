import express, { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { validateCommentContent } from "../middlewares/validator.js";
import { ValidationError, NotFoundError } from "../utils/CustomError.js";
import { ProductComment } from "./comments.js";
import {
  createContinuationToken,
  parseContinuationToken,
  buildCursorWhere,
  orderByToSort,
} from "../utils/cursor-pagination.js";

const productCommentRouter = new Router({ mergeParams: true });

const toBigInt = (param) => {
  try {
    return BigInt(param);
  } catch (e) {
    throw new ValidationError(
      `ID 값(${param})이 유효하지 않은 숫자 형식입니다.`
    );
  }
};

// 댓글 등록 API
productCommentRouter.post(
  "/",
  validateCommentContent,
  async (req, res, next) => {
    try {
      const { content } = req.body;
      const { productId } = req.params;

      const created = await prisma.product_comment.create({
        data: {
          content,
          product_id: toBigInt(productId),
        },
      });
      const productComment = ProductComment.fromEntity(created);
      res.status(201).json(productComment);
    } catch (e) {
      if (e.code === "P2003") {
        return next(
          new NotFoundError("댓글을 등록하려는 상품을 찾을 수 없습니다.")
        );
      }
      next(e);
    }
  }
);

// 댓글 수정 API
productCommentRouter.patch(
  "/:commentId",
  validateCommentContent,
  async (req, res, next) => {
    try {
      const { content } = req.body;
      const { productId, commentId } = req.params;

      const update = await prisma.product_comment.update({
        where: {
          id: toBigInt(commentId),
          product_id: toBigInt(productId),
        },
        data: {
          content,
        },
      });
      const productComment = ProductComment.fromEntity(update);
      res.json(productComment);
    } catch (e) {
      if (e.code === "P2025") {
        return next(new NotFoundError("수정하려는 댓글을 찾을 수 없습니다."));
      }
      next(e);
    }
  }
);

// 댓글 삭제 API
productCommentRouter.delete("/:commentId", async (req, res, next) => {
  try {
    const { productId, commentId } = req.params;

    const deleted = await prisma.product_comment.delete({
      where: {
        id: toBigInt(commentId),
        product_id: toBigInt(productId),
      },
    });

    const productComment = ProductComment.fromEntity(deleted);
    res.json(productComment);
  } catch (e) {
    if (e.code === "P2025") {
      return next(new NotFoundError("삭제하려는 댓글을 찾을 수 없습니다."));
    }
    next(e);
  }
});

// 댓글 조회 API (커서 페이지네이션 적용)
productCommentRouter.get("/", async (req, res, next) => {
  try {
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 50;
    const { productId } = req.params;
    const { limit: limitParam, cursor } = req.query;

    const limit = parseInt(limitParam, 10) || DEFAULT_LIMIT;
    if (limit <= 0 || limit > MAX_LIMIT) {
      throw new ValidationError(
        `limit 값은 1에서 ${MAX_LIMIT} 사이여야 합니다.`
      );
    }

    // 커서 페이지네이션을 위한 안정적인 정렬 기준 정의 (최신 댓글 순)
    const orderBy = [{ created_at: "desc" }, { id: "asc" }];
    const sort = orderByToSort(orderBy);
    const parsedCursor = parseContinuationToken(cursor);

    const cursorWhere = buildCursorWhere(
      parsedCursor?.data,
      parsedCursor?.sort || sort
    );

    // 기본 where 조건: 해당 상품의 댓글만 조회
    const baseWhere = {
      product_id: toBigInt(productId),
    };

    // 최종 where 조건: 상품 ID 조건과 커서 조건을 AND로 결합
    const finalWhere = {
      ...baseWhere,
      ...cursorWhere,
    };

    const entities = await prisma.product_comment.findMany({
      where: finalWhere,
      orderBy,
      take: limit + 1,
    });

    // 다음 페이지 존재 여부 판단
    const hasNextPage = entities.length > limit;
    // 실제 반환할 아이템 목록
    const items = hasNextPage ? entities.slice(0, limit) : entities;
    const lastItem = items[items.length - 1];
    const nextCursor = createContinuationToken(lastItem, sort);
    const productComments = items.map(ProductComment.fromEntity);

    // 페이지네이션 정보와 함께 응답
    res.json({
      items: productComments,
      pageInfo: {
        limit,
        hasNextPage,
        nextCursor,
      },
    });
  } catch (e) {
    if (e instanceof ValidationError) {
      return next(e);
    }
    next(e);
  }
});

export default productCommentRouter;
