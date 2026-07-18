const Listing = require('../entities/Listing');
const AppError = require('../utils/AppError');

// Fallback used to estimate delivery time when a transporter hasn't set
// their own avgSpeedKmph on their listing.
const DEFAULT_AVG_SPEED_KMPH = 40;
const MAX_CANDIDATE_POOL = 50;
const DEFAULT_RESULT_LIMIT = 5;

/**
 * Rule-based (no ML) recommendation of available transporters/logistics
 * listings for a pickup location, ranked by three simple, explainable rules:
 *   1. Availability — hard filter, not scored (unavailable listings are excluded entirely)
 *   2. Lowest cost (dailyPrice)
 *   3. Shortest distance from the pickup point
 *   4. Fastest estimated delivery (distance / the transporter's average speed)
 *
 * Each metric is min-max normalized to 0..1 across the candidate pool, then
 * combined with fixed (adjustable) weights into a single score — lower score
 * wins. Every ranked result includes the raw numbers it was scored on, so the
 * ranking is auditable rather than a black box.
 */
exports.recommendTransporters = async ({ lat, lng, limit, weights } = {}) => {
  if (lat == null || lng == null) {
    throw new AppError('lat and lng are required to recommend nearby transporters.', 400);
  }

  const resultLimit = limit || DEFAULT_RESULT_LIMIT;
  const w = {
    cost: weights?.cost ?? 1 / 3,
    distance: weights?.distance ?? 1 / 3,
    speed: weights?.speed ?? 1 / 3,
  };

  // $geoNear requires the geospatial stage to be first in the pipeline;
  // it also handles the "available" hard filter via its `query` option.
  const candidates = await Listing.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        distanceField: 'distanceMeters',
        spherical: true,
        query: {
          type: { $in: ['logistics', 'transport'] },
          isAvailable: true,
          isPaused: false,
          isDeleted: false,
        },
      },
    },
    { $limit: MAX_CANDIDATE_POOL },
  ]);

  if (candidates.length === 0) return [];

  const distancesKm = candidates.map((c) => c.distanceMeters / 1000);
  const costs = candidates.map((c) => c.dailyPrice);
  const etaHoursList = candidates.map(
    (c, i) => distancesKm[i] / (c.avgSpeedKmph || DEFAULT_AVG_SPEED_KMPH)
  );

  // 0 = best (lowest) in the pool, 1 = worst. Ties (all candidates equal on
  // a metric) score 0 for that metric — no artificial penalty either way.
  const normalize = (value, pool) => {
    const min = Math.min(...pool);
    const max = Math.max(...pool);
    return max === min ? 0 : (value - min) / (max - min);
  };

  const ranked = candidates
    .map((c, i) => {
      const distanceKm = distancesKm[i];
      const etaHours = etaHoursList[i];

      const score =
        w.cost * normalize(c.dailyPrice, costs) +
        w.distance * normalize(distanceKm, distancesKm) +
        w.speed * normalize(etaHours, etaHoursList);

      return {
        listingId: c._id,
        brandName: c.brandName,
        vehicleType: c.vehicleType,
        dailyPrice: c.dailyPrice,
        distanceKm: Number(distanceKm.toFixed(2)),
        estimatedDeliveryHours: Number(etaHours.toFixed(2)),
        score: Number(score.toFixed(4)),
      };
    })
    .sort((a, b) => a.score - b.score); // lowest score = best match

  return ranked.slice(0, resultLimit);
};
