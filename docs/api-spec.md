# AI 제품 서비스 확인 파일럿 API 명세

## 1. 문서 개요

| 항목 | 내용 |
| --- | --- |
| 문서명 | AI 제품 서비스 확인 파일럿 API 명세 |
| 대상 | `pilot-backend/server.js` |
| 용도 | 파일럿 시연용 신청서 제출, 조회 API의 동작 기준 정의 |
| 적용 범위 | 로컬 시연 서버, 정적 HTML 화면, 로컬 JSON 파일 저장 |

## 2. 구현 범위

| 구분 | 현재 구현 | 비고 |
| --- | --- | --- |
| 서버 런타임 | Node.js 기본 모듈 기반 HTTP 서버 | 별도 npm 패키지 없음 |
| 기본 주소 | `http://127.0.0.1:8010` | `PORT` 환경변수로 포트 변경 가능 |
| 데이터 저장 | 로컬 JSON 파일 | DB 미구현 |
| 저장 위치 | `pilot-backend/data/applications/*.json` | `.gitignore` 대상 |
| 파일 저장소 | 별도 파일 저장소 없음 | 제품 구조도는 JSON 내부 data URL로 포함 |
| 인증/권한 | 미구현 | 파일럿 시연용 |
| 개인정보 보호 정책 | 미구현 | 운영 전환 시 별도 설계 필요 |

본 API는 운영용 API가 아니라 파일럿 시연용 API이다. 현재는 PostgreSQL, MongoDB, SQLite 등 DB를 사용하지 않으며, 신청 데이터는 접수 ID별 JSON 파일로 저장한다.

## 3. 실행 방법

```powershell
node pilot-backend\server.js
```

실행 후 브라우저에서 아래 주소로 접속한다.

```text
http://127.0.0.1:8010/index.html
```

API 제출 모드로 전환하려면 브라우저 개발자 도구 콘솔에서 아래 값을 설정한다.

```javascript
localStorage.setItem('aiFormSubmitMode', 'api');
localStorage.setItem('aiFormApiBaseUrl', 'http://127.0.0.1:8010');
```

## 4. 엔드포인트

| 번호 | Method | Path | 용도 | 응답 |
| --- | --- | --- | --- | --- |
| 4.1 | `GET` | `/api/health` | 서버 상태 확인 | `{ "status": "ok" }` |
| 4.2 | `POST` | `/api/applications` | 신청서 JSON 접수 | 접수 ID |
| 4.3 | `GET` | `/api/applications` | 접수 목록 조회 | 접수 요약 배열 |
| 4.4 | `GET` | `/api/applications/{id}` | 접수 상세 조회 | 신청서 전체 JSON |

## 5. API 상세

### 5.1 상태 확인

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| Path | `/api/health` |
| 성공 응답 | `200 OK` |

응답 예시:

```json
{
  "status": "ok"
}
```

### 5.2 신청서 접수

| 항목 | 내용 |
| --- | --- |
| Method | `POST` |
| Path | `/api/applications` |
| Content-Type | `application/json` |
| 요청 본문 | 신청서 JSON |
| 성공 응답 | `201 Created` |
| 실패 응답 | `400 Invalid application payload` |
| 요청 크기 제한 | 약 10MB |

요청 본문은 `index.html`에서 생성하는 신청서 JSON을 사용한다. 서버는 별도 스키마 검증 없이 JSON 파싱 가능 여부와 저장 가능 여부만 확인한다.

성공 응답 예시:

```json
{
  "id": "3f8f7a6a-2f7c-4e43-ae94-5a8d5d8c56fd",
  "status": "created"
}
```

실패 응답 예시:

```json
{
  "error": "Invalid application payload"
}
```

### 5.3 접수 목록 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| Path | `/api/applications` |
| 성공 응답 | `200 OK` |
| 정렬 | 생성 시각 내림차순 |

응답 예시:

```json
[
  {
    "id": "3f8f7a6a-2f7c-4e43-ae94-5a8d5d8c56fd",
    "created_at": "2026-06-10T01:23:45.000Z",
    "status": "draft",
    "company_name": "주식회사 메디테크랩",
    "product_name": "Mediview AI 판독 보조 서비스"
  }
]
```

### 5.4 접수 상세 조회

| 항목 | 내용 |
| --- | --- |
| Method | `GET` |
| Path | `/api/applications/{id}` |
| 성공 응답 | `200 OK` |
| 실패 응답 | `404 Application not found` |

