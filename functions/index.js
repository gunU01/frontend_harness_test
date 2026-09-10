const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const KEY = defineSecret("ANTHROPIC_API_KEY");

exports.generate = onCall(
  { secrets: [KEY], region: "asia-northeast3", timeoutSeconds: 120 },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    const uid = req.auth.uid;
    const { mode, specId, sectionKey } = req.data;
    const db = getFirestore();

    const configSnap = await db.doc(`config/${uid}`).get();
    const config = configSnap.exists ? configSnap.data() : { template: [], productContext: "", glossary: "" };

    const specSnap = await db.doc(`specs/${specId}`).get();
    if (!specSnap.exists || specSnap.data().uid !== uid) {
      throw new HttpsError("permission-denied", "해당 스펙에 접근할 수 없습니다.");
    }
    const spec = specSnap.data();

    const prompt = buildPrompt(mode, { config, spec, sectionKey });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY.value(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      throw new HttpsError("internal", `Anthropic API 호출 실패: ${res.status}`);
    }
    const data = await res.json();
    const text = data.content?.[0]?.text ?? "";
    return { mode, text };
  }
);

function buildPrompt(mode, { config, spec, sectionKey }) {
  const templateDesc = (config.template || [])
    .map((s) => `- ${s.title} (${s.key}): ${s.hint}`)
    .join("\n");
  const context = `제품 설명: ${config.productContext || "(없음)"}\n용어집: ${config.glossary || "(없음)"}`;
  const docText = (spec.sections || [])
    .map((s) => `## ${s.title}\n${s.content || "(빈 섹션)"}`)
    .join("\n\n");

  if (mode === "draft") {
    return `${context}\n\n다음 PRD 섹션 템플릿에 맞춰, 한 줄 문제 정의 "${spec.oneLiner}"를 바탕으로 각 섹션의 초안을 작성하라. 각 섹션의 지시문(hint)을 반드시 따를 것.\n\n${templateDesc}\n\n각 섹션을 "## 섹션키" 형식의 마크다운 헤더로 구분해서 출력하라.`;
  }
  if (mode === "section") {
    const target = (config.template || []).find((s) => s.key === sectionKey);
    return `아래는 작성 중인 PRD 문서 전체다(참고용 컨텍스트):\n\n${docText}\n\n${context}\n\n이제 "${target?.title}" 섹션만 다시 작성하라. 지시문: ${target?.hint}\n요청한 섹션의 본문만 출력하고 다른 섹션은 출력하지 마라.`;
  }
  // critique
  return `아래는 검토할 PRD 문서다:\n\n${docText}\n\n${context}\n\n문서를 고치지 말고, 리뷰 전에 점검해야 할 질문을 정확히 3개만 제시하라. 각 질문은 한 줄로.`;
}
