/**
 * Pagination utility functions
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {Object} options - Default pagination options
 * @returns {Object} Pagination parameters
 */
export function parsePagination(query, options = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    maxLimit = 100,
    minLimit = 1
  } = options;

  const page = Math.max(1, parseInt(query.page) || defaultPage);
  const limit = Math.min(
    maxLimit,
    Math.max(minLimit, parseInt(query.limit) || defaultLimit)
  );
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit
  };
}

/**
 * Create paginated response
 * @param {Array} data - The data array
 * @param {Object} pagination - Pagination parameters
 * @param {Number} total - Total count of items
 * @returns {Object} Paginated response object
 */
export function createPaginatedResponse(data, pagination, total) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

/**
 * Add pagination headers to response
 * @param {Object} res - Express response object
 * @param {Object} pagination - Pagination parameters
 * @param {Number} total - Total count of items
 */
export function setPaginationHeaders(res, pagination, total) {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);

  res.setHeader('X-Page', page);
  res.setHeader('X-Per-Page', limit);
  res.setHeader('X-Total', total);
  res.setHeader('X-Total-Pages', totalPages);
  res.setHeader('X-Has-Next', page < totalPages);
  res.setHeader('X-Has-Prev', page > 1);
}

