# Saju-On

사주 정보를 기반으로 게임 파티를 만들고, 참여하고, 파티원 간 오행 궁합을 확인할 수 있는 Spring Boot + MyBatis 백엔드 프로젝트입니다.

## 기술 스택

- Java 21
- Spring Boot 3.5.16
- Spring Web, Spring Security, Validation
- MyBatis
- MySQL
- JWT
- WebSocket
- Swagger UI
- Gradle

## 프로젝트 구조

```text
Final_Project
├── demo/                 # Spring Boot 백엔드
│   ├── src/main/java/com/example/demo
│   │   ├── domain/party  # 파티, 파티원, 채팅 도메인
│   │   ├── domain/saju   # 사주, 오행, 궁합 도메인
│   │   └── global        # 인증/JWT 등 공통 영역
│   └── src/main/resources
│       ├── mapper        # MyBatis XML Mapper
│       ├── schema.sql
│       └── data.sql
└── front/                # 프론트엔드
```

## 실행 방법

### 1. 환경 변수 설정

`demo` 실행 전 `.env` 또는 `.env.local`에 아래 값을 설정합니다.

```properties
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_jwt_secret
SAJU_BASE_URL=your_saju_api_base_url
SAJU_API_KEY=your_saju_api_key
GEMINI_API_KEY=your_gemini_api_key
```

기본 DB 연결 정보는 다음과 같습니다.

```text
jdbc:mysql://localhost:3306/sajugame?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
```

### 2. 백엔드 실행

```bash
cd demo
./gradlew bootRun
```

Windows PowerShell에서는 다음 명령을 사용할 수 있습니다.

```powershell
cd demo
.\gradlew.bat bootRun
```

서버 기본 주소는 `http://localhost:8080`입니다.

## PartyService 개요

`PartyService`는 파티 생성, 조회, 수정, 삭제, 강퇴, 파티 목록 정렬, 파티원 조회, 파티 오행 궁합 계산을 담당합니다.

위치:

```text
demo/src/main/java/com/example/demo/domain/party/service/PartyService.java
```

주요 의존성:

- `PartyMapper`: 파티 생성, 조회, 수정, 삭제, 인원 수 및 상태 변경
- `PartyMemberMapper`: 파티원 조회, 승인 상태 조회, 파티원 상태 변경
- `SajuMapper`: 사용자 사주 및 오행 정보 조회
- `ChemistryService`: 그룹 오행 합산 및 부족한 오행 계산
- `PartyChatNotifier`: 파티 변경 사항을 시스템 메시지로 알림

## PartyService 주요 기능

### 파티 생성

`createParty(Long userId, PartyCreateRequest request)`

- 사주 정보가 등록된 사용자만 파티를 생성할 수 있습니다.
- 이미 참여 중인 파티가 있으면 새 파티를 생성할 수 없습니다.
- 파티 생성자는 자동으로 `APPROVED` 상태의 파티원으로 등록됩니다.
- 생성 시 현재 인원은 1명, 상태는 `RECRUITING`으로 시작합니다.

### 파티 삭제

`deleteParty(Long userId, Long partyId)`

- 존재하지 않는 파티는 `404 NOT_FOUND`를 반환합니다.
- 파티장만 삭제할 수 있습니다.

### 파티원 강퇴

`deletePartyMember(Long hostId, Long partyId, Long targetUserId)`

- 파티장만 다른 파티원을 강퇴할 수 있습니다.
- 파티장은 자기 자신을 강퇴할 수 없습니다.
- 강퇴 대상 파티원의 상태를 `KICKED`로 변경합니다.
- 현재 인원 수를 1명 감소시킵니다.
- 파티가 `FULL` 상태였다면 `RECRUITING`으로 되돌립니다.
- 강퇴 시스템 메시지를 채팅에 전송합니다.

### 파티 수정

`updateParty(Long userId, Long partyId, PartyUpdateRequest request)`

- 파티장만 파티 정보를 수정할 수 있습니다.
- 제목과 궁합 유형을 선택적으로 수정합니다.
- 수정 완료 후 시스템 메시지를 채팅에 전송합니다.

### 파티 단건 조회

`getParty(Long partyId)`

