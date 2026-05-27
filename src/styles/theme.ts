/**
 * 톤앤매너 Single Source of Truth (TypeScript 파트).
 *
 * 색상 자체는 src/styles/theme.css의 @theme 블록에서 정의된다.
 * 이 파일은 자주 반복되는 클래스 조합(그라데이션, primary 버튼 등)을
 * 의미 단위 상수로 묶어 컴포넌트가 import해 쓰도록 한다.
 *
 * 사용 예:
 *   import { tone } from '@/styles/theme';
 *   <button className={`px-4 py-2 rounded-lg ${tone.primarySolid}`}>예매</button>
 *   <div className={`${tone.brandGradient} ${tone.brandGradientHover}`}> ... </div>
 */

export const tone = {
  /** 1차 CTA (로그인/예매/결제 등 메인 솔리드 버튼) */
  primarySolid:
    'bg-brand text-white hover:bg-brand-hover transition-colors',

  /** 1차 outline (취소/홈으로 등 보조 버튼) */
  primaryOutline:
    'border-2 border-brand text-brand hover:bg-brand-soft transition-colors',

  /** 메인 그라데이션 (히어로 / 티켓 헤더 / 결제 메인 CTA) */
  brandGradient: 'bg-gradient-to-r from-brand to-accent',
  brandGradientHover: 'hover:from-brand-hover hover:to-accent-hover',

  /** 세로(br) 약한 그라데이션 (QR placeholder, soft 카드) */
  brandGradientSoft: 'bg-gradient-to-br from-brand-soft to-accent-soft',

  /** 텍스트 강조 (가격, 강조 단어) */
  brandText: 'text-brand',
  brandTextHover: 'group-hover:text-brand',
  accentText: 'text-accent',

  /** 약한 배경 (badge, info 카드) */
  brandSoft: 'bg-brand-soft text-brand-soft-fg',
  accentSoft: 'bg-accent-soft text-accent-soft-fg',

  /** 로딩 스피너 색 */
  spinner: 'text-brand',

  /** focus ring */
  focusRing: 'focus:ring-2 focus:ring-brand-ring',
} as const;

export type ToneKey = keyof typeof tone;
