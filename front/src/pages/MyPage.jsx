import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import GameSection from "../features/mypage/components/GameSection";
import SajuGuideModal from "../features/mypage/components/SajuGuideModal";
import { getGameCatalog } from "../features/mypage/api/gameApi";
import {
  blankInput,
  calculate,
  errorMessage,
  getBirthTimes,
  getBlocks,
  getFortune,
  getInput,
  getSummary,
  inputValues,
  sameInput,
  saveInput,
  unblock,
} from "../features/mypage/mypageApi";

const panel = "rounded border border-[#3A9AFF]/10 bg-[#0d0b1e] p-5 md:p-7";
const button =
  "rounded bg-[#F1FF5E] px-4 py-2 text-sm font-bold text-[#06040f] disabled:opacity-40 hover:brightness-110 transition-all";
const field =
  "w-full rounded border border-[#3A9AFF]/15 bg-[#100e25] px-3 py-3 text-sm text-white";
const elements = [
  ["wood", "목", "木", "#34d399"],
  ["fire", "화", "火", "#fb7185"],
  ["earth", "토", "土", "#fbbf24"],
  ["metal", "금", "金", "#cbd5e1"],
  ["water", "수", "水", "#60a5fa"],
];
const pillars = [
  ["year", "연주"],
  ["month", "월주"],
  ["day", "일주"],
  ["hour", "시주"],
];

