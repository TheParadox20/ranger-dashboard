// Validate + normalize the GeoJSON a fence/route is drawn with.
// mapbox-gl-draw emits a Feature with Polygon geometry; we also accept a bare
// geometry or a single-feature FeatureCollection and normalize to a Feature.

function isPosition(p) {
  return (
    Array.isArray(p) &&
    p.length >= 2 &&
    typeof p[0] === 'number' &&
    typeof p[1] === 'number'
  );
}

function isLinearRing(ring) {
  return Array.isArray(ring) && ring.length >= 4 && ring.every(isPosition);
}

function isValidPolygonCoords(coords) {
  return Array.isArray(coords) && coords.length >= 1 && coords.every(isLinearRing);
}

function isValidGeometry(geometry) {
  if (geometry == null || typeof geometry !== 'object') return false;
  if (geometry.type === 'Polygon') {
    return isValidPolygonCoords(geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return (
      Array.isArray(geometry.coordinates) &&
      geometry.coordinates.length >= 1 &&
      geometry.coordinates.every(isValidPolygonCoords)
    );
  }
  return false;
}

// Returns { geojson } (a normalized Feature) or { error } (a message).
export function normalizeGeojson(input) {
  if (input == null || typeof input !== 'object') {
    return { error: 'geojson is required' };
  }

  let feature = input;

  if (input.type === 'FeatureCollection') {
    const found = (input.features || []).find(
      (f) => f && f.type === 'Feature' && isValidGeometry(f.geometry),
    );
    if (!found) {
      return { error: 'geojson FeatureCollection has no polygon feature' };
    }
    feature = found;
  } else if (input.type === 'Polygon' || input.type === 'MultiPolygon') {
    feature = { type: 'Feature', properties: {}, geometry: input };
  }

  if (feature.type !== 'Feature' || !isValidGeometry(feature.geometry)) {
    return { error: 'geojson must be a Polygon Feature' };
  }

  return {
    geojson: {
      type: 'Feature',
      properties:
        feature.properties && typeof feature.properties === 'object'
          ? feature.properties
          : {},
      geometry: feature.geometry,
    },
  };
}
