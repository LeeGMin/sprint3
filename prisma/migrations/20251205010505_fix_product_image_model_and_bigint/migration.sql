/*
  Warnings:

  - You are about to drop the `article` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "article" DROP CONSTRAINT "article_image_id_fkey";

-- DropForeignKey
ALTER TABLE "article_comment" DROP CONSTRAINT "article_comment_article_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_image_id_fkey";

-- DropForeignKey
ALTER TABLE "product_comment" DROP CONSTRAINT "product_comment_product_id_fkey";

-- DropTable
DROP TABLE "article";

-- DropTable
DROP TABLE "product";

-- CreateTable
CREATE TABLE "Product" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "image_id" BIGINT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6),
    "image_id" BIGINT,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_image_id_key" ON "Product"("image_id");

-- CreateIndex
CREATE UNIQUE INDEX "Article_image_id_key" ON "Article"("image_id");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "product_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_comment" ADD CONSTRAINT "product_comment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "article_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_comment" ADD CONSTRAINT "article_comment_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
