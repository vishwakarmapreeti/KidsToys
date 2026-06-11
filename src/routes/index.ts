import { Router } from 'express';
import admin from './admin';
import user from './user';

const router = Router();
console.log("MAIN ROUTES LOADED");
router.use('/user', user);
router.use('/admin', admin);


export default router;