import express from 'express';
import { signup } from '../controllers/signupController';

const router = express.Router();

// POST /citizen/signup
router.post('/signup', signup('CITIZEN'));

export default router;
