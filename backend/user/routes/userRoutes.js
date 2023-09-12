import express from 'express';
import { protect, admin } from '../../general/middleware/authMiddleware.js';
import checkObjectId from '../../general/middleware/checkObjectId.js';
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js';

const router = express.Router();
router.route('/').get(protect, admin, getUsers).post(registerUser);
router.post('/auth', authUser);
router.post('/logout', logoutUser);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route('/password').put(protect, updatePassword);
router
  .route('/:id')
  .get(protect, admin, checkObjectId, getUserById)
  .put(protect, admin, checkObjectId, updateUser)
  .delete(protect, admin, checkObjectId, deleteUser);

export default router;
