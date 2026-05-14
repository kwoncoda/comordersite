/* ============================================================
   목 데이터
   - 메뉴 8개 본명 (G10) + PUBG 회복 아이템 매핑 (DESIGN §10.5)
   - 아이템 이미지 부재 시 fallback: 분류 이모지 (ADR-006)
   ============================================================ */

window.MENUS = [
  { id: 'm1', cat: '치킨',    name: '후라이드',         price: 18000, img: 'assets/items/bandage.webp',    tag: 'BANDAGE',    sub: '회복량 +10',    recommended: true,  sold: false },
  { id: 'm2', cat: '치킨',    name: '양념',            price: 19000, img: 'assets/items/first-aid.webp',  tag: 'FIRST_AID',  sub: '회복량 +75',    recommended: false, sold: false },
  { id: 'm3', cat: '치킨',    name: '뿌링클',          price: 21000, img: 'assets/items/med-kit.webp',    tag: 'MED_KIT',    sub: '회복량 +100',   recommended: true,  sold: false },
  { id: 'm4', cat: '사이드',  name: '감자튀김',         price: 5000,  img: 'assets/items/syringe.webp',    tag: 'SYRINGE',    sub: '부활',          recommended: false, sold: false },
  { id: 'm5', cat: '사이드',  name: '뿌링감자튀김',     price: 7000,  img: 'assets/items/defib.webp',      tag: 'DEFIB',      sub: '소생',          recommended: false, sold: true  },
  { id: 'm6', cat: '사이드',  name: '칠리스',          price: 6000,  img: 'assets/items/adrenaline.webp', tag: 'ADRENALINE', sub: '부스트 +100%', recommended: false, sold: false },
  { id: 'm7', cat: '음료',    name: '콜라',            price: 2000,  img: 'assets/items/painkiller.webp', tag: 'PAINKILLER', sub: '부스트 +60%',  recommended: false, sold: false },
  { id: 'm8', cat: '음료',    name: '사이다',          price: 2000,  img: 'assets/items/energy.webp',     tag: 'ENERGY',     sub: '부스트 +40%',  recommended: false, sold: false },
];

window.CATEGORIES = ['전체', '추천', '치킨', '사이드', '음료'];

// 본부 대시보드 목 주문 (A-2)
window.MOCK_ADMIN_ORDERS = [
  { id: 17, who: '홍길동',  sid: '202637042', bank: '카카오뱅크', amount: 21000, ago: 1,  status: 'ORDERED' },
  { id: 18, who: '박서연',  sid: '202637088', bank: '국민',     amount: 18000, ago: 2,  status: 'ORDERED' },
  { id: 15, who: '김철수',  sid: '202637015', bank: '카카오뱅크', amount: 25000, ago: 5,  status: 'TRANSFER_REPORTED', warn: 'warn' },
  { id: 16, who: '정수민',  sid: '',          bank: '신한',     amount: 7000,  ago: 11, status: 'TRANSFER_REPORTED', warn: 'danger', external: true },
  { id: 19, who: '이슬기',  sid: '202637072', bank: '국민',     amount: 12000, ago: 3,  status: 'TRANSFER_REPORTED' },
  { id: 14, who: '이영희',  sid: '202637101', bank: '국민',     amount: 24000, ago: 2,  status: 'PAID' },
  { id: 12, who: '최예진',  sid: '202637033', bank: '국민',     amount: 19000, ago: 6,  status: 'PAID' },
  { id: 13, who: '박민수',  sid: '202637055', bank: '카카오뱅크', amount: 15000, ago: 4,  status: 'COOKING' },
  { id: 11, who: '한지원',  sid: '202637029', bank: '국민',     amount: 23000, ago: 8,  status: 'COOKING' },
  { id: 10, who: '윤재인',  sid: '202637051', bank: '카카오뱅크', amount: 8000,  ago: 10, status: 'READY' },
  { id: 9,  who: '강민지',  sid: '202637007', bank: '국민',     amount: 14000, ago: 12, status: 'READY' },
  { id: 8,  who: '서나래',  sid: '202637039', bank: '신한',     amount: 7500,  ago: 1,  status: 'HOLD', note: '이름 불일치' },
];

/* ============================================================
   ORDER STATE MACHINE — USER_FLOW §7.1 (8개 상태)
   ============================================================ */
window.STATE_FLOW = ['ORDERED','TRANSFER_REPORTED','PAID','COOKING','READY','DONE'];
window.STATE_LABEL = {
  ORDERED:           '주문 중',
  TRANSFER_REPORTED: '이체 확인 요청',
  PAID:              '이체 완료',
  COOKING:           '조리 중',
  READY:             '수령 대기',
  DONE:              '완료',
  HOLD:              '보류',
  CANCELED:          '취소',
};

/* COPY — UX_STRATEGY §7.4 카피 (사용자 화면 단계별) */
window.STAGE_COPY = {
  ORDERED:           { big: '주문이 접수되었어요!',                  sub: '이체 후 "확인 요청" 버튼을 꼭 눌러주세요.', emoji: '📋' },
  TRANSFER_REPORTED: { big: '입금 확인 중이에요 👀',                 sub: '본부에서 통장을 대조하고 있습니다.', emoji: '💸' },
  PAID:              { big: '🍗 입금 확인 완료!',                   sub: '곧 치킨이 출동합니다.',         emoji: '✓' },
  COOKING:           { big: '🔥 지금 치킨이 기름 속으로 입장!',       sub: '맛있게 튀겨지는 중이에요.',     emoji: '🔥' },
  READY:             { big: '✅ 수령 가능해요!',                    sub: '부스에서 호명을 들어주세요. 도그태그를 보여주세요.', emoji: '✅' },
  DONE:              { big: 'WINNER WINNER\nCHICKEN DINNER!',     sub: '맛있게 드세요. 🎉',           emoji: '🎉' },
  HOLD:              { big: '⚠️ 입금 정보가 안 맞아요',              sub: '이체 정보를 다시 확인해 주세요.', emoji: '⚠️' },
};
