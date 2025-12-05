import { Router } from "express";
import { prisma } from "../prisma/prisma.js";
import multer from "multer";
import _path from "path";
import fs from "fs/promises";
import { ValidationError, NotFoundError } from "../utils/CustomError.js";

const articleImageRouter = new Router({ mergeParams: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadDir = _path.join(
        "uploads",
        "images",
        "articles",
        req.params.articleId
      );

      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const articleId = req.params.articleId;
      const ext = _path.extname(file.originalname);
      cb(null, `${articleId}-${Date.now()}${ext}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      _path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(
        new Error("이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)")
      );
    }
  },
});

articleImageRouter
  .route("/")
  .post(upload.single("image"), async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError("파일이 업로드되지 않았습니다");
      }

      const articleId = req.params.articleId;
      const { filename: name, path, size } = req.file;

      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          image: true,
        },
      });

      if (!article) {
        await fs.unlink(path);
        throw new NotFoundError(`게시글 ${articleId}를 찾을 수 없습니다`);
      }

      if (article.image) {
        await fs.unlink(article.image.path);

        await prisma.articleImage.delete({
          where: { id: article.image.id },
        });
      }

      const newImage = await prisma.articleImage.create({
        data: {
          name,
          path,
          size,
          article: {
            connect: { id: articleId },
          },
        },
      });

      const updatedArticle = await prisma.article.update({
        where: { id: articleId },
        data: { image_id: newImage.id },
      });

      res.status(201).json({
        message: "게시글 이미지 업로드 및 업데이트 성공",
        file: {
          name: newImage.name,
          path: newImage.path,
          size: newImage.size,
          url: `/uploads/images/articles/${articleId}/${newImage.name}`,
        },
      });
    } catch (err) {
      next(err);
    }
  })

  .get(async (req, res, next) => {
    try {
      const { articleId } = req.params;

      const { image } = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          image: true,
        },
      });

      if (!image) {
        throw new NotFoundError(
          `게시글 ${articleId}의 이미지를 찾을 수 없습니다.`
        );
      }

      // 절대 경로를 사용하여 파일 전송
      const absolutePath = _path.join(process.cwd(), image.path);

      res.sendFile(absolutePath, (err) => {
        if (err) {
          if (err.code === "ENOENT") {
            return next(
              new NotFoundError(
                `게시글 ${articleId}의 이미지를 찾을 수 없습니다`
              )
            );
          }
          next(err);
        }
      });
    } catch (err) {
      next(err);
    }
  });

export default articleImageRouter;
