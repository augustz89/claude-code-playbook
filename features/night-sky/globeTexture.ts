import { feature } from "topojson-client";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import atlas from "world-atlas/countries-110m.json";

import { sunAltitudeAt, sunPosition } from "./sky";

export const TEXTURE_WIDTH = 1024;
export const TEXTURE_HEIGHT = 512;

const OCEAN = "#2f6fb0";
const LAND = "#7bb274";
const SELECTED = "#f2b134";
const NIGHT_RGB = [18, 28, 78] as const;
/** 해가 뜨고 지는 순간의 태양 고도. 낮밤 경계는 이 고도에서 반투명이 된다. */
const BOUNDARY_ALTITUDE = -0.833;

type CountryFeature = Feature<Polygon | MultiPolygon, { name: string }>;

const countries = feature(
  atlas as unknown as Topology,
  (atlas as unknown as Topology).objects.countries as GeometryCollection,
) as FeatureCollection<Polygon | MultiPolygon> & { features: (CountryFeature & { id: string })[] };

function tracePolygons(ctx: CanvasRenderingContext2D, geometry: Polygon | MultiPolygon) {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  ctx.beginPath();
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ring.forEach(([lng, lat], i) => {
        const x = ((lng + 180) / 360) * TEXTURE_WIDTH;
        const y = ((90 - lat) / 180) * TEXTURE_HEIGHT;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
  }
}

/** 국가와 바다를 그리고, 관측 순간의 밤 지역을 어둡게 덮어 지구본 표면에 쓸 그림을 만든다. */
export function drawGlobeTexture(
  canvas: HTMLCanvasElement,
  date: Date,
  selectedNumeric: string,
): boolean {
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  ctx.fillStyle = OCEAN;
  ctx.fillRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  for (const country of countries.features) {
    tracePolygons(ctx, country.geometry);
    ctx.fillStyle = Number(country.id) === Number(selectedNumeric) ? SELECTED : LAND;
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  const image = ctx.getImageData(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  const sun = sunPosition(date);
  for (let row = 0; row < TEXTURE_HEIGHT; row++) {
    const lat = 90 - ((row + 0.5) / TEXTURE_HEIGHT) * 180;
    for (let col = 0; col < TEXTURE_WIDTH; col++) {
      const lng = ((col + 0.5) / TEXTURE_WIDTH) * 360 - 180;
      const altitude = sunAltitudeAt(lat, lng, sun);
      const night = Math.min(1, Math.max(0, (BOUNDARY_ALTITUDE - altitude) / 4 + 0.5));
      if (night === 0) continue;
      const i = (row * TEXTURE_WIDTH + col) * 4;
      const mix = night * 0.55;
      image.data[i] += (NIGHT_RGB[0] - image.data[i]) * mix;
      image.data[i + 1] += (NIGHT_RGB[1] - image.data[i + 1]) * mix;
      image.data[i + 2] += (NIGHT_RGB[2] - image.data[i + 2]) * mix;
    }
  }
  ctx.putImageData(image, 0, 0);
  return true;
}
