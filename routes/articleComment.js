import express, { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { validateCommentContent } from "../middlewares/validator.js";
import { NotFoundError } from "../utils/CustomError.js";
import { ArticleComment } from "./comments.js";
import {
  createContinuationToken,
  parseContinuationToken,
  buildCursorWhere,
  orderByToSort,
} from "../utils/cursor-pagination.js";

const articleCommentRouter = new Router({ mergeParams: true });

function toBigInt(value) {
  return BigInt(value);
}

//댓글등록 API
articleCommentRouter.post(
  "/",
  validateCommentContent,
  async (req, res, next) => {
    try {
      const { content } = req.body;
      const { articleId } = req.params;

      const created = await prisma.article_comment.create({
        data: {
          content,
          article_id: toBigInt(articleId),
        },
      });
      const articleComment = ArticleComment.fromEntity(created);
      res.status(201).json(articleComment);
    } catch (e) {
      if (e.code === "P2003") {
        return next(
          new NotFoundError("댓글을 등록하려는 게시글을 찾을 수 없습니다.")
        );
      }
      next(e);
    }
  }
);

//댓글 수정 API
articleCommentRouter.patch(
  "/:commentId",
  validateCommentContent,
  async (req, res, next) => {
    try {
      const { content } = req.body;
      const { articleId, commentId } = req.params;

      const update = await prisma.article_comment.update({
        where: {
          id: toBigInt(commentId),
          article_id: toBigInt(articleId),
        },
        data: {
          content,
        },
      });
      const articleComment = ArticleComment.fromEntity(update);
      res.json(articleComment);
    } catch (e) {
      if (e.code === "P2025") {
        return next(new NotFoundError("수정하려는 댓글을 찾을 수 없습니다."));
      }
      next(e);
    }
  }
);

// 댓글 삭제 API
articleCommentRouter.delete("/:commentId", async (req, res, next) => {
  try {
    const { articleId, commentId } = req.params;

    const deleted = await prisma.article_comment.delete({
      where: {
        id: toBigInt(commentId),
        article_id: toBigInt(articleId),
      },
    });

    const articleComment = ArticleComment.fromEntity(deleted);
    res.json(articleComment);
  } catch (e) {
    if (e.code === "P2025") {
      return next(new NotFoundError("삭제하려는 댓글을 찾을 수 없습니다."));
    }
    next(e);
  }
});

articleCommentRouter.get("/", async (req, res, next) => {
  try {
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 50;
    const { articleId } = req.params;
    const { limit: limitParam, cursor } = req.query;

    const limit = parseInt(limitParam, 10) || DEFAULT_LIMIT;
    if (limit <= 0 || limit > MAX_LIMIT) {
      throw new ValidationError(
        `limit 값은 1에서 ${MAX_LIMIT} 사이여야 합니다.`
      );
    }
    // 커서 페이지네이션을 위한 정렬 기준(최신 댓글 순)
    // 1. created_at 내림차순 (가장 최신 댓글이 먼저)
    // 2. id 오름차순 (created_at이 같을 경우 id가 작은 댓글이 먼저)
    const orderBy = [{ created_at: "desc" }, { id: "asc" }];
    const sort = orderByToSort(orderBy);
    const parsedCursor = parseContinuationToken(cursor);
    const cursorWhere = buildCursorWhere(
      parsedCursor?.data,
      parsedCursor?.sort || sort
    );

    const baseWhere = {
      article_id: toBigInt(articleId),
    };

    const finalWhere = {
      ...baseWhere,
      ...cursorWhere,
    };

    const entities = await prisma.article_comment.findMany({
      where: finalWhere,
      orderBy,
      take: limit + 1,
    });

    const hasNextPage = entities.length > limit;
    const items = hasNextPage ? entities.slice(0, limit) : entities;

    // 마지막 아이템을 기준으로 다음 커서 생성
    const lastItem = items[items.length - 1];
    const nextCursor = createContinuationToken(lastItem, sort);

    // DTO 변환
    const articleComments = items.map(ArticleComment.fromEntity);

    res.json({
      items: articleComments,
      pageInfo: {
        limit,
        hasNextPage,
        nextCursor,
      },
    });
  } catch (e) {
    // 게시글 ID가 유효하지 않은 경우 처리
    if (e instanceof ValidationError) {
      return next(e);
    }
    next(e);
  }
});

export default articleCommentRouter;
