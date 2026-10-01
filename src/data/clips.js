/* Реальный контент галерей: public/motion/<folder>/<file> (mp4 + jpg).
   iw/ih — реальные размеры файла (ffprobe): высота карточки фиксирована,
   ширина = cardH * iw / ih. */

export const CLIPS = {
  fidelity: [
    { h: "g09", src: "/motion/ux%20also/g09.mp4", iw: 1500, ih: 830 },
    { h: "g10", src: "/motion/ux%20also/g10.mp4", iw: 1280, ih: 998 },
    { h: "g15", src: "/motion/ux%20also/g15.mp4", iw: 1600, ih: 900, hd: "/motion/ux%20also/g15.hd.mp4" },
    { h: "g20", src: "/motion/ux%20also/g20.mp4", iw: 480, ih: 380 },
    { h: "n08", src: "/motion/ux%20also/n08.mp4", iw: 406, ih: 720, hd: "/motion/ux%20also/n08.hd.mp4" },
    { h: "n09", src: "/motion/ux%20also/n09.mp4", iw: 406, ih: 720, hd: "/motion/ux%20also/n09.hd.mp4" },
    { h: "n14", src: "/motion/ux%20also/n14.mp4", iw: 720, ih: 398, hd: "/motion/ux%20also/n14.hd.mp4" },
    { h: "n19", src: "/motion/ux%20also/n19.mp4", iw: 400, ih: 396 },
    { h: "p03", src: "/motion/ux%20also/p03.jpg", iw: 720, ih: 415, hd: "/motion/ux%20also/p03.hd.jpg" },
    { h: "p09", src: "/motion/ux%20also/p09.jpg", iw: 720, ih: 253, hd: "/motion/ux%20also/p09.hd.jpg" },
    { h: "p15", src: "/motion/ux%20also/p15.jpg", iw: 720, ih: 345, hd: "/motion/ux%20also/p15.hd.jpg" },
  ],
  systems: [
    { h: "g05", src: "/motion/systems/g05.mp4", iw: 900, ih: 702 },
    { h: "g06", src: "/motion/systems/g06.mp4", iw: 864, ih: 800 },
    { h: "g11", src: "/motion/systems/g11.mp4", iw: 1024, ih: 80 },
    { h: "g16", src: "/motion/systems/g16.mp4", iw: 480, ih: 516 },
    { h: "n04", src: "/motion/systems/n04.mp4", iw: 720, ih: 394 },
    { h: "n05", src: "/motion/systems/n05.mp4", iw: 720, ih: 382, hd: "/motion/systems/n05.hd.mp4" },
    { h: "n10", src: "/motion/systems/n10.mp4", iw: 720, ih: 406, hd: "/motion/systems/n10.hd.mp4" },
    { h: "n15", src: "/motion/systems/n15.mp4", iw: 720, ih: 406, hd: "/motion/systems/n15.hd.mp4" },
    { h: "p02", src: "/motion/systems/p02.jpg", iw: 720, ih: 253, hd: "/motion/systems/p02.hd.jpg" },
    { h: "p08", src: "/motion/systems/p08.jpg", iw: 720, ih: 415, hd: "/motion/systems/p08.hd.jpg" },
    { h: "p14", src: "/motion/systems/p14.jpg", iw: 720, ih: 415, hd: "/motion/systems/p14.hd.jpg" },
    { h: "p20", src: "/motion/systems/p20.jpg", iw: 720, ih: 415, hd: "/motion/systems/p20.hd.jpg" },
  ],
  motion: [
    { h: "g01", src: "/motion/motion/g01.mp4", iw: 1526, ih: 618 },
    { h: "g02", src: "/motion/motion/g02.mp4", iw: 1600, ih: 816, hd: "/motion/motion/g02.hd.mp4" },
    { h: "g07", src: "/motion/motion/g07.mp4", iw: 576, ih: 592 },
    { h: "g12", src: "/motion/motion/g12.mp4", iw: 1024, ih: 80 },
    { h: "g25", src: "/motion/motion/g25.mp4", iw: 480, ih: 270 },
    { h: "n01", src: "/motion/motion/n01.mp4", iw: 406, ih: 720, hd: "/motion/motion/n01.hd.mp4" },
    { h: "n06", src: "/motion/motion/n06.mp4", iw: 406, ih: 720, hd: "/motion/motion/n06.hd.mp4" },
    { h: "n11", src: "/motion/motion/n11.mp4", iw: 600, ih: 378 },
    { h: "p01", src: "/motion/motion/p01.jpg", iw: 720, ih: 345, hd: "/motion/motion/p01.hd.jpg" },
    { h: "p07", src: "/motion/motion/p07.jpg", iw: 720, ih: 253, hd: "/motion/motion/p07.hd.jpg" },
    { h: "p13", src: "/motion/motion/p13.jpg", iw: 720, ih: 253, hd: "/motion/motion/p13.hd.jpg" },
    { h: "p19", src: "/motion/motion/p19.jpg", iw: 720, ih: 253, hd: "/motion/motion/p19.hd.jpg" },
  ],
  qa: [
    { h: "g13", src: "/motion/qa/g13.mp4", iw: 400, ih: 712 },
    { h: "g14", src: "/motion/qa/g14.mp4", iw: 400, ih: 712 },
    { h: "g19", src: "/motion/qa/g19.mp4", iw: 480, ih: 476 },
    { h: "g24", src: "/motion/qa/g24.mp4", iw: 480, ih: 314 },
    { h: "n12", src: "/motion/qa/n12.mp4", iw: 720, ih: 720, hd: "/motion/qa/n12.hd.mp4" },
    { h: "n13", src: "/motion/qa/n13.mp4", iw: 720, ih: 388, hd: "/motion/qa/n13.hd.mp4" },
    { h: "n18", src: "/motion/qa/n18.mp4", iw: 340, ih: 720, hd: "/motion/qa/n18.hd.mp4" },
    { h: "p04", src: "/motion/qa/p04.jpg", iw: 720, ih: 345, hd: "/motion/qa/p04.hd.jpg" },
    { h: "p10", src: "/motion/qa/p10.jpg", iw: 720, ih: 345, hd: "/motion/qa/p10.hd.jpg" },
    { h: "p16", src: "/motion/qa/p16.jpg", iw: 720, ih: 253, hd: "/motion/qa/p16.hd.jpg" },
  ],
  ai: [
    { h: "g04", src: "/motion/ai/g04.mp4", iw: 1306, ih: 1120 },
    { h: "g17", src: "/motion/ai/g17.mp4", iw: 800, ih: 434 },
    { h: "g18", src: "/motion/ai/g18.mp4", iw: 400, ih: 222, hd: "/motion/ai/g18.hd.mp4" },
    { h: "g23", src: "/motion/ai/g23.mp4", iw: 480, ih: 284 },
    { h: "n03", src: "/motion/ai/n03.mp4", iw: 720, ih: 368, hd: "/motion/ai/n03.hd.mp4" },
    { h: "n16", src: "/motion/ai/n16.mp4", iw: 720, ih: 390, hd: "/motion/ai/n16.hd.mp4" },
    { h: "n17", src: "/motion/ai/n17.mp4", iw: 720, ih: 720, hd: "/motion/ai/n17.hd.mp4" },
    { h: "p05", src: "/motion/ai/p05.jpg", iw: 720, ih: 253, hd: "/motion/ai/p05.hd.jpg" },
    { h: "p11", src: "/motion/ai/p11.jpg", iw: 720, ih: 415, hd: "/motion/ai/p11.hd.jpg" },
    { h: "p17", src: "/motion/ai/p17.jpg", iw: 720, ih: 415, hd: "/motion/ai/p17.hd.jpg" },
  ],
  ui: [
    { h: "g03", src: "/motion/ui/g03.mp4", iw: 1600, ih: 876, hd: "/motion/ui/g03.hd.mp4" },
    { h: "g08", src: "/motion/ui/g08.mp4", iw: 1600, ih: 848, hd: "/motion/ui/g08.hd.mp4" },
    { h: "g21", src: "/motion/ui/g21.mp4", iw: 800, ih: 468 },
    { h: "g22", src: "/motion/ui/g22.mp4", iw: 800, ih: 526 },
    { h: "n02", src: "/motion/ui/n02.mp4", iw: 340, ih: 720, hd: "/motion/ui/n02.hd.mp4" },
    { h: "n07", src: "/motion/ui/n07.mp4", iw: 720, ih: 406, hd: "/motion/ui/n07.hd.mp4" },
    { h: "n20", src: "/motion/ui/n20.mp4", iw: 720, ih: 544, hd: "/motion/ui/n20.hd.mp4" },
    { h: "p06", src: "/motion/ui/p06.jpg", iw: 720, ih: 345, hd: "/motion/ui/p06.hd.jpg" },
    { h: "p12", src: "/motion/ui/p12.jpg", iw: 720, ih: 345, hd: "/motion/ui/p12.hd.jpg" },
    { h: "p18", src: "/motion/ui/p18.jpg", iw: 720, ih: 345, hd: "/motion/ui/p18.hd.jpg" },
  ],
};

/* Путы относительно base (GitHub Pages /ui-design/ и любой другой префикс) */
const BASE = import.meta.env.BASE_URL;
for (const gallery of Object.values(CLIPS)) {
  for (const clip of gallery) {
    clip.src = BASE + clip.src.slice(1);
    if (clip.hd) clip.hd = BASE + clip.hd.slice(1);
  }
}
