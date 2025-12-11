import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { listarLivros, criarLivro, atualizarLivro, excluirLivro, buscarLivro } from "../controllers/livroController.js";

const router = Router();

router.get("/", listarLivros);
router.get("/:id", authMiddleware, buscarLivro);
router.post("/", authMiddleware, criarLivro);
router.put("/:id", authMiddleware, atualizarLivro);
router.delete("/:id", authMiddleware, excluirLivro);

export default router;