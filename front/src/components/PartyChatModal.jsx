import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import PartyElementPie from "./PartyElementPie";
import {
  ELEMENT_COLORS,
  ELEMENT_LABELS,
  ELEMENT_TOTAL_KEYS,
  ANIMAL_ICONS,
} from "../constants/fiveElements";
import ErrorToast from "./ErrorToast";

export default function PartyChatModal({ party, onClose, onLeave, onDelete }) {
  const token = useAuthStore((state) => state.token);
  const [messages, setMessages] = useState([]); // 메시지 배열
  const [input, setInput] = useState(""); // 입력창 값
  const [myAnimalName, setMyAnimalName] = useState(null); // 사주 닉
  const stompClientRef = useRef(null);
  const [showDetail, setShowDetail] = useState(false); // 오행 패널
  const [chemistry, setChemistry] = useState(null); // 오행 데이터
  const [visible, setVisible] = useState(false); // 모달 애니메이션
  const [hoveredElement, setHoveredElement] = useState(null); // 오행 중 마우스 올린 항목
  const [error, setError] = useState(null);
  const [nowMemberCount, setNowMemberCount] = useState(party.nowMemberCount); // 실시간 인원 수
  const [members, setMembers] = useState([]); // 파티원 목록

  // 내 닉네임 조회
  useEffect(() => {
    api
      .get("/mypage/saju")
      .then((res) => setMyAnimalName(res.data.data.saju.sajuAnimalName))
      .catch((err) => console.error(err));
  }, []);

  // 파티원 목록 조회
  const fetchMembers = () => {
    api
      .get(`/party/${party.partyId}/members`)
      .then((res) => setMembers(res.data))
      .catch((err) => console.error(err));
  };

  // STOMP 연결
  useEffect(() => {
    const client = new Client({
      brokerURL: "ws://localhost:8080/ws",
      connectHeaders: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      onConnect: () => {
        client.subscribe("/sub/party/" + party.partyId, (message) => {
          const data = JSON.parse(message.body);
          setMessages((prev) => [...prev, data]);

          if (data.type === "SYSTEM") {
            api
              .get(`/party/${party.partyId}`)
              .then((res) => setNowMemberCount(res.data.nowMemberCount))
              .catch((err) => console.error(err));
            fetchMembers();
          }
          api
            .get(`/party/${party.partyId}/chemistry`)
            .then((res) => setChemistry(res.data))
            .catch((err) => console.error(err));
        });
      },
      onStompError: (frame) => {
        console.error(frame);
        setError(frame.headers["message"] ?? "채팅 연결에 실패했습니다.");
      },
      onWebSocketError: () => {
        setError("채팅 서버에 연결할 수 없습니다.");
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [party.partyId, token]);

  // 애니메이션
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const iAmHost = myAnimalName === party.hostNickname; // 방장 여부

  // 상세 패널
  const handleToggleDetail = (e) => {
    e.stopPropagation();
    if (!showDetail) {
      api
        // 파티원 전체 오행 합계 조회
        .get(`/party/${party.partyId}/chemistry`)
        .then((res) => setChemistry(res.data))
        .catch((err) => console.error(err));
      fetchMembers();
    }
    setShowDetail((prev) => !prev);
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  // 파티원 추방 (방장 전용)
  const handleKick = (userId) => {
    api
      .delete(`/party/${party.partyId}/kicked/${userId}`)
      .catch((err) =>
        setError(err.response?.data?.message ?? "추방에 실패했습니다."),
      );
  };

  // 파티 탈퇴 (본인)
  const handleLeave = () => {
    api
      .post(`/party/${party.partyId}/leave`)
      .then(() => {
        onLeave?.(party.partyId);
        handleClose();
      })
      .catch((err) =>
        setError(err.response?.data?.message ?? "탈퇴에 실패했습니다."),
      );
  };

  // 파티 삭제 (방장 전용)
  const handleDeleteParty = () => {
    api
      .delete(`/party/delete/${party.partyId}`)
      .then(() => {
        onDelete?.(party.partyId);
        handleClose();
      })
      .catch((err) =>
        setError(err.response?.data?.message ?? "삭제에 실패했습니다."),
      );
  };

  // 전송
  const handleSend = (e) => {
    e.preventDefault();
    // 빈 메시지 전송 방지
    if (!input.trim()) return;
    // 서버로 메시지 발행
    stompClientRef.current.publish({
      destination: "/pub/party/" + party.partyId + "/chat",
      body: JSON.stringify({ content: input.trim() }),
    });
    // 전송 후 입력창 비움
    setInput("");
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "transparent" }}
      onClick={handleClose}
    >
      <ErrorToast message={error} onClose={() => setError(null)} />

      <div
        className="absolute bottom-6 right-6 flex items-stretch transition-all duration-300"
        style={{
          transform: visible ? "translateY(0)" : "translateY(24px)",
          opacity: visible ? 1 : 0,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 오행 상세 패널 — 카드 밖, 왼쪽에 붙음 */}
        <div
          className="overflow-hidden transition-all duration-300 relative"
          style={{
            zIndex: 1,
            width: showDetail ? "260px" : "0px",
            background: "rgba(5,15,30,0.92)",
            borderTop: showDetail ? "1px solid #3A9AFF" : "none",
            borderBottom: showDetail ? "1px solid #3A9AFF" : "none",
            borderLeft: showDetail ? "1px solid #3A9AFF" : "none",
            borderRight: showDetail ? "1px solid #3A9AFF" : "none",
          }}
        >
          {/* 상태창 프레임 장식 — 모서리 브라켓 + STATUS 탭 */}
          {showDetail && (
            <>
              <span
                className="absolute top-0 left-0 w-3.5 h-3.5 pointer-events-none"
                style={{
                  borderTop: "2px solid #3A9AFF",
                  borderLeft: "2px solid #3A9AFF",
                }}
              />
              <span
                className="absolute bottom-0 left-0 w-3.5 h-3.5 pointer-events-none"
                style={{
                  borderBottom: "2px solid #3A9AFF",
                  borderLeft: "2px solid #3A9AFF",
                }}
              />
              <span
                className="absolute top-0 right-0 w-3.5 h-3.5 pointer-events-none"
                style={{
                  borderTop: "2px solid #3A9AFF",
                  borderRight: "2px solid #3A9AFF",
                }}
              />
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 pointer-events-none"
                style={{
                  borderBottom: "2px solid #3A9AFF",
                  borderRight: "2px solid #3A9AFF",
                }}
              />
              <span
                className="absolute top-0 left-1/2 text-[9px] px-2 pointer-events-none"
                style={{
                  transform: "translate(-50%)",
                  color: "#7fe3ff",
                  background: "rgba(5,15,30,0.92)",
                  letterSpacing: "0.3em",
                  fontFamily: "Consolas, monospace",
                  paddingTop: "3px",
                  paddingBottom: "2px",
                  borderBottomLeftRadius: "6px",
                  borderBottomRightRadius: "6px",
                }}
              >
                STATUS
              </span>
            </>
          )}
          <div className="w-65 shrink-0 h-full flex flex-col px-5 py-4 pt-8 pb-4 gap-4">
            {!chemistry ? (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                불러오는 중...
              </p>
            ) : (
              <>
                <p
                  className="text-sm font-semi text-center"
                  style={{ color: "rgba(80,220,255,0.8)" }}
                >
                  오행 현황
                </p>
                <PartyElementPie
                  chemistry={chemistry}
                  hoveredElement={hoveredElement}
                  onHover={setHoveredElement}
                />
                <p className="text-sm text-center" style={{ color: "#e8e8f0" }}>
                  {/* 많은 오행, 적은 오행 다른 문구 표시 */}
                  {chemistry.maxElements?.[0] === chemistry.minElements?.[0] ? (
                    "오행이 고르게 분포돼 있어요"
                  ) : (
                    <>
                      <span
                        style={{
                          color: ELEMENT_COLORS[chemistry.maxElements?.[0]],
                          fontWeight: 700,
                        }}
                      >
                        {ELEMENT_LABELS[chemistry.maxElements?.[0]]}
                      </span>
                      {" 기운이 강하고, "}
                      <span
                        style={{
                          color: ELEMENT_COLORS[chemistry.minElements?.[0]],
                          fontWeight: 700,
                        }}
                      >
                        {ELEMENT_LABELS[chemistry.minElements?.[0]]}
                      </span>
                      {" 기운이 부족해요"}
                    </>
                  )}
                </p>

                <div className="flex gap-2">
                  {/* 각 오행별 합계 숫자 표시 */}
                  {Object.keys(ELEMENT_LABELS).map((key) => {
                    const total = chemistry[ELEMENT_TOTAL_KEYS[key]];
                    const isLacking = chemistry.minElements?.includes(key);
                    const isHovered = hoveredElement === key;
                    const activeColor = isHovered
                      ? ELEMENT_COLORS[key]
                      : isLacking
                        ? ELEMENT_COLORS[key]
                        : "rgba(255,255,255,0.6)";
                    return (
                      <div
                        key={key}
                        className="flex-1 rounded-sm border flex flex-col items-center gap-1 px-2 py-3 transition-colors"
                        style={{
                          borderColor:
                            isHovered || isLacking
                              ? activeColor
                              : "rgba(255,255,255,0.2)",
                          color: activeColor,
                        }}
                        onMouseEnter={() => setHoveredElement(key)}
                        onMouseLeave={() => setHoveredElement(null)}
                      >
                        <span className="text-xs font-bold">
                          {ELEMENT_LABELS[key]}
                        </span>
                        <span className="text-xs">{total}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-center" style={{ color: "#e8e8f0" }}>
                  현재 {nowMemberCount}명 기준
                </p>
                <hr />
                {/* 파티원 조회 / 탈퇴 / 추방 */}
                <div className="flex flex-col gap-1.5 mt-1">
                  {members.map((member) => {
                    const isHostRow = member.nickname === party.hostNickname;
                    const isMe = member.nickname === myAnimalName;
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between text-xs"
                        style={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          >
                            {ANIMAL_ICONS[member.nickname?.split(" ").pop()] ??
                              "🐾"}
                          </span>
                          {member.nickname}
                          {isHostRow && " 👑"}
                        </span>
                        {iAmHost && !isHostRow && (
                          <button
                            onClick={() => handleKick(member.userId)}
                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(255,77,77,0.15)",
                              color: "#ff4d4d",
                              border: "1px solid rgba(255,77,77,0.4)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            추방
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 채팅 카드 */}
        <div
          className="w-full max-w-md rounded flex flex-col overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255,255,255,0.1)",
            height: "60vh",
            width: "45vh",
            backdropFilter: "blur(12px)",
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            className="flex items-center justify-between px-5 py-4 gap-2"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* 타이틀 */}
            <p
              className="text-sm font-semibold truncate flex-1 min-w-0"
              style={{ color: "#e8e8f0" }}
            >
              {party.title}
            </p>

            {/* 상세 버튼 */}
            <button
              onClick={handleToggleDetail}
              className="flex justify-items-start text-xs px-3 py-1 rounded-full border transition-colors shrink-0"
              style={{
                borderColor: showDetail ? "#3A9AFF" : "rgba(255,255,255,0.15)",
                color: showDetail ? "#3A9AFF" : "rgba(255,255,255,0.6)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#F1FF5E";
                e.currentTarget.style.color = "#F1FF5E";
              }}
              onMouseLeave={(e) => {
                if (!showDetail) {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                }
              }}
            >
              상세
            </button>
            {/* 삭제(방장) / 나가기(파티원) 버튼 */}
            <button
              onClick={iAmHost ? handleDeleteParty : handleLeave}
              className="text-xs px-3 py-1 rounded-full border transition-colors shrink-0"
              style={{
                borderColor: "rgba(255,77,77,0.4)",
                color: "#ff4d4d",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,77,77,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {iAmHost ? "삭제" : "나가기"}
            </button>

            {/* 인원수 사각 */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1 justify-end">
                {Array.from({ length: party.maxMemberCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2"
                    style={{
                      background:
                        i < nowMemberCount
                          ? "#3A9AFF"
                          : "rgba(255,255,255,0.2)",
                    }}
                  />
                ))}
              </div>

              <button
                onClick={onClose}
                className="text-sm px-2"
                style={{ color: "#F1FF5E" }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4">
            {messages.map((msg, i) => {
              // 내가 보낸 메시지인지 판별
              const isMine = msg.sender === myAnimalName;
              // 연속 메시지는 발신자/시간 표시 생략 (앞뒤 참조)
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const formatTime = (t) =>
                new Date(t).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

              // 메시지 발신자 다르면 이름 표시
              const showSender = !prev || prev.sender !== msg.sender;
              // 메시지 발신자 다르면 시간 표시
              const showTimestamp =
                !next ||
                next.sender !== msg.sender ||
                formatTime(next.timestamp) !== formatTime(msg.timestamp);

              return (
                <div
                  key={i}
                  className={`chat-message-row ${isMine ? "chat-row-personal" : ""}`}
                >
                  <div className="min-w-0">
                    {showSender && <p className="chat-sender">{msg.sender}</p>}
                    <div
                      className={`chat-bubble ${isMine ? "chat-bubble-personal" : ""}`}
                    >
                      {msg.content}
                    </div>
                    {showTimestamp && (
                      <p className="chat-timestamp">
                        {formatTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSend}
            className="flex gap-2 px-4 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="flex-1 px-4 py-2 rounded text-sm outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fffff",
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-sm text-sm font-bold bg-[#261CC1] text-white hover:bg-[#261CC1]/80"
            >
              전송
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
