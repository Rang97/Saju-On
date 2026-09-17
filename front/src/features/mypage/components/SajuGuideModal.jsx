import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import "./SajuGuideModal.css";

const guideElements = [
  {
    symbol: "木", name: "목", color: "#50734d",
    keywords: "성장 · 도전 · 계획 · 창의성",
    strong: "새로운 일을 시작하고 성장하려는 성향이 강한 편",
    low: "변화나 새로운 시작에 신중한 편",
  },
  {
    symbol: "火", name: "화", color: "#a8533e",
    keywords: "열정 · 표현 · 활동성 · 사교성",
    strong: "적극적이고 감정이나 생각을 표현하는 성향이 강한 편",
    low: "자신의 생각이나 감정을 표현하는 데 신중한 편",
  },
  {
    symbol: "土", name: "토", color: "#937024",
    keywords: "안정 · 현실성 · 책임감 · 신뢰",
    strong: "안정과 현실적인 판단을 중요하게 생각하는 편",
    low: "꾸준함이나 안정적인 방향을 유지하는 데 어려움을 느낄 수 있음",
  },
  {
    symbol: "金", name: "금", color: "#757572",
    keywords: "판단 · 원칙 · 결단 · 절제",
    strong: "기준이 뚜렷하고 판단과 결정을 명확하게 내리는 편",
    low: "결정을 내리거나 명확한 기준을 세우는 데 신중한 편",
  },
  {
    symbol: "水", name: "수", color: "#4d6a88",
    keywords: "사고 · 지혜 · 적응 · 유연성",
    strong: "생각이 깊고 상황에 맞게 유연하게 대처하는 편",
    low: "다양한 가능성을 생각하거나 변화에 대응하는 데 어려움을 느낄 수 있음",
  },
];

export default function SajuGuideModal({ onClose }) {
  return (
    <Dialog open onClose={onClose} className="saju-guide">
      <div className="saju-guide__backdrop" aria-hidden="true" />
      <div className="saju-guide__viewport">
        <DialogPanel className="saju-guide__scroll">
          <div className="saju-guide__paper">
            <header className="saju-guide__header">
              <DialogTitle className="saju-guide__title saju-guide__reveal">
                오행사주 가이드
              </DialogTitle>
              <button type="button" className="saju-guide__close" onClick={onClose} aria-label="오행사주 가이드 닫기" data-autofocus>
                ×
              </button>
            </header>
            <div className="saju-guide__body" tabIndex={0} role="region" aria-label="오행사주 가이드 내용">
              <p className="saju-guide__intro saju-guide__reveal" style={{ "--reveal-order": 1 }}>
                오행은 목·화·토·금·수 다섯 가지 기운으로<br />
                구성되어 있습니다.
              </p>
              {guideElements.map((element, index) => (
                <section key={element.symbol} className="saju-guide__element saju-guide__reveal" style={{ "--reveal-order": index + 2 }}>
                  <span className="saju-guide__symbol" style={{ color: element.color }} aria-hidden="true">{element.symbol}</span>
                  <div>
                    <h3>{element.name} <span>{element.keywords}</span></h3>
                    <p><b>강함 :</b> {element.strong}</p>
                    <p><b>부족 :</b> {element.low}</p>
                  </div>
                </section>
              ))}
              <footer className="saju-guide__footer saju-guide__reveal" style={{ "--reveal-order": 7 }}>
                <p>높은 비율 → 해당 오행의 성향이 상대적으로 강하게 나타날 수 있습니다.</p>
                <p>낮은 비율 → 해당 오행의 성향이 상대적으로 약하게 나타날 수 있습니다.</p>
                <p className="saju-guide__note">
                  ※ 오행의 많고 적음은 좋고 나쁨을 의미하지 않습니다.<br />
                  전체적인 균형과 관계를 함께 살펴보는 것이 중요합니다.<br />
                  본 가이드는 오행 분포를 이해하기 위한 간단한 참고용 설명입니다.
                </p>
              </footer>
            </div>
          </div>
          <div className="saju-guide__rod saju-guide__rod--top" aria-hidden="true" />
          <div className="saju-guide__rod saju-guide__rod--bottom" aria-hidden="true" />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
