// 관리자 계정을 한 번만 생성하는 스크립트. (비밀번호만 정하면 됩니다)
// 로그인 이메일은 .env.local 의 NEXT_PUBLIC_ADMIN_EMAIL 값을 자동으로 사용합니다.
//
// 사전조건: Firebase 콘솔 > Authentication > 로그인 방법 > "이메일/비밀번호" 사용 설정.
//
// 실행:
//   node --env-file=.env.local scripts/create-admin.mjs <비밀번호>
// 예:
//   node --env-file=.env.local scripts/create-admin.mjs "myStrongPassword!"

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const password = process.argv[2];
const email = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@meetingzip.local";

if (!password) {
  console.error("사용법: node --env-file=.env.local scripts/create-admin.mjs <비밀번호>");
  process.exit(1);
}
if (password.length < 6) {
  console.error("❌ 비밀번호는 최소 6자 이상이어야 합니다 (Firebase 요구사항).");
  process.exit(1);
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

const auth = getAuth(app);

try {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  console.log("✅ 관리자 계정 생성 완료:", cred.user.email);
  console.log("   이제 웹사이트 /login 에서 이 비밀번호만 입력하면 로그인됩니다.");
  process.exit(0);
} catch (e) {
  console.error("❌ 생성 실패:", e.code || e.message);
  if (e.code === "auth/operation-not-allowed") {
    console.error("   → Firebase 콘솔에서 '이메일/비밀번호' 로그인 방법을 먼저 사용 설정하세요.");
  }
  if (e.code === "auth/email-already-in-use") {
    console.error(
      `   → 이미 '${email}' 계정이 있습니다. 그 비밀번호로 로그인하거나, 비밀번호를 바꾸려면 Firebase 콘솔 > Authentication 에서 계정을 삭제 후 다시 실행하세요.`
    );
  }
  process.exit(1);
}
