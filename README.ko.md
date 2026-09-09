[中文](./README.md) · [English](./README.en.md) · [日本語](./README.ja.md) · [Deutsch](./README.de.md) · [한국어](./README.ko.md)

# Résumé Studio · 로컬 우선 이력서 편집 스튜디오

> 디자인 지식이 없어도 이력서를 "Apple 전문 문서" 급의 작품으로 완성할 수 있습니다. WYSIWYG, 정밀한 A4 페이지 분할, 5개 언어 단일 소스.
> **모든 것은 브라우저 내에서만 동작합니다: 백엔드·계정·업로드 없음 — 당신의 데이터는 절대 건드리지 않습니다.**

[![Try Online](https://img.shields.io/badge/%E2%96%B6%20Try%20Online-R%C3%A9sum%C3%A9%20Studio-2563eb?style=for-the-badge)](https://jingyu525.github.io/resume/)
[![Local-First](https://img.shields.io/badge/privacy-local--first-22c55e?style=for-the-badge)]()
[![Open Source](https://img.shields.io/badge/open--source-source--available-6b7280?style=for-the-badge)]()

![Résumé Studio 미리보기](./public/og-cover.png)

## 왜 Résumé Studio인가

- **디자인 소양 0이어도 작품급 퀄리티** —— Word의 여백·페이지 나누기와 씨름할 필요 없이, 누르는 곳마다 편집하고 실시간으로 확인.
- **데이터는 항상 당신의 손끝에** —— 통신하지 않고, 수집하지 않고, 업로드하지 않습니다. 탭을 닫으면 가지고 갈 수 있고, 캐시를 지우면 사라집니다.
- **한 번 편집, 다섯 언어 배포** —— 중 / 영 / 일 / 독 / 한, UI와 본문이 동기화되어 전환되고, 언어가 부족하면 자동 폴백.
- **무료·오픈소스·투명** —— 코드는 공개되고 추적 가능하며, 구현은 블랙박스가 아닙니다.

## 온라인으로 체험

설치 불필요, 열기만 하면 사용: **https://jingyu525.github.io/resume/**

## 핵심 기능

- **WYSIWYG + 정밀 A4 페이지 분할**: 하나의 블록이 페이지를 넘지 않고, 섹션 제목이 홀로 남지 않으며, 하단 안전 영역, 실시간 총 페이지 수, 미리보기 자동 축소.
- **그 자리에서 편집**: 미리보기의 텍스트를 눌러 편집; 선택 팝오버는 굵게 / 강조색 / 서식 초기화 세 가지 동작만 제공; 외부에서 붙여넣은 내용은 자동으로 정화되어 의미와 강조색만 남깁니다.
- **외관의 네 차원**: 주색, 레이아웃(단일 칸 / 사이드바 두 칸), 톤(정중 / 부드러움 / 생동감), 간격 슬라이더, 기본값 원클릭 복원.
- **다섯 언어 단일 소스**: 중 / 영 / 일 / 독 / 한, UI와 이력서 본문이 동기화되어 전환, 자동 폴백.
- **로컬 우선**: 브라우저에 자동 저장되어 새로고침해도 사라지지 않음; 검증된 백업 파일 내보내기 / 가져오기 지원.
- **실행 취소 / 다시 실행**: 연속 입력은 한 단계로 병합; `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl+Y` 지원.
- **PDF 내보내기 / 저장**: 원클릭 PDF 내보내기, 시스템 바닥글 없음, 화면 전용 요소는 용지에 올라가지 않음.

## 개인정보 약속

우리는 당신의 데이터를 일절 저장하지 않습니다. 백엔드·계정·업로드 없음 —— 탭을 닫으면 가지고 갈 수 있고, 캐시를 지우면 사라집니다. 이것이 대부분의 SaaS 이력서 도구와 근본적으로 다른 점입니다.

## 빠른 시작 (로컬 개발)

```bash
npm install
npm run dev        # 로컬 개발 (기본 http://localhost:5173)
```

- `/` —— 마케팅 랜딩 페이지
- `/editor` —— 이력서 편집기

## 사용 가능한 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 타입 체크 + 프로덕션 빌드 |
| `npm run preview` | 프로덕션 빌드 미리보기 |
| `npm run lint` | ESLint 검사 |
| `npm run typecheck` | 타입 체크만 |
| `npm run test` | Vitest 테스트 실행 |

## 기술 스택

Vite 7 · React 19 · TypeScript (strict) · Tailwind CSS v4 · Zustand + zundo · DOMPurify · lucide-react · Vitest

코드는 **Feature-Sliced Design**으로 계층화: `app → pages → widgets → features → entities → shared`.
계층 구조, 상태 흐름, 주요 모듈 설계는 [`ARCHITECTURE.md`](./ARCHITECTURE.md) 참고.

## 디렉터리 개요

```
src/
├── app/        # 진입점, providers(I18n/Theme/Toast), 라우팅, 전역 스타일
├── pages/      # landing(마케팅), editor
├── widgets/    # landing-hero/features/footer, editor-toolbar, preview-pane
├── features/   # resume-editing, inline-richtext, appearance-control, language-switch,
│               # undo-redo, persistence, backup-io, pagination, print-export
├── entities/   # resume / appearance / locale 모델
├── shared/     # ui(shadcn 스타일 컴포넌트), lib, types, config, i18n(5개 언어 사전)
└── store/      # Zustand store(zundo undo/redo 포함), 마이그레이션 및 영속화
tests/          # 핵심 순수 로직 단위 테스트: sanitize / pagination / i18n fallback / undo merge / migration
```

---

Résumé Studio는 오픈소스 프로젝트입니다. Star와 기여를 환영합니다. 예시 문구와 플레이스홀더는 데모용이며, 자신의 정보로 바꾸어 사용하세요.