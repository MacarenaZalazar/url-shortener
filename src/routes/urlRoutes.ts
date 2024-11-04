import express from 'express';
import {
  generateShortUrl,
  getUrlStats,
  redirectUrl,
  updateOriginalUrl,
  updateUrlStatus,
} from '../controllers/urlController';

const router = express.Router();

router.post('/shorten', generateShortUrl);
router.get('/:id', redirectUrl);
router.patch('/url/:id/status', updateUrlStatus);
router.patch('/url/:id', updateOriginalUrl);
router.get('/url/:id/stats', getUrlStats);

export default router;
