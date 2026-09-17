import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useCreatePost } from "../features/board/hooks/usePostMutations";

export default function BoardWritePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { submitPost, isSubmitting } = useCreatePost();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    try {
      const newPostId = await submitPost({ title, content });
      alert("게시글이 등록되었습니다.");
      navigate(`/board/${newPostId}`);
    } catch (err) {
      alert("게시글 등록에 실패했습니다. 로그인 상태를 확인해주세요.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
      <button
        onClick={() => navigate("/board")}
        className="flex items-center gap-2 text-sm mb-8 py-2 px-3 rounded-sm
          bg-[#3A9AFF]/15 text-[#3A9AFF] font-bold border-[#3A9AFF]  hover:bg-[#261CC1]/40 transition-colors hover:cursor-pointer"
      >
        <FiArrowLeft />
        게시판으로 돌아가기
      </button>

      <div className="bg-[#0d0b1e] border border-[rgba(58,154,255,0.1)] rounded p-6 md:p-8 shadow-xl">
        <div className="mb-8 pb-6 border-b border-[rgba(58,154,255,0.08)]">
          <p className="text-xs uppercase tracking-widest mb-2 font-bold text-[#3A9AFF]">
            게이머 소통 공간
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-['Rajdhani'] text-[#f0f0fa]">
            새 게시글 작성
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-semibold text-[rgba(240,240,250,0.6)] mb-2 uppercase tracking-wider">
              제목
            </label>
            <input
              type="text"
              placeholder="게시글 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-sm text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(58,154,255,0.15)] text-[#f0f0fa] placeholder-[rgba(240,240,250,0.28)] focus:outline-none focus:border-[#3A9AFF] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[rgba(240,240,250,0.6)] mb-2 uppercase tracking-wider">
              내용
            </label>
            <textarea
              rows={12}
              placeholder="내용을 자유롭게 작성해 주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 rounded text-sm bg-[rgba(255,255,255,0.04)] border border-[rgba(58,154,255,0.15)] text-[#f0f0fa] placeholder-[rgba(240,240,250,0.28)] focus:outline-none focus:border-[#3A9AFF] transition-colors resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[rgba(58,154,255,0.08)]">
            <button
              type="button"
              onClick={() => navigate("/board")}
              className="px-5 py-2.5 rounded text-sm font-semibold border border-[rgba(58,154,255,0.15)] text-[rgba(240,240,250,0.4)] hover:text-white hover:border-[#3A9AFF] transition-all cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded text-sm font-bold bg-[#F1FF5E] text-[#06040f] hover:brightness-110 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
