# AI Product/Service Confirmation Application Form

AI 제품서비스 확인 신청 폼 구현 프로젝트입니다.

## Current Version

- Initial source: `index.html`
- Imported from the draft HTML file supplied by the user on 2026-06-08.

## Development Notes

- `index.html` is the current single-file application entry point.
- Keep major form changes in Git commits so each version can be reviewed or restored.
- Form behavior and field rules are documented in [docs/form-spec.md](docs/form-spec.md).
- Pilot API behavior and local JSON storage rules are documented in [docs/api-spec.md](docs/api-spec.md).
- Enterprise-facing writing guidance is documented in [docs/company-guide.md](docs/company-guide.md), with a PDF-ready HTML version at [docs/company-guide.html](docs/company-guide.html) and a distributable PDF at [docs/AI제품서비스확인_기업작성가이드_v0.4.pdf](docs/AI제품서비스확인_기업작성가이드_v0.4.pdf).
- `review.html` renders submitted JSON as a review specification with TTA checklist fields.
- `pilot-backend/` contains a local-only pilot API adapter for demo submissions.

## Local Pilot Server

Node.js가 설치되어 있으면 별도 패키지 설치 없이 로컬 시연 서버를 실행할 수 있습니다.

1. Node.js 설치 여부를 확인합니다.

   ```powershell
   node -v
   ```

2. 프로젝트 폴더에서 파일럿 서버를 실행합니다.

   ```powershell
   node pilot-backend\server.js
   ```

3. 브라우저에서 신청 폼을 엽니다.

   ```text
   http://127.0.0.1:8010/index.html
   ```

4. API 제출 모드로 시연하려면 브라우저 개발자 도구 콘솔에서 아래 값을 설정한 뒤 새로고침합니다.

   ```javascript
   localStorage.setItem('aiFormSubmitMode', 'api');
   localStorage.setItem('aiFormApiBaseUrl', 'http://127.0.0.1:8010');
   ```

5. 신청서를 제출하면 JSON 데이터가 로컬에 저장되고, `review.html?id=...&source=api` 화면에서 조회됩니다.

저장 위치:

```text
pilot-backend\data\applications
```

정적 모드로 되돌리려면 아래 값을 실행한 뒤 새로고침합니다.

```javascript
localStorage.setItem('aiFormSubmitMode', 'static');
```

## Suggested Next Steps

1. Review the current form behavior and text.
2. Separate structure, styles, and scripts if the form grows beyond a single HTML file.
3. Connect submission handling or export logic when the target workflow is confirmed.
