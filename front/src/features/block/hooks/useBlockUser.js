import { useState } from "react";
import { blockUser } from "../api/blockApi";

// "차단하기" 액션 전용 훅 (게시판 등 여러 화면에서 재사용)
// onSuccess는 화면마다 다르게 동작해야 해서
// (상세페이지 나가기 vs 댓글목록 새로고침 등)
export function useBlockUser(onSuccess) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [error, setError] = useState(null);

  const block = async (userId) => {
    setIsBlocking(true);
    setError(null);
    try {
      await blockUser(userId);
      onSuccess?.();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsBlocking(false);
    }
  };

  return { block, isBlocking, error };
}
