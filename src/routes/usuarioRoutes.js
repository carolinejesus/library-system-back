import express from "express";
import { upload } from "../middlewares/upload.js";
import { authMiddleware } from "../middlewares/auth.js";
import { buscarUsuario, atualizaFoto, listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario, alterarSenha } from "../controllers/usuarioController.js";

const router = express.Router();

router.get("/", authMiddleware, listarUsuarios);
router.post("/", authMiddleware, criarUsuario);
router.put("/alterarSenha", authMiddleware, alterarSenha);
router.put("/:id", authMiddleware, atualizarUsuario);
router.delete("/:id", authMiddleware, excluirUsuario);
router.put("/:id/foto", upload.single("foto"), atualizaFoto);
router.get("/:id", authMiddleware, buscarUsuario);

export default router;