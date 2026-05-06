import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createOpportunityRequest,
  getOpportunityRequests,
  getOpportunityRequestById,
  applyToOpportunityRequest,
  acceptApplication,
  cancelOpportunityRequest,
} from '../controllers/opportunity-request.controller';

const router = Router();

router.use(authenticate);

router.post('/', createOpportunityRequest);
router.get('/', getOpportunityRequests);
router.get('/:id', getOpportunityRequestById);
router.post('/:id/apply', applyToOpportunityRequest);
router.put('/:id/applications/:appId/accept', acceptApplication);
router.delete('/:id', cancelOpportunityRequest);

export default router;
