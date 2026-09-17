import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGameCatalog } from "../features/game/hooks/useGameCatalog";
import { pickRandomItems } from "../features/game/utils/pickRandom";
import { GAME_TAG_LABELS } from "../features/game/constants/gameTagLabels";
import {
  ELEMENT_GENRE_MAP,
  ELEMENT_META,
} from "../features/game/constants/elementGenreMap";

const CARDS_TO_SHOW = 20;
const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&h=1300&fit=crop&auto=format&q=80";

const elementTabs = Object.keys(ELEMENT_META).map((key) => ({
  key,
  label: `${ELEMENT_META[key].hanja} ${ELEMENT_META[key].label}`,
}));

export default function HomePage() {
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);

  // 게임 카탈로그 (히어로 슬라이더 + 오행 큐레이션 둘 다 여기서 가져다 씀)
  const { games, isLoading, error } = useGameCatalog();
  const gameCards = useMemo(
    () => pickRandomItems(games, CARDS_TO_SHOW),
    [games],
  );

  // 오행 큐레이션 탭 상태
  const [activeElement, setActiveElement] = useState(elementTabs[0].key);
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => ELEMENT_GENRE_MAP[game.genre] === activeElement)
      .slice(0, 6);
  }, [games, activeElement]);
  const el = ELEMENT_META[activeElement];

  const handleScroll = () => {
    if (sliderRef.current) {
      setScrollPos(sliderRef.current.scrollLeft);
    }
  };

  const handleWheel = (e) => {
    if (sliderRef.current) {
      sliderRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleMouseDown = (e) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;

    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleCardClick = () => {
    if (hasDragged) return;
    navigate("/party");
  };

  useEffect(() => {
    const centerSlider = () => {
      if (sliderRef.current) {
        const container = sliderRef.current;
        const centerPos = (container.scrollWidth - container.clientWidth) / 2;
        container.scrollLeft = centerPos;
        setScrollPos(centerPos);
      }
    };

    centerSlider();
    window.addEventListener("resize", centerSlider);
    return () => window.removeEventListener("resize", centerSlider);
  }, [gameCards]);

  return (
    <div className="bg-[#06040f] min-h-screen text-white overflow-x-hidden">
      {/* ── 히어로 + 카드 슬라이더 ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-between pt-10 pb-10 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(58,154,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(58,154,255,0.04) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: 800,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(38,28,193,0.28) 0%, rgba(58,154,255,0.08) 50%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <img
          src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=80&h=80&fit=crop&auto=format"
          alt=""
          className="absolute hidden md:block rounded opacity-60 pointer-events-none"
          style={{
            width: 68,
            height: 68,
            top: "18%",
            left: "6%",
            transform: "rotate(-12deg)",
            filter: "drop-shadow(0 8px 24px rgba(58,154,255,0.4))",
          }}
        />
        <img
          src="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=80&h=80&fit=crop&auto=format"
          alt=""
          className="absolute hidden md:block rounded opacity-50 pointer-events-none"
          style={{
            width: 58,
            height: 58,
            top: "28%",
            right: "7%",
            transform: "rotate(10deg)",
            filter: "drop-shadow(0 8px 24px rgba(241,255,94,0.3))",
          }}
        />

        <div className="flex flex-col items-center z-10 max-w-4xl px-4 text-center mt-2">
          <div className="mt-10 mb-6">
            <span
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded"
              style={{
                background: "rgba(58,154,255,0.1)",
                color: "#3A9AFF",
                border: "1px solid rgba(58,154,255,0.25)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#3A9AFF", boxShadow: "0 0 6px #3A9AFF" }}
              />
              사주 기반 플레이어 찾기
            </span>
          </div>

          <h1 className="font-['Rajdhani'] font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight leading-none mb-5">
            함께 플레이하고 <br />
            <span className="bg-gradient-to-r from-[#3A9AFF] via-white to-[#F1FF5E] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(58,154,255,0.4)]">
              함께 승리하세요
            </span>
          </h1>

          <p className="max-w-md text-slate-300/80 text-sm leading-relaxed">
            당신의 찰떡궁합 게임과 파티를 찾아보세요.
          </p>
        </div>

        <div className="w-full relative z-10 my-auto m0">
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 z-40 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 z-40 pointer-events-none" />

          {isLoading && (
            <p className="text-center text-sm text-slate-400 py-20">
              게임 목록을 불러오는 중...
            </p>
          )}
          {!isLoading && error && (
            <p className="text-center text-sm text-red-400 py-20">
              게임 목록을 불러오지 못했습니다.
            </p>
          )}

          {!isLoading && !error && gameCards.length > 0 && (
            <div
              ref={sliderRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              style={{
                paddingLeft: "calc(50vw - 150px)",
                paddingRight: "calc(50vw - 150px)",
              }}
              className={`flex items-center py-16 sm:pt-18 sm:pb-50 overflow-hidden select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              {gameCards.map((card, idx) => {
                const isMobile =
                  typeof window !== "undefined" && window.innerWidth < 640;
                const cardWidth = isMobile ? 240 : 300;

                const overlap = isMobile ? 48 : 80;
                const effectiveWidth = cardWidth - overlap;

                const cardOffset = idx * effectiveWidth;
                const containerWidth = sliderRef.current
                  ? sliderRef.current.clientWidth
                  : 0;
                const currentCenter = scrollPos + containerWidth / 2;

                const paddingOffset = containerWidth / 2 - cardWidth / 2;
                const cardCenter = cardOffset + paddingOffset + cardWidth / 2;

                const distanceFromCenter = cardCenter - currentCenter;
                const absDistance = Math.abs(distanceFromCenter);

                const rotateZ = Math.max(
                  -20,
                  Math.min(20, distanceFromCenter / 35),
                );
                const translateY = Math.pow(absDistance / 60, 1.8) * 3;
                const zIndex = Math.max(1, 100 - Math.round(absDistance / 10));

                const tagLabel = card.genre
                  ? (GAME_TAG_LABELS[card.genre] ?? card.genre)
                  : null;

                return (
                  <div
                    key={card.gameId}
                    onClick={handleCardClick}
                    style={{
                      transform: `translateY(${translateY}px) rotate(${rotateZ}deg)`,
                      transformOrigin: "bottom center",
                      zIndex: zIndex,
                    }}
                    className="-mx-6 sm:-mx-10 relative flex-shrink-0 w-[240px] sm:w-[300px] h-[380px] sm:h-[490px] rounded-3xl overflow-hidden border border-[#261CC1]/60 bg-[#06040f] shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-transform duration-75 ease-out hover:scale-105 hover:border-[#F1FF5E] hover:shadow-[0_25px_60px_rgba(241,255,94,0.3)] group"
                  >
                    <img
                      src={card.coverUrl || FALLBACK_COVER}
                      alt={card.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#261CC1]/80 via-[#3A9AFF]/10 to-transparent pointer-events-none" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 text-left pointer-events-none">
                      <p className="font-['Rajdhani'] font-bold text-2xl sm:text-3xl text-white">
                        {card.name}
                      </p>
                    </div>

                    {tagLabel && (
                      <div className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md text-[#F1FF5E] border border-[#F1FF5E]/40 shadow-lg pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F1FF5E] animate-pulse" />
                        {tagLabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 bottom-23 gap-2 text-xs font-semibold text-slate-400/80 z-10">
            <span>DRAG TO EXPLORE</span>
          </div>
        </div>
      </section>

      {/* ── 오행별 게임 큐레이션 ── */}
      <section className="px-6 md:px-12 py-10 bg-[#06040f]">
        <div className="text-center mb-10">
          <p className="max-w-md mx-auto mb-5 text-slate-300/80 text-sm md:text-base leading-relaxed">
            추천 큐레이션
          </p>
          <h2 className="font-['Rajdhani'] font-extrabold text-3xl sm:text-xl md:text-5xl leading-none mb-5 text-white">
            오행별 대표 게임 추천
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {elementTabs.map((tab) => {
            const isActive = activeElement === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveElement(tab.key)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-[#F1FF5E]/[0.12] text-[#F1FF5E] border-[#F1FF5E]/35"
                    : "bg-[#0d0b1e] text-[#f0f0fa]/45 border-[#3A9AFF]/10 hover:border-[#3A9AFF]/30"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <p className="text-center text-sm text-slate-400 py-10">
            불러오는 중...
          </p>
        )}
        {!isLoading && error && (
          <p className="text-center text-sm text-red-400 py-10">
            게임 목록을 불러오지 못했습니다.
          </p>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {filteredGames.length === 0 && (
              <p className="col-span-full text-center text-sm text-slate-400 py-10">
                이 오행에 해당하는 게임이 아직 없습니다.
              </p>
            )}

            {filteredGames.map((game) => (
              <div
                key={game.gameId}
                className="rounded overflow-hidden group cursor-pointer transition-transform hover:-translate-y-1 bg-[#0d0b1e]"
              >
                <div className="relative h-[200px] overflow-hidden">
                  <img
                    src={game.coverUrl || FALLBACK_COVER}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0" />
                </div>

                <div className="px-5 pt-4 pb-5 flex flex-col gap-3 items-start">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded bg-[var(--badge-bg)] text-[var(--badge-color)]"
                    style={{
                      "--badge-bg": el.badge,
                      "--badge-color": el.color,
                    }}
                  >
                    {el.hanja} ({el.label}) 속성 추천
                  </span>

                  <h3 className="font-['Rajdhani'] font-bold text-lg leading-snug text-[#f0f0fa] group-hover:text-[#3A9AFF] transition-colors">
                    {game.name}
                  </h3>

                  {game.description && (
                    <p
                      className="text-sm leading-relaxed text-[#f0f0fa]/45"
                      style={{ lineHeight: 1.7 }}
                    >
                      {game.description}
                    </p>
                  )}

                  {game.genre && (
                    <span className="text-xs px-2.5 py-1 rounded bg-white/5 text-[#f0f0fa]/45">
                      {game.genre}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
