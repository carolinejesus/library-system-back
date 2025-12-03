import { Router } from "express";
import { listarLivros, criarLivro, atualizarLivro, excluirLivro, buscarLivro } from "../controllers/livroController.js";

const router = Router();

router.get("/", listarLivros);
router.get("/:id", buscarLivro);
router.post("/", criarLivro);
router.put("/:id", atualizarLivro);
router.delete("/:id", excluirLivro);

export default router;