성공 응답은 저장된 신청서 JSON 전체를 반환한다.

실패 응답 예시:

```json
{
  "error": "Application not found"
}
```

## 6. 신청서 JSON 구조

| 필드 | 타입 | 내용 |
| --- | --- | --- |
| `schemaVersion` | string | 신청서 JSON 구조 버전 |
| `submittedAt` | string | 제출 또는 JSON 생성 시각 |
| `status` | string | 작성 상태 |
| `application` | object | 명세서 출력용 구조화 데이터 |
| `application.productRows` | array | 제품 정보 확인 표 데이터 |
| `application.productArchitecture` | object/null | 제품 구조도 이미지 데이터 |
| `application.companyRows` | array | 신청기업 정보 확인 표 데이터 |
| `application.categoryRows` | array | AI 제품 분류 확인 표 데이터 |
| `application.features` | array | 04번 AI 기능 목록 데이터 |
| `application.techDetails` | array | 05번 기능별 AI 구현 상세 데이터 |
| `application.certRows` | array | 기존 인증 및 시험 결과 데이터 |
| `applicantData` | array | 원본 입력 영역별 수집 데이터 |

제품 구조도 데이터:

| 필드 | 타입 | 내용 | 비고 |
| --- | --- | --- | --- |
| `name` | string | 파일명 | 예: `sample-product-architecture.png` |
| `size` | number | 파일 크기 | byte 단위 |
| `type` | string | MIME 타입 | `image/png` 또는 `image/jpeg` |
| `dataUrl` | string | 이미지 data URL | 검토/최종 명세서 이미지 출력에 사용 |

## 7. 저장 방식

| 항목 | 내용 |
| --- | --- |
| 저장 단위 | 접수 1건당 JSON 파일 1개 |
| 파일명 | `{id}.json` |
| ID 생성 | `crypto.randomUUID()` |
| 저장 경로 | `pilot-backend/data/applications` |
| 저장 데이터 | 요청 JSON + 서버 생성 `id`, `pilotMeta` |

저장 예시:

```text
pilot-backend/data/applications/3f8f7a6a-2f7c-4e43-ae94-5a8d5d8c56fd.json
```

## 8. 정적 모드와 API 모드

| 구분 | 정적 모드 | API 모드 |
| --- | --- | --- |
| 제출 저장 위치 | 브라우저 `sessionStorage` | 로컬 JSON 파일 |
| 화면 전환 | `review.html` | `review.html?id={id}&source=api` |
| 구조도 이미지 | sessionStorage에 data URL 저장 | JSON 파일에 data URL 저장 |
| 장점 | 서버 없이 간단히 확인 가능 | 제출/조회 흐름 시연 가능 |
| 제약 | 이미지가 큰 경우 브라우저 저장공간 부족 가능 | 로컬 서버 실행 필요 |

## 9. 운영 전환 시 추가 설계 필요사항

| 영역 | 필요 사항 |
| --- | --- |
| DB | PostgreSQL, MongoDB, SQLite 등 운영 저장소 선정 |
| 파일 저장 | 제품 구조도, 증빙자료, 인증서 파일 저장 정책 |
| 인증/권한 | 신청기업, 검토자, 관리자 권한 분리 |
| 개인정보 | 보관 기간, 파기 정책, 접근 로그, 암호화 |
| 상태 관리 | 접수, 검토중, 보완요청, 확인완료 등 워크플로우 |
| 검토 이력 | 검토 의견, 판정 변경 이력, 최종 출력본 이력 |
| 백업/복구 | DB 및 첨부파일 백업 정책 |
| 감사 로그 | 제출, 조회, 수정, 출력 행위 기록 |

## 10. 제한 사항

| 제한 | 내용 |
| --- | --- |
| DB 없음 | 현재 데이터는 로컬 JSON 파일로만 저장된다. |
| 파일 업로드 API 없음 | 제품 구조도는 JSON data URL로 포함되며, 별도 파일 업로드 엔드포인트는 없다. |
| 대용량 이미지 부적합 | 요청 본문 제한이 약 10MB이므로 큰 이미지는 제출 실패 가능성이 있다. |
| 동시성 제어 없음 | 같은 데이터에 대한 수정 충돌 관리가 없다. |
| 보안 기능 없음 | 인증, 권한, CSRF, rate limit 등이 없다. |
