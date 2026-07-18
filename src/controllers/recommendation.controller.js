const catchAsync = require('../utils/catchAsync');
const recommendationService = require('../services/recommendation.service');

exports.recommendTransporters = catchAsync(async (req, res) => {
  const { lat, lng, limit } = req.query;

  const recommendations = await recommendationService.recommendTransporters({
    lat,
    lng,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(200).json({ success: true, data: { recommendations } });
});
