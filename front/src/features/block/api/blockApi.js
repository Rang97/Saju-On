import apiClient from "../../../api/apiClient";

// 차단 목록 조회
// GET /api/blocks -> [{ blockId, blockedUserId, blockedNickname, createdAt }]
export const getBlocks = async () => {
  const response = await apiClient.get("/blocks");
  return response.data.data;
};

// 유저 차단
export const blockUser = async (blockedId) => {
  await apiClient.post("/blocks", { blockedId });
};

// 차단 해제
export const unblockUser = async (blockedUserId) => {
  await apiClient.delete(`/blocks/${blockedUserId}`);
};
