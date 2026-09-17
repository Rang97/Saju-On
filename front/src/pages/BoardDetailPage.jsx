import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEye, FiMessageSquare } from "react-icons/fi";
import { usePost } from "../features/board/hooks/usePost";
import {
  useCommentSubmit,
  useCommentEdit,
  useCommentDelete,
} from "../features/board/hooks/useComments";
import { getComments } from "../features/board/api/commentApi";
import { useDeletePost } from "../features/board/hooks/usePostMutations";
import MoreActionsMenu from "../features/board/components/MoreActionsMenu";
import { formatRelativeTime } from "../features/board/utils/formatDate";
import { useAuthStore } from "../store/authStore";

export default function BoardDetailPage() {
  const { id: postId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { post, isLoading, error, refetch, setPost } = usePost(postId);

  const refreshComments = async () => {
    const comments = await getComments(postId);
    setPost((prev) => (prev ? { ...prev, comments } : prev));
  };

  const {
    content,
    setContent,
    submitComment,
    isSubmitting,
    error: commentError,
  } = useCommentSubmit(postId, refreshComments);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const { editComment, isSubmitting: isEditingSubmit } = useCommentEdit(
    postId,
    () => {
      setEditingCommentId(null);
      refreshComments();
    },
  );

  const { removeComment } = useCommentDelete(postId, refreshComments);

  const { removePost, isDeleting: isDeletingPost } = useDeletePost();

  if (isLoading) {
    return (
      <div className="bg-[#06040f] min-h-screen text-slate-400 flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#06040f] min-h-screen text-red-400 flex items-center justify-center">
        게시글을 불러오지 못했습니다.
      </div>
    );
  }

  if (!post) {
    return (
      <div className="bg-[#06040f] min-h-screen text-slate-400 flex items-center justify-center">
        게시글을 찾을 수 없습니다.
      </div>
    );
  }

  const isMyPost = user?.nickname && user.nickname === post.writerNickname;

  const handleDeletePost = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await removePost(postId);
      alert("게시글이 삭제되었습니다.");
      navigate("/board");
    } catch (err) {
      const status = err.response?.status;
      alert(
        status === 403
          ? "본인이 작성한 글만 삭제할 수 있습니다."
          : "삭제에 실패했습니다.",
      );
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.commentId);
    setEditContent(comment.content);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  const saveEditComment = async (commentId) => {
    try {
      await editComment(commentId, editContent);
    } catch (err) {
      const status = err.response?.status;
      alert(
        status === 403
          ? "본인이 작성한 댓글만 수정할 수 있습니다."
          : "댓글 수정에 실패했습니다.",
      );
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      await removeComment(commentId);
    } catch (err) {
      const status = err.response?.status;
      alert(
        status === 403
          ? "본인이 작성한 댓글만 삭제할 수 있습니다."
          : "댓글 삭제에 실패했습니다.",
      );
    }
  };

  return (
    <div className="bg-[#06040f] min-h-screen text-white selection:bg-[#F1FF5E] selection:text-[#1C0770]">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/board")}
            className="flex items-center gap-2 text-sm py-2 px-3 rounded-sm
            bg-[#3A9AFF]/15 text-[#3A9AFF] font-bold border-[#3A9AFF]  hover:bg-[#261CC1]/40 transition-colors hover:cursor-pointer"
          >
            <FiArrowLeft />
            게시판으로 돌아가기
          </button>
        </div>

        <div className="bg-[#0d0b1e] rounded-sm p-6 mb-10 md:p-8">
          <div className="flex justify-between">
            {" "}
            <h1 className="font-bold mb-4 leading-snug text-2xl md:text-3xl text-white font-['Rajdhani']">
              {post.title}
            </h1>
            {isMyPost && (
              <MoreActionsMenu
                actions={[
                  {
                    label: "수정",
                    onClick: () => navigate(`/board/${postId}/edit`),
                  },
                  {
                    label: isDeletingPost ? "삭제 중..." : "삭제",
                    onClick: handleDeletePost,
                    danger: true,
                  },
                ]}
              />
            )}
          </div>

          <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#3A9AFF]/40 text-xs text-slate-300/70">
            <div className="flex items-center gap-2 font-medium">
              <span className="text-white font-bold">
                {post.writerNickname}
              </span>

              <span>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-5 font-semibold">
              <span className="flex items-center gap-2">
                <FiEye /> {post.viewCount.toLocaleString()}
              </span>
              <span className="flex items-center gap-2">
                <FiMessageSquare /> {post.comments.length}
              </span>
            </div>
          </div>

          <div className="text-sm md:text-base leading-relaxed whitespace-pre-line text-slate-200/90 font-normal">
            {post.content}
          </div>
        </div>

        <div className="bg-[#261CC1]/10 rounded-sm p-6 shadow-sm">
          <h2 className="font-medium mb-6 text-white font-['Rajdhani']">
            댓글 <span className="text-[#F1FF5E]">{post.comments.length}</span>
          </h2>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) submitComment();
              }}
              className="flex-1 px-4 py-2.5 rounded-sm text-sm
              bg-[rgba(255,255,255,0.04)] border border-[rgba(58,154,255,0.15)] text-white placeholder-slate-400/60 focus:outline-none focus:border-[#3A9AFF] transition-colors"
            />
            <button
              disabled={isSubmitting}
              onClick={submitComment}
              className="px-8 py-2.5 rounded-sm text-sm font-bold bg-[#F1FF5E] text-[#1C0770] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>

          {commentError && (
            <p className="text-xs text-red-400 mb-6">
              댓글 등록에 실패했습니다. 다시 시도해주세요.
            </p>
          )}

          <div className="flex flex-col gap-4 mt-6">
            {post.comments.length === 0 && (
              <p className="text-sm text-slate-400">첫 댓글을 남겨보세요.</p>
            )}
            {post.comments.map((c) => {
              const isMyComment =
                user?.nickname && user.nickname === c.writerNickname;
              const isEditingThis = editingCommentId === c.commentId;

              return (
                <div key={c.commentId} className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">
                      {c.writerNickname}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                      {isMyComment && !isEditingThis && (
                        <MoreActionsMenu
                          actions={[
                            {
                              label: "수정",
                              onClick: () => startEditComment(c),
                            },
                            {
                              label: "삭제",
                              onClick: () => handleDeleteComment(c.commentId),
                              danger: true,
                            },
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  {isEditingThis ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-sm text-sm bg-white/5 border border-[#3A9AFF]/30 text-white focus:outline-none focus:border-[#3A9AFF]"
                      />
                      <button
                        onClick={() => saveEditComment(c.commentId)}
                        disabled={isEditingSubmit}
                        className="text-xs font-bold px-3 py-1.5 rounded-sm bg-[#F1FF5E] text-[#06040f] disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={cancelEditComment}
                        className="text-xs font-bold px-3 py-1.5 rounded-sm bg-white/10 text-white"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-200/80">{c.content}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