- `partyId`에 해당하는 파티를 조회합니다.
- 파티가 없으면 `404 NOT_FOUND`를 반환합니다.

### 파티 목록 조회 및 정렬

`getPartyList(PartySortBy sortBy, boolean ascending, AuthenticatedUser user, Long gameId)`

- 파티 목록을 조회합니다.
- `gameId`가 있으면 특정 게임의 파티만 필터링합니다.
- 정렬 기준을 지정할 수 있습니다.
- 사용자가 현재 참여 중인 파티는 응답의 `joined` 값이 `true`로 설정됩니다.

지원 정렬 기준:

| 값 | 설명 |
| --- | --- |
| `TITLE` | 게임 이름 기준 정렬 |
| `GENRE` | 게임 장르 기준 정렬 |
| `MEMBER_COUNT` | 현재 파티 인원 기준 정렬 |
| `WOOD` | 목 오행 합계 기준 정렬 |
| `FIRE` | 화 오행 합계 기준 정렬 |
| `EARTH` | 토 오행 합계 기준 정렬 |
| `METAL` | 금 오행 합계 기준 정렬 |
| `WATER` | 수 오행 합계 기준 정렬 |
| `CHEMISTRY_MATCH` | 사용자의 부족한 오행을 기준으로 추천 정렬 |

지원 궁합 유형:

| 값 | 설명 |
| --- | --- |
| `SYNERGY` | 시너지 중심 궁합 |
| `RIVAL` | 경쟁 중심 궁합 |
| `BALANCED` | 균형 중심 궁합 |

### 파티원 목록 조회

`getPartyMembers(Long partyId)`

- 승인된 파티원 userId 목록을 조회합니다.
- 각 파티원의 사주 동물 이름을 함께 반환합니다.

### 파티 오행 궁합 조회

`getPartyChemistry(Long partyId)`

- 승인된 파티원들의 오행 프로필을 합산합니다.
- `ChemistryService`를 통해 그룹 오행 요약 정보를 반환합니다.

## 파티 API 요약

기본 경로는 `/api/party`입니다.

| Method | Path | 설명 |
| --- | --- | --- |
| `POST` | `/create` | 파티 생성 |
| `DELETE` | `/delete/{partyId}` | 파티 삭제 |
| `DELETE` | `/{partyId}/kicked/{userId}` | 파티원 강퇴 |
| `PATCH` | `/{partyId}` | 파티 수정 |
| `POST` | `/{partyId}/join` | 파티 참여 |
| `POST` | `/{partyId}/leave` | 파티 나가기 |
| `GET` | `/{partyId}` | 파티 단건 조회 |
| `GET` | `/party-list` | 파티 목록 조회 |
| `GET` | `/{partyId}/members` | 파티원 목록 조회 |
| `GET` | `/{partyId}/chemistry` | 파티 오행 궁합 조회 |

## 요청 예시

### 파티 생성

```http
POST /api/party/create
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "오늘 같이 게임할 파티",
  "gameId": 1,
  "maxMemberCount": 5,
  "chemistryType": "BALANCED"
}
```

### 파티 목록 조회

```http
GET /api/party/party-list?sortBy=CHEMISTRY_MATCH&ascending=false&gameId=1
Authorization: Bearer {accessToken}
```

### 파티 수정

```http
PATCH /api/party/1
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "랭크 같이 돌릴 파티",
  "chemistryType": "SYNERGY"
}
```

## 주요 비즈니스 규칙

- 사주 정보가 없는 사용자는 파티 생성 또는 참여가 불가능합니다.
- 한 사용자는 동시에 하나의 승인된 파티에만 참여할 수 있습니다.
- 파티장은 파티를 나갈 수 없고, 삭제만 할 수 있습니다.
- 파티 인원이 최대 인원에 도달하면 상태가 `FULL`로 변경됩니다.
- `FULL` 상태의 파티에서 인원이 줄어들면 상태가 `RECRUITING`으로 변경됩니다.
- 강퇴 또는 수정 같은 주요 이벤트는 시스템 채팅 메시지로 전송됩니다.

## 테스트

```bash
cd demo
./gradlew test
```

Windows PowerShell:

```powershell
cd demo
.\gradlew.bat test
```
