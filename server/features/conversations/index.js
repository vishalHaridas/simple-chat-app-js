import { Router } from 'express';
import createConversationsHandler from './handler.js';

export default (conversationService, USER_ID) =>{
  const router = Router();

  router.post('/stream', (req, res) => createConversationsHandler(conversationService, req, res));

  return router;
}

