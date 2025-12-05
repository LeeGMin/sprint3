/**
 * Cursor 페이지네이션을 위한 continuation token 생성
 * @param {Object} lastItem - 마지막 아이템 데이터
 * @param {Array<Array<string>>} sort - 정렬 기준 [["field", "asc/desc"], ...]
 * @returns {string} base64 인코딩된 continuation token
 */
export function createContinuationToken(lastItem, sort) {
  if (!lastItem) return null;

  const token = {
    data: lastItem,
    sort,
  };

  return Buffer.from(
    JSON.stringify(token, (k, v) => (typeof v === "bigint" ? v.toString() : v))
  ).toString("base64");
}

/**
 * Continuation token 파싱
 * @param {string} token - base64 인코딩된 continuation token
 * @returns {Object|null} { data, sort }
 */
export function parseContinuationToken(token) {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(decoded, (k, v) => {
      if (k === "id" && typeof v === "string" && /^\d+$/.test(v)) {
        return BigInt(v);
      }
      return v;
    });
  } catch (e) {
    return null;
  }
}

/**
 * Cursor 기반 Prisma where 조건 생성
 * @param {Object} cursorData - continuation token의 data 부분
 * @param {Array<Array<string>>} sort - 정렬 기준
 * @returns {Object} Prisma cursor where 조건
 */
export function buildCursorWhere(cursorData, sort) {
  if (!cursorData || !sort || sort.length === 0) {
    return {};
  }

  const conditions = [];

  for (let i = 0; i < sort.length; i++) {
    const [field, direction] = sort[i];
    const operator = direction === "desc" ? "lt" : "gt";

    const equalConditions = {};
    for (let j = 0; j < i; j++) {
      const [prevField] = sort[j];
      equalConditions[prevField] = cursorData[prevField];
    }

    const condition = {
      ...equalConditions,
      [field]: { [operator]: cursorData[field] },
    };

    conditions.push(condition);
  }

  return conditions.length > 0 ? { OR: conditions } : {};
}

/**
 * Prisma orderBy 배열을 sort 포맷으로 변환
 * @param {Array<Object>} orderBy - Prisma orderBy 배열
 * @returns {Array<Array<string>>} sort 포맷 [["field", "direction"], ...]
 */
export function orderByToSort(orderBy) {
  return orderBy.map((item) => {
    const [field, direction] = Object.entries(item)[0];
    return [field, direction];
  });
}
