import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { FiArrowLeft } from "react-icons/fi";

// 궁합 유형 3종
const chemistryOptions = [
  { value: "SYNERGY", label: "상생" },
  { value: "RIVAL", label: "상극" },
  { value: "BALANCED", label: "균형" },
];

export default function PartyCreatePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]); // 등록한 선호 게임 목록
  const [gameId, setGameId] = useState(null); // 선택된 게임 ID
  const [gamesLoading, setGamesLoading] = useState(true); // 로딩
  // 입력 폼 값 (title, totalSlots, chemistry)
  const [title, setTitle] = useState("");
  const [totalSlots, setTotalSlots] = useState(4);
  const [chemistry, setChemistry] = useState(chemistryOptions[0].value);
  const [error, setError] = useState(null); // 에러

  // 게임 목록 조회
  useEffect(() => {
    api
      .get("/users/me/games")
      .then((res) => {
        const list = res.data.data;
        setGames(list);
        // 목록 로드 후 첫 게임 기본 선택값 지정
        if (list.length > 0) {
          setGameId(list[0].gameId);
        }
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("게임 목록을 불러오지 못했습니다.");
      })
      .finally(() => setGamesLoading(false));
  }, []);

  // 로딩 후 게임 없을 시 true (폼 제출 버튼 비활성화 조건)
  const hasNoGames = !gamesLoading && games.length === 0;

  // 제출 조작
  const handleSubmit = (e) => {
    // 폼 기본 동작 막음
    e.preventDefault();
    // 입력값 그대로 body 담음, 파티 생성 요청
    api
      .post("/party/create", {
        title,
        gameId: Number(gameId), // 숫자 변환해 전송
        maxMemberCount: totalSlots,
        chemistryType: chemistry,
      })
      // 성공 시 로비 이동
      .then(() => {
        navigate("/party");
      })
      .catch((err) => {
        console.error(err);
        setError("파티 생성에 실패했습니다.");
      });
  };

  // 로딩 중 / 게임 없음 / 정상 -> 택1 미리 변수 담음, gameField 넣음
  let gameField;
  if (gamesLoading) {
    gameField = (
      <p className="text-sm" style={{ color: "#c4c4d6" }}>
        불러오는 중...
      </p>
    );
  } else if (hasNoGames) {
    gameField = (
      <p className="text-sm" style={{ color: "#c4c4d6" }}>
        등록된 선호 게임이 없습니다.
      </p>
    );
  } else {
    gameField = (
      <select
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        className="w-full px-4 py-2.5 rounded-sm text-ms outline-none"
        style={{
          background: "rgba(38,28,193,0.14)",
          border: "1px solid rgba(58,154,255,0.35)",
          color: "#e8e8f0",
        }}
      >
        {games.map((g) => (
          <option key={g.gameId} value={g.gameId}>
            {g.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background:
          "radial-gradient(circle at 15% 20%, rgba(38,28,193,0.35), transparent 55%), radial-gradient(circle at 85% 80%, rgba(58,154,255,0.25), transparent 55%), #07070e",
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "560px",
        }}
      >
        <button
          onClick={() => navigate("/party")}
          className="flex items-center gap-2 text-sm mb-8 py-2 px-3 rounded-sm
                    bg-[#3A9AFF]/15 text-[#3A9AFF] font-bold border-[#3A9AFF]  hover:bg-[#261CC1]/40 transition-colors hover:cursor-pointer"
        >
          <FiArrowLeft />
          목록으로
        </button>
        <div
          style={{
            background: "rgba(255, 255, 255, 0.20)",
            border: "2px solid rgba(255,255,255,0.08)",
            borderRadius: "5px",
            padding: "35px",
            boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-2 font-bold text-[#3A9AFF]">
            파티를 만들어 게임을 함께 즐기세요!
          </p>
          <h1 className="text-4xl font-bold mb-10 tracking-tight font-['Rajdhani'] text-white">
            파티 생성
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label
                className="block text-sm mb-2 font-bold text-gray-200"
                style={{ color: "#c4c4d6" }}
              >
                게임
              </label>
              {gameField}
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-gray-300">
                파티 제목
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 다이아 랭크 듀오 구합니다"
                className="w-full px-4 py-2.5 rounded-sm text-sm outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.25)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "#e8e8f0",
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-300">
                  총 인원
                </label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={totalSlots}
                  onChange={(e) => setTotalSlots(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-sm text-sm outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#e8e8f0",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-gray-300">
                궁합 유형
              </label>
              <div className="flex gap-2">
                {chemistryOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChemistry(opt.value)}
                    className="w-full h-10 rounded-sm text-sm font-medium transition-all"
                    style={
                      chemistry === opt.value
                        ? {
                            background: "rgba(38,28,193,0.35)",
                            color: "#3A9AFF",
                            border: "1px solid #3A9AFF",
                          }
                        : {
                            background: "rgba(255,255,255,0.03)",
                            color: "#8888a0",
                            border: "1px solid rgba(255,255,255,0.08)",
                          }
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              // 등록된 게임 없을 시 완료 버튼 못 누름
              disabled={hasNoGames}
              className="mt-2 px-6 py-3 rounded-sm text-ms font-semibold disabled:opacity-40 disabled:cursor-not-allowed bg-[#F1FF5E] text-[#06040f] hover:brightness-110 transition-all cursor-pointer"
            >
              완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
