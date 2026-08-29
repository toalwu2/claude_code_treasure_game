// Vercel catch-all serverless function: every /api/* request is routed here
// by Vercel's file-system routing, with req.url left as the original path
// (e.g. /api/auth/signup), so the Express app's own /api/* route mounts
// still match unchanged.
module.exports = require('../server/app');
