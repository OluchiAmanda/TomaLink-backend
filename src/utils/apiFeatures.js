/**
 * Chainable query builder for list endpoints. Wraps a Mongoose Query and
 * applies filter/search/sort/pagination based on req.query, so every module
 * (listings, bookings, admin lists, etc.) gets the same consistent behavior.
 *
 * Usage:
 *   const features = new ApiFeatures(Listing.find({ isDeleted: false }), req.query)
 *     .search(['brandName', 'description'])
 *     .filter()
 *     .sort()
 *     .paginate();
 *   const results = await features.query;
 *   // features.pagination -> { page, limit }
 */
class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
  }

  /**
   * Turns query params like `dailyPrice[gte]=100&type=cold_storage` into a
   * Mongo filter, translating gte/gt/lte/lt into their $-prefixed operators.
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'sort', 'fields', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * Free-text search across the given fields using `?search=`.
   */
  search(fields = []) {
    if (this.queryString.search && fields.length) {
      const regex = new RegExp(this.queryString.search, 'i');
      this.query = this.query.find({
        $or: fields.map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  /**
   * `?sort=dailyPrice,-createdAt` — comma-separated, `-` prefix for descending.
   * Defaults to newest first.
   */
  sort() {
    if (this.queryString.sort) {
      this.query = this.query.sort(this.queryString.sort.split(',').join(' '));
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  /**
   * `?page=2&limit=20` — defaults to page 1, 20 per page.
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}

module.exports = ApiFeatures;
