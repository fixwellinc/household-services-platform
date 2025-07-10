/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://fixwell-services-platform-production.up.railway.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
} 