// Every /api/* request is rewritten here by vercel.json (the file-system
// catch-all convention only matched single-segment /api/* paths in testing,
// not nested ones like /api/auth/me). req.url is left as the original path
// by the rewrite, so the Express app's own /api/* route mounts still match.
module.exports = require('../server/app');
