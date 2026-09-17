import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login, signup } from "../features/auth/authApi";
import { authErrorMessage } from "../api/client";
import { useAuthStore } from "../store/authStore";
import Logo from "../assets/logo.png";

const inputClass =
  "w-full px-4 py-3 rounded text-sm outline-none bg-white/5 border border-[#3A9AFF]/10 text-[#f0f0fa] focus:border-[#3A9AFF]";
const selectClass =
  "w-full px-4 py-3 rounded text-sm outline-none bg-white border border-[#3A9AFF]/10 text-black focus:border-[#3A9AFF] [&_option]:bg-white [&_option]:text-black";
const birthTimes = [
  ["JA", "자시 (23:30~01:29)"],
  ["CHUK", "축시 (01:30~03:29)"],
  ["IN", "인시 (03:30~05:29)"],
  ["MYO", "묘시 (05:30~07:29)"],
  ["JIN", "진시 (07:30~09:29)"],
  ["SA", "사시 (09:30~11:29)"],
  ["O", "오시 (11:30~13:29)"],
  ["MI", "미시 (13:30~15:29)"],
  ["SIN", "신시 (15:30~17:29)"],
  ["YU", "유시 (17:30~19:29)"],
  ["SUL", "술시 (19:30~21:29)"],
  ["HAE", "해시 (21:30~23:29)"],
  ["UNKNOWN", "모름"],
];
const emptySaju = {
  birthDate: "",
  gender: "",
  calendarType: "SOLAR",
  birthTimeBranch: "UNKNOWN",
};

