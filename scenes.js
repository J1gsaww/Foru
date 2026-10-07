/* ============================================================
   scenes.js — ภาพฉากทั้งหมด
   ------------------------------------------------------------
   img : ไฟล์ภาพ (ย่อ/ตัดขอบแล้วจาก assets/Scene → assets/web)
   bg  : สีพื้นหลังเพลน ๆ ที่ดึงโทนมาจากภาพ
   fit : 'contain' = วางภาพกลางกระดาษ   'cover' = ภาพเต็มพื้นที่
   fx  : เอฟเฟกต์ของฉาก  'still' = ภาพนิ่ง   'ripple' = น้ำกระเพื่อม   'glow' = แสงเรือง
   ============================================================ */

const SCENES = {
  lake:    { img: 'assets/web/lake.webp',    bg: '#f6e9de', fit: 'contain' },
  hut:     { img: 'assets/web/hut.webp',     bg: '#f3e9e0', fit: 'contain' },
  door:    { img: 'assets/web/door.webp',    bg: '#f5e7dd', fit: 'contain' },
  garden:  { img: 'assets/web/garden.webp',  bg: '#f5ebdc', fit: 'contain' },
  pov:     { img: 'assets/web/pov.webp',     bg: '#faf0e7', fit: 'contain', fx: 'still' },
  store:   { img: 'assets/web/store.webp',   bg: '#f1e5d6', fit: 'contain' },
  storein: { img: 'assets/web/storein.webp', bg: '#f2e7db', fit: 'contain' },
  river:   { img: 'assets/web/river.webp',   bg: '#faf1e9', fit: 'cover',   fx: 'ripple' },
  shadow:  { img: 'assets/web/shadow.webp',  bg: '#f7ede6', fit: 'cover',   fx: 'ripple' },
  smiley:  { img: 'assets/web/smiley.webp',  bg: '#f7ede6', fit: 'cover',   fx: 'ripple' },
  piano:   { img: 'assets/web/piano.webp',   bg: '#f2e7dd', fit: 'contain' },
  // ---- ฉากย่อย ----
  'hydra-close': { img: 'assets/web/hydra-close.webp', bg: '#f1e8de', fit: 'contain', fx: 'still' },
  'cat-awake':   { img: 'assets/web/cat-awake.webp',   bg: '#f2e9e0', fit: 'contain' },
  'girl-peek':   { img: 'assets/web/girl-peek.webp',   bg: '#f8eee3', fit: 'contain', fx: 'glow' },
  'cat-tree':    { img: 'assets/web/cat-tree.webp',    bg: '#f0e6da', fit: 'contain' },
  'girl-smile':  { img: 'assets/web/girl-smile.webp',  bg: '#f5e8dc', fit: 'contain', fx: 'glow' },
  'girl-run':    { img: 'assets/web/girl-run.webp',    bg: '#f4e6da', fit: 'contain', fx: 'push' },
  'curve':       { img: 'assets/web/curve.webp',       bg: '#f6eadf', fit: 'contain' },
  'cashier':     { img: 'assets/web/cashier.webp',     bg: '#f4e5d7', fit: 'contain', fx: 'glow' },
  'cat-box':     { img: 'assets/web/cat-box.webp',     bg: '#f4e8db', fit: 'contain' },
  'cat-piano':   { img: 'assets/web/cat-piano.webp',   bg: '#f6ebe0', fit: 'contain' },
  'two-girls':   { img: 'assets/web/two-girls.webp',   bg: '#f8eada', fit: 'contain', fx: 'glow' },
  'two-close':   { img: 'assets/web/two-close.webp',   bg: '#f8e9d8', fit: 'contain', fx: 'glow' },
  'hydra-chest': { img: 'assets/web/hydra-chest.webp', bg: '#f8f1e9', fit: 'contain', fx: 'still' },
  'light-chest': { img: 'assets/web/light-chest.webp', bg: '#f5ebe2', fit: 'contain', fx: 'heart' },
};
