import { useCallback, useEffect, useState } from "react";
import { getBlocks, unblockUser } from "../api/blockApi";

export function useBlocks() {
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBlocks();
      setBlocks(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const removeBlock = async (blockedUserId) => {
    await unblockUser(blockedUserId);
    await fetchBlocks();
  };

  return { blocks, isLoading, error, removeBlock, refetch: fetchBlocks };
}
