# Pilot Backend

이 폴더는 운영용 백엔드가 아니라 파일럿 시연을 위한 로컬 API 어댑터입니다. Node.js 표준 라이브러리만 사용하므로 별도 패키지 설치 없이 실행할 수 있습니다.

## 책임 범위

- 신청서 JSON 접수
- 로컬 JSON 파일 저장
- 접수 목록 조회
- 접수 상세 조회

## 책임 범위 밖

- 운영 인증/권한
- 개인정보 보관 정책
- 운영 파일 저장
- 장애 대응
- 운영 배포

## 실행

```powershell
cd C:\Users\강지성\Documents\Codex\ai-product-service-form
node .\pilot-backend\server.js
```

시연 URL:

```text
http://127.0.0.1:8010/
http://127.0.0.1:8010/review.html
```

API 상태 확인:

```text
http://127.0.0.1:8010/api/health
```

## 프론트엔드 API 모드 전환

브라우저 개발자 도구 콘솔에서 다음 값을 설정하면 신청 페이지가 API 제출 모드로 동작합니다.

```js
localStorage.setItem('aiFormSubmitMode', 'api');
localStorage.setItem('aiFormApiBaseUrl', 'http://127.0.0.1:8010');
```

정적 시연 모드로 되돌리려면 다음을 실행합니다.

```js
localStorage.setItem('aiFormSubmitMode', 'static');
```

저장 데이터는 다음 폴더에 생성됩니다.

```text
pilot-backend/data/applications/
```
