export type Photo = {
  id: string;
  title: string;
  /** 팝업에 보여 주는 미리보기 이미지 */
  imageUrl: string;
  /** 사진을 누르면 새 탭에서 여는 주소 */
  openUrl: string;
  year?: string;
  /** 촬영자(커먼즈 사진) */
  credit?: string;
  /** 라이선스(커먼즈 사진) */
  license?: string;
};

export type Fetcher = typeof fetch;

// 별자리 이름만으로는 별자리와 무관한 사진이 섞이기 쉬워, 대표 천체가 있으면 그것으로 검색한다.
const FEATURED_OBJECT: Record<string, string> = {
  Ori: "Orion Nebula",
  Tau: "Crab Nebula",
  And: "Andromeda Galaxy",
  Lyr: "Ring Nebula",
  UMa: "Pinwheel Galaxy",
  Cyg: "Veil Nebula",
  Car: "Carina Nebula",
  Sgr: "Lagoon Nebula",
  Sco: "Antares",
  Her: "Hercules Cluster M13",
  Vir: "Sombrero Galaxy",
  Leo: "Leo Triplet galaxies",
  Cas: "Cassiopeia A",
  Aql: "Eagle Nebula",
  Cru: "Coalsack Nebula",
  Cen: "Omega Centauri",
  CMa: "Sirius star",
  Per: "Double Cluster",
  Gem: "Jellyfish Nebula",
  Peg: "Stephan's Quintet",
  Aqr: "Helix Nebula",
  Dor: "Tarantula Nebula",
};

export function photoSearchTerm(constellation: { id: string; nameEn: string }): string {
  return FEATURED_OBJECT[constellation.id] ?? `${constellation.nameEn} constellation`;
}