export default function MyPage() {
  const user = useAuthStore((state) => state.user);
  const [summary, setSummary] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [savedInput, setSavedInput] = useState(null);
  const [form, setForm] = useState(blankInput);
  const [times, setTimes] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [load, setLoad] = useState({
    summary: "loading",
    input: "loading",
    times: "loading",
    blocks: "loading",
  });
  const [errors, setErrors] = useState({});
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fortune, setFortune] = useState(null);
  const [fortuneGames, setFortuneGames] = useState([]);
  const [fortuneBusy, setFortuneBusy] = useState(false);
  const [fortuneError, setFortuneError] = useState("");
  const [removing, setRemoving] = useState(null);
  const [blockError, setBlockError] = useState("");
  const [blockNotice, setBlockNotice] = useState("");
  const saveLock = useRef(false);
  const fortuneLock = useRef(false);
  const blockLock = useRef(false);
  const saju = summary?.saju?.saju;
  const stale = Boolean(savedInput && !sameInput(savedInput, saju));
  const dirty = !sameInput(form, savedInput);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maxDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    const controller = new AbortController();
    const tasks = [
      ["summary", getSummary, setSummary],
      [
        "input",
        getInput,
        (value) => {
          setSavedInput(value);
          setForm(value ? inputValues(value) : blankInput);
        },
      ],
      ["times", getBirthTimes, setTimes],
      ["blocks", getBlocks, setBlocks],
    ];
    tasks.forEach(([key, fetcher, setter]) => {
      fetcher(controller.signal)
        .then((value) => {
          if (controller.signal.aborted) return;
          setter(value);
          setLoad((previous) => ({ ...previous, [key]: "ready" }));
        })
        .catch((error) => {
          if (controller.signal.aborted) return;
          setLoad((previous) => ({ ...previous, [key]: "error" }));
          setErrors((previous) => ({
            ...previous,
            [key]: errorMessage(error),
          }));
        });
    });
    return () => controller.abort();
  }, [reload]);

  function retry() {
    setLoad({
      summary: "loading",
      input: "loading",
      times: "loading",
      blocks: "loading",
    });
    setReload((value) => value + 1);
  }
  async function submit(event) {
    event.preventDefault();
    if (saveLock.current || fortuneLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError("");
    setSaveNotice("");
    let saved = false;
    try {
      if (dirty) {
        const result = await saveInput(form);
        setSavedInput(result);
        saved = true;
      } else saved = true;
      setSaveNotice("입력이 저장되었습니다. 사주를 계산하고 있습니다.");
      const result = await calculate();
      setSummary((previous) => ({ ...previous, saju: result }));
      setLoad((previous) => ({ ...previous, summary: "ready" }));
      setSaveNotice(
        "사주 재계산이 완료되었습니다. 대표 이름과 오행 카드가 갱신되었습니다.",
      );
    } catch (error) {
      setSaveNotice("");
      setSaveError(
        `${saved ? "입력은 저장되었지만 사주 계산이 완료되지 않았습니다. 재계산을 다시 시도해 주세요. " : "입력 저장을 확인하지 못했습니다. "} ${errorMessage(error)}`,
      );
    } finally {
      saveLock.current = false;
      setSaving(false);
    }
  }
  async function fetchFortune() {
    if (fortuneLock.current || saveLock.current) return;
    fortuneLock.current = true;
    setFortuneBusy(true);
    setFortuneError("");
    try {
      const [result, games] = await Promise.all([getFortune(), getGameCatalog()]);
      setFortuneGames(games);
      setFortune(result);
    } catch (error) {
      setFortuneError(errorMessage(error));
    } finally {
      fortuneLock.current = false;
      setFortuneBusy(false);
    }
  }
  async function removeBlock(id) {
    if (blockLock.current) return;
    blockLock.current = true;
    setRemoving(id);
    setBlockError("");
    setBlockNotice("");
    try {
      await unblock(id);
      setBlocks((previous) =>
        previous.filter((item) => item.blockedUserId !== id),
      );
      setBlockNotice("차단을 해제했습니다.");
    } catch (error) {
      setBlockError(errorMessage(error));
    } finally {
      blockLock.current = false;
      setRemoving(null);
    }
  }
  const gameName = (id) =>
    fortuneGames.find((game) => String(game.gameId) === String(id))?.name ||
    summary?.games?.find((game) => String(game.gameId) === String(id))?.name ||
    "알 수 없는 게임";

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10 space-y-6 text-[#f0f0fa] selection:bg-[#F1FF5E] selection:text-[#1C0770]">
      <header
        className={`${panel} bg-gradient-to-br from-[#261CC1]/25 to-[#0d0b1e]`}
      >
        <p className="text-xs tracking-widest text-[#3A9AFF] mb-3">
          MY PROFILE
        </p>
        <h1 className="text-3xl font-bold break-words">
          {saju?.sajuAnimalName || user?.nickname}
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          가입 닉네임 · {user?.nickname}
        </p>
        {stale && (
          <p role="status" className="mt-3 text-sm text-amber-300">
            저장된 입력과 사주 결과가 다릅니다. 하단에서 재계산해 주세요. 현재
            이름과 카드는 이전 계산 결과입니다.
          </p>
        )}
      </header>
      {Object.values(load).includes("error") && (
        <div role="alert" className={panel}>
          <p>일부 정보를 불러오지 못했습니다. 아래 안내를 확인해 주세요.</p>
          <button
            className={`${button} mt-3`}
            disabled={saving || fortuneBusy || removing !== null}
            onClick={retry}
          >
            정보 다시 불러오기
          </button>
        </div>
      )}

      <GameSection />

      <section className={panel} aria-labelledby="elements-title">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="elements-title" className="text-xl font-semibold">
            나의 오행 사주
          </h2>
          <button
            type="button"
            className="shrink-0 rounded border border-[#3A9AFF]/25 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#3A9AFF]"
            aria-haspopup="dialog"
            onClick={() => setGuideOpen(true)}
          >
            ⓘ 가이드
          </button>
        </div>
        {guideOpen && <SajuGuideModal onClose={() => setGuideOpen(false)} />}
        {load.summary === "loading" ? (
          <p role="status">사주 정보를 불러오는 중입니다.</p>
        ) : load.summary === "error" ? (
          <p role="alert">{errors.summary}</p>
        ) : !saju ? (
          <div className="text-slate-400">
            <p>
              아직 계산된 사주가 없습니다. 생년월일시를 입력해 나의 사주를
              확인하세요.
            </p>
            <a
              href="#saju-edit"
              className="inline-block mt-3 text-[#3A9AFF] underline"
            >
              사주 정보 입력하기
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {elements.map(([key, label, symbol, color]) => {
                const percent = summary.saju.elementPercentages?.[key] ?? 0;
                const dominant = summary.saju.dominantElements?.includes(
                  key.toUpperCase(),
                );
                return (
                  <article
                    key={key}
                    className="rounded border p-4 bg-white/[0.02]"
                    style={{ borderColor: dominant ? color : "#ffffff18" }}
                  >
                    <span className="text-2xl" style={{ color }}>
                      {symbol}
                    </span>
                    <h3 className="mt-2 font-semibold">
                      {label}{" "}
                      <span className="text-xs font-normal">
                        {dominant ? "강한 오행" : ""}
                      </span>
                    </h3>
                    <p className="text-2xl font-bold mt-2">{percent}%</p>
                    <p className="text-xs text-slate-400 mt-1">
                      수치 {saju[`${key}Count`]}
                    </p>
                    <div
                      role="meter"
                      aria-label={`${label} 비율`}
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-1.5 rounded bg-white/10 mt-4 overflow-hidden"
                    >
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${Math.min(100, Math.max(0, percent))}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
            <dl className="grid grid-cols-4 gap-3 mt-5 text-center">
              {pillars.map(([key, label]) => (
                <div key={key} className="rounded bg-white/5 py-3">
                  <dt className="text-xs text-slate-400">{label}</dt>
                  <dd className="mt-1">
                    {saju[`${key}Stem`] || "—"} {saju[`${key}Branch`] || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </section>

      <section className={panel} aria-labelledby="fortune-title">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h2 id="fortune-title" className="text-xl font-semibold">
            오늘의 운세
          </h2>
          <button
            className={button}
            disabled={
              fortuneBusy ||
              saving ||
              !saju ||
              stale ||
              load.summary !== "ready" ||
              load.input !== "ready"
            }
            onClick={fetchFortune}
          >
            {fortuneBusy ? "운세를 불러오는 중…" : "오늘의 운세 불러오기"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          이미 생성된 당일 운세는 사주를 변경해도 유지됩니다. 새 사주는 다음 날
          운세 생성부터 반영됩니다.
        </p>
        {(!saju || stale) && (
          <p className="mt-3 text-sm text-amber-300">
            먼저 하단에서 사주 계산을 완료해 주세요.
          </p>
        )}
        {fortuneError && (
          <p role="alert" className="mt-4 text-red-300">
            {fortuneError}
          </p>
        )}
        {!fortune && !fortuneBusy && (
          <p className="mt-5 text-sm text-slate-400">
            버튼을 눌러 오늘의 운세를 확인하세요.
          </p>
        )}
        {fortuneBusy && (
          <p role="status" className="mt-4 text-[#3A9AFF]">
            처음 생성할 때는 시간이 걸릴 수 있습니다.
          </p>
        )}
        {fortune && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-[#3A9AFF]">
              {fortune.date} · {fortune.oneLineMessage}
            </p>
            <article className="rounded bg-[#261CC1]/20 p-5">
              <p className="text-3xl font-bold text-[#3A9AFF]">
                {fortune.overallFortune.score}
                <span className="text-sm"> / 100</span>
              </p>
              <h3 className="font-semibold text-lg mt-2">
                {fortune.overallFortune.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
                {fortune.overallFortune.content}
              </p>
            </article>
            <div className="grid sm:grid-cols-2 gap-3">
              {fortune.gameFortunes?.map((item) => (
                <article
                  key={item.gameId}
                  className="rounded border border-[#3A9AFF]/10 p-4"
                >
                  <p className="text-xs text-[#3A9AFF]">
                    {gameName(item.gameId)} · {item.score}점
                  </p>
                  <h3 className="font-semibold mt-2">{item.title}</h3>
                  <p className="mt-2 text-sm">{item.content}</p>
                  {item.buff && (
                    <p className="mt-3 text-sm text-emerald-300">
                      버프 · {item.buff.name}: {item.buff.effect}
                    </p>
                  )}
                  {item.caution && (
                    <p className="mt-2 text-sm text-amber-300">
                      주의 · {item.caution.name}: {item.caution.effect}
                    </p>
                  )}
                </article>
              ))}
            </div>
            {fortune.dailyQuest && (
              <article className="rounded bg-white/5 p-4">
                <h3 className="font-semibold">
                  오늘의 퀘스트 · {fortune.dailyQuest.title}
                </h3>
                <p className="mt-2 text-sm">{fortune.dailyQuest.mission}</p>
                <p className="mt-2 text-sm text-emerald-300">
                  보상 · {fortune.dailyQuest.reward}
                </p>
              </article>
            )}
          </div>
        )}
      </section>

      <section className={panel} aria-labelledby="blocks-title">
        <h2 id="blocks-title" className="text-xl font-semibold mb-4">
          내가 차단한 유저
        </h2>
        {blockError && (
          <p role="alert" className="text-red-300 mb-3">
            {blockError}
          </p>
        )}
        {blockNotice && (
          <p role="status" className="text-emerald-300 mb-3">
            {blockNotice}
          </p>
        )}
        {load.blocks === "loading" ? (
          <p role="status">차단 목록을 불러오는 중입니다.</p>
        ) : load.blocks === "error" ? (
          <p role="alert">{errors.blocks}</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-slate-400">차단한 유저가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-[#3A9AFF]/10">
            {blocks.map((item) => (
              <li
                key={item.blockedUserId}
                className="flex justify-between items-center gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words">{item.blockedNickname}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    차단일 · {item.createdAt?.slice(0, 10) || "—"}
                  </p>
                </div>
                <button
                  className={`${button} shrink-0`}
                  disabled={removing !== null}
                  onClick={() => removeBlock(item.blockedUserId)}
                  aria-label={`${item.blockedNickname} 차단 해제`}
                >
                  {removing === item.blockedUserId ? "해제 중…" : "차단 해제"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="saju-edit"
        className={`${panel} scroll-mt-24`}
        aria-labelledby="edit-title"
      >
        <h2 id="edit-title" className="text-xl font-semibold">
          사주 정보 입력 · 변경
        </h2>
        <p className="mt-2 mb-5 text-sm text-slate-400">
          생년월일시를 저장하고 사주를 재계산합니다. 태어난 시간을 모르면 모름을
          선택하세요.
        </p>
        {load.input === "error" && (
          <p role="alert" className="text-red-300 mb-3">
            {errors.input}
          </p>
        )}
        {load.times === "error" && (
          <p role="alert" className="text-red-300 mb-3">
            출생 시간 목록: {errors.times}
          </p>
        )}
        {(load.input === "loading" || load.times === "loading") && (
          <p role="status">입력 정보를 불러오는 중입니다.</p>
        )}
        <form onSubmit={submit}>
          <fieldset
            disabled={
              saving ||
              fortuneBusy ||
              load.input !== "ready" ||
              load.times !== "ready"
            }
            className="space-y-4 disabled:opacity-50"
            style={{ colorScheme: "dark" }}
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm">
                생년월일
                <input
                  className={`${field} mt-2`}
                  type="date"
                  aria-label="생년월일"
                  name="birthDate"
                  required
                  max={maxDate}
                  value={form.birthDate}
                  onChange={(e) =>
                    setForm({ ...form, birthDate: e.target.value })
                  }
                />
              </label>
              <label className="text-sm">
                성별
                <select
                  className={`${field} mt-2`}
                  aria-label="성별"
                  name="gender"
                  required
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">선택해 주세요</option>
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </select>
              </label>
              <label className="text-sm">
                양력 / 음력
                <select
                  className={`${field} mt-2`}
                  aria-label="양력 / 음력"
                  name="calendarType"
                  value={form.calendarType}
                  onChange={(e) =>
                    setForm({ ...form, calendarType: e.target.value })
                  }
                >
                  <option value="SOLAR">양력</option>
                  <option value="LUNAR">음력</option>
                </select>
              </label>
              <label className="text-sm">
                태어난 시
                <select
                  className={`${field} mt-2`}
                  aria-label="태어난 시"
                  name="birthTimeBranch"
                  value={form.birthTimeBranch}
                  onChange={(e) =>
                    setForm({ ...form, birthTimeBranch: e.target.value })
                  }
                >
                  {times.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value === "UNKNOWN"
                        ? "모름"
                        : `${item.label} (${item.timeRange})`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className={button}>
              {saving
                ? "저장 · 계산 중…"
                : stale && !dirty
                  ? "사주 재계산 다시 시도"
                  : "저장하고 사주 재계산"}
            </button>
          </fieldset>
        </form>
        {saveError && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {saveError}
          </p>
        )}
        {saveNotice && (
          <p role="status" className="mt-4 text-sm text-emerald-300">
            {saveNotice}
          </p>
        )}
      </section>
    </div>
  );
}