export default function LoginPage() {
  const location = useLocation();
  const register = location.pathname === "/signup";
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saju, setSaju] = useState(emptySaju);
  const hasSaju = Boolean(
    saju.birthDate ||
    saju.gender ||
    saju.calendarType !== "SOLAR" ||
    saju.birthTimeBranch !== "UNKNOWN",
  );
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const maxBirthDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const updateSaju = (event) =>
    setSaju({ ...saju, [event.target.name]: event.target.value });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const user = useAuthStore((state) => state.user);
  const notice = useAuthStore((state) => state.notice);
  const navigate = useNavigate();
  const destination = /^\/(?:mypage|board\/write|board\/[^/]+\/edit)$/.test(
    location.state?.from ?? "",
  )
    ? location.state.from
    : "/";

  function changeMode(nextRegister) {
    navigate(nextRegister ? "/signup" : "/login", {
      replace: true,
      state: location.state,
    });
    setError("");
    setMessage("");
    setPassword("");
    setConfirmation("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setMessage("");
    if (!loginId.trim() || !password.trim() || (register && !nickname.trim())) {
      setError("필수 항목을 입력해 주세요.");
      return;
    }
    if (register && password !== confirmation) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (register && hasSaju && (!saju.birthDate || !saju.gender)) {
      setError(
        "사주 정보를 입력하려면 생년월일과 성별을 함께 선택해 주세요. 입력 초기화 시 사주 정보 없이 가입할 수 있습니다.",
      );
      return;
    }
    setBusy(true);
    try {
      if (register) {
        const result = await signup({
          loginId: loginId.trim(),
          password,
          nickname: nickname.trim(),
          ...(hasSaju ? { sajuInput: saju } : {}),
        });
        changeMode(false);
        setSaju(emptySaju);
        setMessage(
          result.sajuStatus === "CALCULATION_FAILED"
            ? "회원가입이 완료되었습니다. 사주 계산에는 실패했습니다. 가입한 아이디로 로그인해 주세요."
            : "회원가입이 완료되었습니다. 가입한 아이디로 로그인해 주세요.",
        );
      } else {
        const session = await login({ loginId: loginId.trim(), password });
        useAuthStore.getState().setSession(session);
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (user) return <Navigate to={destination} replace />;
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#06040f]">
      <div className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-15 pointer-events-none bg-[#261CC1]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-3 font-bold text-3xl tracking-widest"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            <span className="w-12 h-12 rounded-sm flex items-center justify-center bg-gradient-to-br from-[#261CC1] to-[#3A9AFF] p-1.5">
              <img src={Logo} alt="logo" />
            </span>
            SAJU-ON
          </button>
          <p className="mt-3 text-sm text-[#a4a4b2]">
            {register
              ? "게이밍 커뮤니티에 합류하세요."
              : "다시 오셨군요! 로그인해주세요."}
          </p>
        </div>
        <div className="rounded p-8 bg-[#0d0b1e] border border-[#3A9AFF]/10">
          <div className="flex gap-1 p-1 rounded mb-6 bg-white/5">
            {[false, true].map((isRegister) => (
              <button
                key={String(isRegister)}
                disabled={busy}
                aria-pressed={register === isRegister}
                onClick={() => changeMode(isRegister)}
                className={`flex-1 py-2 rounded text-sm disabled:opacity-50 ${register === isRegister ? "bg-[#261CC1]/40 text-[#3A9AFF]" : "text-[#a4a4b2]"}`}
              >
                {isRegister ? "회원가입" : "로그인"}
              </button>
            ))}
          </div>
          {notice && (
            <p role="status" className="mb-4 text-sm text-amber-300">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className="mb-4 text-sm text-red-300">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="mb-4 text-sm text-emerald-300">
              {message}
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <fieldset
              disabled={busy}
              className="flex flex-col gap-4 disabled:opacity-60"
            >
              <div>
                <label
                  htmlFor="loginId"
                  className="block text-xs mb-2 text-[#a4a4b2]"
                >
                  아이디
                </label>
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  minLength={register ? 4 : undefined}
                  maxLength={register ? 30 : 50}
                  pattern={register ? "[a-zA-Z0-9_]+" : undefined}
                  title="아이디는 영문, 숫자, 밑줄로 4~30자입니다."
                  placeholder="아이디 입력"
                  className={inputClass}
                />
                {register && (
                  <p className="mt-2 text-xs text-[#a4a4b2]">
                    영문, 숫자, 밑줄(_)로 4~30자
                  </p>
                )}
              </div>
              {register && (
                <div>
                  <label
                    htmlFor="nickname"
                    className="block text-xs mb-2 text-[#a4a4b2]"
                  >
                    닉네임
                  </label>
                  <input
                    id="nickname"
                    name="nickname"
                    autoComplete="nickname"
                    required
                    maxLength={15}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임 (최대 15자)"
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs mb-2 text-[#a4a4b2]"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={register ? "new-password" : "current-password"}
                  required
                  minLength={4}
                  maxLength={register ? 30 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={register ? "비밀번호 (4~30자)" : "비밀번호 입력"}
                  className={inputClass}
                />
              </div>
              {register && (
                <div>
                  <label
                    htmlFor="confirmation"
                    className="block text-xs mb-2 text-[#a4a4b2]"
                  >
                    비밀번호 확인
                  </label>
                  <input
                    id="confirmation"
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="비밀번호를 다시 입력해 주세요"
                    className={inputClass}
                  />
                </div>
              )}
              {register && (
                <section
                  aria-labelledby="saju-heading"
                  className="mt-3 pt-5 border-t border-[#3A9AFF]/10 space-y-4"
                >
                  <div>
                    <h2
                      id="saju-heading"
                      className="text-sm font-semibold text-[#3A9AFF]"
                    >
                      사주 계산용 입력 정보{" "}
                      <span className="text-xs text-[#a4a4b2]">(선택)</span>
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-[#a4a4b2]">
                      미입력으로 회원가입은 가능하며, 마이페이지에서 재입력
                      가능합니다
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="birthDate"
                      className="block text-xs mb-2 text-[#a4a4b2]"
                    >
                      생년월일
                    </label>
                    <input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      max={maxBirthDate}
                      value={saju.birthDate}
                      onChange={updateSaju}
                      className={inputClass}
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-xs mb-2 text-[#a4a4b2]"
                      >
                        성별
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={saju.gender}
                        onChange={updateSaju}
                        className={selectClass}
                        style={{ colorScheme: "light" }}
                      >
                        <option value="">선택해 주세요</option>
                        <option value="MALE">남성</option>
                        <option value="FEMALE">여성</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="calendarType"
                        className="block text-xs mb-2 text-[#a4a4b2]"
                      >
                        양력 / 음력
                      </label>
                      <select
                        id="calendarType"
                        name="calendarType"
                        value={saju.calendarType}
                        onChange={updateSaju}
                        className={selectClass}
                        style={{ colorScheme: "light" }}
                      >
                        <option value="SOLAR">양력</option>
                        <option value="LUNAR">음력</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="birthTimeBranch"
                      className="block text-xs mb-2 text-[#a4a4b2]"
                    >
                      태어난 시
                    </label>
                    <select
                      id="birthTimeBranch"
                      name="birthTimeBranch"
                      value={saju.birthTimeBranch}
                      onChange={updateSaju}
                      className={selectClass}
                      style={{ colorScheme: "light" }}
                    >
                      {birthTimes.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs leading-relaxed text-[#a4a4b2]">
                    사주 정보를 입력할 경우 생년월일과 성별을 함께 선택해
                    주세요. 태어난 시는 모름으로 선택할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSaju(emptySaju);
                      setError("");
                    }}
                    className="text-xs text-[#3A9AFF] underline"
                  >
                    사주 입력 초기화
                  </button>
                </section>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded font-semibold text-sm mt-2 bg-[#F1FF5E] text-[#06040f] hover:brightness-110"
              >
                {busy ? "처리 중..." : register ? "회원가입" : "로그인"}
              </button>
            </fieldset>
          </form>
        </div>
        <p className="text-center mt-6 text-xs text-[#a4a4b2]">
          {register ? "이미 계정이 있으신가요? " : "계정이 없으신가요? "}
          <button
            disabled={busy}
            onClick={() => changeMode(!register)}
            className="text-[#3A9AFF]"
          >
            {register ? "로그인" : "회원가입"}
          </button>
        </p>
      </div>
    </div>
  );
}
