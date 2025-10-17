import { Router } from "express";
import { register, login, changePassword } from "../controllers/authController";
import { autenticar } from "../middleware/auth";

const router = Router();

// Rotas de autenticação
router.post("/register", register);
router.post("/login", login);
router.put("/change-password", autenticar, changePassword);

export default router;