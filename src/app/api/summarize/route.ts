import Anthropic from "@anthropic-ai/sdk";

// Vercel: Node 런타임 + 넉넉한 타임아웃
export const runtime = "nodejs";
export const maxDuration = 30;

const SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "회의 핵심 요약. 마크다운 불릿(-) 3~6개로 간결하게.",
    },
    actionItems: {
      type: "array",
      items: { type: "string" },
      description: "회의에서 도출된 구체적 할 일 목록. 없으면 빈 배열.",
    },
  },
  required: ["summary", "actionItems"],
  additionalProperties: false,
} as const;

const SYSTEM = `당신은 한국어 회의록을 정리하는 assistant입니다.
주어진 회의록 본문을 읽고:
1) summary: 핵심 내용을 마크다운 불릿(-) 3~6개로 간결히 요약. 결정사항과 중요 논의를 우선.
2) actionItems: 회의에서 나온 실행 가능한 할 일만 추출(담당/기한이 있으면 포함). 명확한 할 일이 없으면 빈 배열.
불필요한 서론 없이 사실만. 한국어로 작성.`;

// Firebase ID 토큰을 Google Identity Toolkit로 검증해 관리자 본인인지 확인
async function isAdminRequest(req: Request): Promise<boolean> {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const adminEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@meetingzip.local";
  if (!token || !apiKey) return false;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!r.ok) return false;
    const data = await r.json();
    const user = data.users?.[0];
    return !!user && user.email === adminEmail;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await isAdminRequest(req))) {
    return Response.json(
      { error: "관리자 인증이 필요합니다. 로그인 후 다시 시도하세요." },
      { status: 401 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local에 키를 추가하면 AI 요약이 활성화됩니다.",
      },
      { status: 400 }
    );
  }

  let body: string;
  try {
    const json = await req.json();
    body = typeof json?.body === "string" ? json.body : "";
  } catch {
    return Response.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!body.trim()) {
    return Response.json({ error: "요약할 본문이 없습니다." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [
        { role: "user", content: `다음 회의록을 정리해줘.\n\n---\n${body}` },
      ],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const parsed = JSON.parse(text) as {
      summary: string;
      actionItems: string[];
    };

    return Response.json({
      summary: parsed.summary ?? "",
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    return Response.json({ error: `요약 생성 실패: ${msg}` }, { status: 500 });
  }
}
