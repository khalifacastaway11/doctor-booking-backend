//src/auth.routes.ts
import { Router } from "express";
import { login, register,me,logout,updateTimeZone ,updateProfile} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import {forgotPassword,resetPassword} from "../controllers/password.controller"
import {validate} from "../middleware/validate.middleware"
import{
    registerSchema,
    loginSchema,
    updateProfileSchema,
    updateTimeZoneSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resetTokenParamsSchema,
} from "../schemas/auth.schema";

const router = Router();

router.post("/register", validate({body:registerSchema}),register);
router.post("/login", validate({body:loginSchema}), login);
router.post("/logout", protect,logout)
router.get("/me", protect, me);
//password reset route
router.post("/forgot-password",validate({body:forgotPasswordSchema}),forgotPassword)
router.post("/reset-password/:token",validate({body:resetPasswordSchema,params:resetTokenParamsSchema}),resetPassword)
router.patch("/profile",protect,validate({body:updateProfileSchema}),updateProfile)
router.patch("/timezone", protect, validate({ body: updateTimeZoneSchema }), updateTimeZone);

export default router;
