import { prisma } from "./prisma.js";

async function product() {
  // Product seed data
  const productResult = await prisma.product.createMany({
    data: [
      {
        name: "최신형 노트북",
        description: "고성능 최신형 노트북입니다.",
        price: 1500000,
        tags: ["electronics", "computer", "laptop"],
      },
      {
        name: "무선 이어폰",
        description: "노이즈 캔슬링 기능이 있는 무선 이어폰 입니다.",
        price: 200000,
        tags: ["electronics", "audio", "wireless"],
      },
      {
        name: "최신형 스마트폰",
        description: "고성능 최신형 스마트폰 입니다.",
        price: 1200000,
        tags: ["electronics", "mobile", "smartphone"],
      },
    ],
  });
  console.log(
    `Product 테이블에 총 ${productResult.count}개의 데이터를 추가했습니다.`
  );
}

product()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

async function article() {
  // Article seed data
  const ArticleResult = await prisma.article.createMany({
    data: [
      {
        title: "제목입니다.",
        content: "내용 입니다",
      },
      {
        title: "두번째 게시글 제목입니다.",
        content: "두번째 게시글 내용 입니다",
      },
      {
        title: "세번째 게시글 제목입니다.",
        content: "세번째 게시글 내용 입니다",
      },
    ],
  });
  console.log(
    `Article 테이블에 총 ${ArticleResult.count}개의 데이터를 추가했습니다.`
  );
}

article()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
