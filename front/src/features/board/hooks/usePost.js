import { useCallback, useEffect, useState } from "react";
import { getPost } from "../api/postApi";

export function usePost(postId) {
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPost(postId);
      setPost(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, setPost, isLoading, error, refetch: fetchPost };
}
