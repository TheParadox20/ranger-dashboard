// Pure point-in-polygon geofence math. No external deps (turf avoided to keep
// the client bundle lean). GeoJSON positions are [lng, lat].

// Ray-casting test: is [x, y] inside a single linear ring?
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// A polygon is [outerRing, ...holes]. Inside = within the outer ring and not
// within any hole.
function pointInPolygon(x, y, polygon) {
  if (!polygon || polygon.length === 0) return false;
  if (!pointInRing(x, y, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i += 1) {
    if (pointInRing(x, y, polygon[i])) return false;
  }
  return true;
}

function extractGeometry(geojson) {
  if (!geojson || typeof geojson !== 'object') return null;
  if (geojson.type === 'FeatureCollection') {
    const f = (geojson.features || []).find((x) => x && x.geometry);
    return f ? f.geometry : null;
  }
  if (geojson.type === 'Feature') return geojson.geometry || null;
  return geojson; // assume bare geometry
}

// Is the given point inside the fence's polygon?
// `point` is { lat, lon } (lon also accepted as `lng`). Callers must pass a
// valid fix — this is pure geometry and does not special-case (0,0).
export function isInsideFence(point, geojson) {
  if (!point) return false;
  const lat = point.lat;
  const lon = point.lon ?? point.lng;
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;

  const geometry = extractGeometry(geojson);
  if (!geometry) return false;

  if (geometry.type === 'Polygon') {
    return pointInPolygon(lon, lat, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || []).some((poly) =>
      pointInPolygon(lon, lat, poly),
    );
  }
  return false;
}

// [[minLng, minLat], [maxLng, maxLat]] for the fence, or null. Handy for
// map fitBounds / centering on the active route.
export function fenceBounds(geojson) {
  const geometry = extractGeometry(geojson);
  if (!geometry) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const visit = (coords) => {
    for (const ring of coords) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  };

  if (geometry.type === 'Polygon') visit(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(visit);
  else return null;

  if (minLng === Infinity) return null;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
