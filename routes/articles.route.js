import express, { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { validateArticleInfo } from "../middlewares/validator.js";
import { ValidationError, NotFoundError } from "../utils/CustomError.js";
import articleCommentRouter from "./articleComment.js";
import articleImageRouter from "./articleImage.route.js";
const router = express.Router();

router.use("/:articleId/comments", articleCommentRouter);
router.use("/:articleId/image", articleImageRouter);

class Article {
  constructor(id, title, content, createdAt) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
  }

  static fromEntity(entity) {
    return new Article(
      entity.id.toString(),
      entity.title,
      entity.content,
      entity.created_at
    );
  }
}

// 게시글 목록 조회 API를 만들어 주세요.
// id, title, content, createdAt를 조회합니다.
// todo: offset 방식의 페이지네이션 기능을 포함해 주세요.

function getFindOptionFrom(req) {
  // 최신순(recent)으로 정렬할 수 있습니다.
  // title, content에 포함된 단어로 검색할 수 있습니다.

  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  const searchKeyword = req.query.search; // 'search' 쿼리 파라미터 추출

  const findOption = {
    take: limit,
    skip: offset,
    orderBy: { createdAt: "desc" },
    where: {}, // where 객체 초기화
  };

  if (req.query.keyword) {
    findOption.where.OR = [
      { title: { contains: req.query.keyword } },
      { content: { contains: req.query.keyword } },
    ];
  }

  if (searchKeyword) {
    const searchFilter = {
      contains: searchKeyword,
      mode: "insensitive", // 대소문자 구분 없이 검색
    };

    findOption.where.title = searchFilter;
  }

  return findOption;
}

// 게시글 목록 조회 API를 만들어 주세요.
// id, title, content, createdAt를 조회합니다.
router.get("/", async (req, res, next) => {
  try {
    const findOption = getFindOptionFrom(req);
    const [entities, totalCount] = await prisma.$transaction([
      prisma.article.findMany(findOption),

      prisma.article.count({
        where: findOption.where || {},
      }),
    ]);
    const articles = entities.map(Article.fromEntity);
    res.json({
      data: articles,
      meta: {
        totalCount: totalCount,
        limit: findOption.take,
        offset: findOption.skip,
        totalPage: Math.ceil(totalCount / findOption.take),
      },
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 상세 조회 API를 만들어 주세요.
// id, title, content, createdAt를 조회합니다.
router.get("/:id", async (req, res, next) => {
  try {
    const articleId = req.params.id;
    // id 유효성 검사 (숫자 형식이 아닌 경우 400에러 처리)
    if (!/^\d+$/.test(articleId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    const entity = await prisma.article.findUnique({
      where: { id: BigInt(articleId) },
    });
    if (!entity) {
      throw new NotFoundError("요청하신 게시글을 찾을 수 없습니다.");
    }
    const article = Article.fromEntity(entity);
    res.json(article);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 등록 API를 만들어 주세요.
// title, content를 입력해 게시글을 등록합니다.
router.post("/", validateArticleInfo, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const newEntity = await prisma.article.create({
      data: {
        title,
        content,
      },
    });
    const newArticle = Article.fromEntity(newEntity);
    res.json(newArticle);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 수정 API를 만들어 주세요.
router.patch("/:id", validateArticleInfo, async (req, res, next) => {
  try {
    const articleId = req.params.id;
    // id 유효성 검증(숫자가 아닌 문자열이 들어왔을 경우 400 에러 처리)
    if (!/^\d+$/.test(articleId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    const { title, content } = req.body;
    // 게시글의 수정할 데이터만 입력
    const dataToUpdate = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (content !== undefined) dataToUpdate.content = content;

    const updatedEntity = await prisma.article.update({
      where: { id: BigInt(articleId) },
      data: { ...dataToUpdate },
    });
    const updatedArticle = Article.fromEntity(updatedEntity);
    res.json(updatedArticle);
  } catch (e) {
    if (e.code === "P2025") {
      // 수정하려는 게시글이 존재하지 않을 경우
      return next(new NotFoundError("수정하려는 게시글을 찾을 수 없습니다."));
    }
    console.error(e);
    next(e);
  }
});

// 게시글 삭제 API를 만들어 주세요.
router.delete("/:id", async (req, res, next) => {
  try {
    const articleId = req.params.id;
    // id 유효성 검사 (숫자 형식이 아닌 경우 400에러 처리)
    if (!/^\d+$/.test(articleId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    await prisma.article.delete({
      where: { id: BigInt(articleId) },
    });
    res.status(204).end();
  } catch (e) {
    if (e.code === "P2025") {
      // 삭제하려는 게시글이 존재하지 않을 경우
      return next(new NotFoundError("삭제하려는 게시글을 찾을 수 없습니다."));
    }
    console.error(e);
    next(e);
  }
});

export default router;
