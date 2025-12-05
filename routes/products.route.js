import express, { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import { validateProductInfo } from "../middlewares/validator.js";
import { ValidationError, NotFoundError } from "../utils/CustomError.js";
import productCommentRouter from "./productComment.js";
import productImageRouter from "./productImage.js";
const router = express.Router();

router.use("/:productId/comments", productCommentRouter);
router.use("/:productId/image", productImageRouter);

// 상품 목록 조회용
class ProductList {
  constructor(id, name, price, created_at) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.created_at = created_at;
  }

  static fromEntity(entity) {
    return new ProductList(
      entity.id.toString(),
      entity.name,
      entity.price,
      entity.created_at
    );
  }
}

// 상품 상세 조회용
class Product {
  constructor(id, name, description, price, tags, created_at) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.tags = tags;
    this.created_at = created_at;
  }

  static fromEntity(entity) {
    return new Product(
      entity.id.toString(),
      entity.name,
      entity.description,
      entity.price,
      entity.tags,
      entity.created_at
    );
  }
}

function getFindOptionFrom(req) {
  // 최신순(recent)으로 정렬할 수 있습니다.
  // name, description에 포함된 단어로 검색할 수 있습니다.
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;
  //  쿼리 파라미터 search를 추출.
  const searchKeyword = req.query.search;

  const findOption = {
    take: limit,
    skip: offset,
    orderBy: { created_at: "desc" },
    where: {},
  };

  if (req.query.keyword) {
    findOption.where.OR = [
      { name: { contains: req.query.keyword } },
      { description: { contains: req.query.keyword } },
    ];
  }

  if (searchKeyword) {
    const searchFilter = {
      contains: searchKeyword,
      mode: "insensitive", // 대소문자 구분 없이 검색
    };

    findOption.where.OR = [
      { name: searchFilter },
      { description: searchFilter },
    ];
  }

  return findOption;
}

// 상품 목록 조회 API를 만들어 주세요.
// id, name, price, created_at를 조회합니다.
// offset 방식의 페이지네이션 기능을 포함해 주세요.
router.get("/", async (req, res, next) => {
  try {
    const findOption = getFindOptionFrom(req);
    const [entityies, totalCount] = await prisma.$transaction([
      prisma.product.findMany(findOption),

      prisma.product.count({
        where: findOption.where || {},
      }),
    ]);

    const products = entityies.map(ProductList.fromEntity);

    res.json({
      data: products,
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

// 상품 상세 조회 API를 만들어 주세요.
// id, name, description, price, tags, created_at를 조회합니다.
router.get("/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    // id 유효성 검증(숫자가 아닌 문자열이 들어왔을 경우 에러 처리)
    if (!/^\d+$/.test(productId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    const entity = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
    });
    // id가 존재하지 않을 경우 404 에러 처리
    if (!entity) {
      throw new NotFoundError("상품을 찾을 수 없습니다.");
    }
    const product = Product.fromEntity(entity);
    res.json(product);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 상품 등록 API를 만들어 주세요.
// name, description, price, tags를 입력하여 상품을 등록합니다.
router.post("/", validateProductInfo, async (req, res, next) => {
  try {
    const { name, description, price, tags } = req.body;
    const createdEntity = await prisma.product.create({
      data: {
        name,
        description,
        price,
        tags,
      },
    });
    const product = Product.fromEntity(createdEntity);
    res.status(201).json(product);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 상품 수정 API를 만들어 주세요.
// PATCH 메서드를 사용해 주세요.
router.patch("/:id", validateProductInfo, async (req, res, next) => {
  try {
    const productId = req.params.id;
    // id 유효성 검증(숫자가 아닌 문자열이 들어왔을 경우 400 에러 처리)
    if (!/^\d+$/.test(productId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    const { name, description, price, tags } = req.body;
    // 변경할 상품의 내용만 포함
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = price;
    if (tags !== undefined) dataToUpdate.tags = tags;

    const updatedEntity = await prisma.product.update({
      where: { id: BigInt(productId) },
      data: { ...dataToUpdate },
    });
    const updatedProduct = Product.fromEntity(updatedEntity);
    res.json(updatedProduct);
  } catch (e) {
    if (e.code === "P2025") {
      // 수정하려는 상품이 존재하지 않을 경우
      return next(new NotFoundError("수정하려는 상품을 찾을 수 없습니다."));
    }
    console.error(e);
    next(e);
  }
});

// 상품 삭제 API를 만들어 주세요.
router.delete("/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    // id 유효성 검증(숫자가 아닌 문자열이 들어왔을 경우 400 에러 처리)
    if (!/^\d+$/.test(productId)) {
      throw new ValidationError("요청 ID는 유효한 숫자 형식이어야 합니다.");
    }
    await prisma.product.delete({
      where: { id: BigInt(productId) },
    });
    res.status(204).end();
  } catch (e) {
    if (e.code === "P2025") {
      // 삭제하려는 상품이 존재하지 않을 경우
      return next(new NotFoundError("삭제하려는 상품을 찾을 수 없습니다."));
    }
    console.error(e);
    next(e);
  }
});

export default router;
