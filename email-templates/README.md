# ditto! 이메일 템플릿

사전신청자 대상 발송용 이메일 HTML 템플릿 2종. 발송 도구(Stibee·Mailchimp·Resend 등)에 그대로 붙여넣어 사용.

## 파일

| 파일 | 용도 |
|---|---|
| `confirmation.html` | 사전신청 확인 메일 — "사전신청이 완료되었어요!" |
| `launch.html` | 출시 알림 메일 — "드디어 출시됐어요" + App Store 다운로드 |
| `preview-*.png` | 각 템플릿 렌더 미리보기 |

## 채워야 할 병합 태그

발송 도구의 병합 문법에 맞게 치환(대부분 `{{...}}` 그대로 인식):

- `{{unsubscribe_url}}` — 수신거부 링크 (법적 필수, 두 템플릿 공통)
- `{{app_store_url}}` — App Store 앱 링크 (launch.html)

## 이미지 호스팅

이미지는 `https://ditto.at/email/` 에 호스팅됨 (ditto-landing 리포 `/email` 폴더):
- `wordmark-white.png` — 헤더 워드마크
- `phone.png` — 앱 미리보기
- `hero.png` — OG 카드(예비)

이미지를 바꾸려면 ditto-landing 리포의 `/email` 폴더를 교체 후 push.

## 설계 메모

- 테이블 레이아웃 + 인라인 스타일 (Gmail·Outlook·네이버·애플메일 호환)
- 그라데이션 미지원 클라이언트(Outlook)는 단색 퍼플 `#b46ce0`로 폴백
- 한글 폰트는 시스템 스택(Apple SD Gothic Neo / Malgun Gothic) — 이메일은 커스텀 폰트 임베드 불가
- flexbox·외부 CSS·JS 미사용
