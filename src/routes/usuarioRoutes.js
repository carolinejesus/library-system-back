import express from "express";
import { upload } from "../middlewares/upload.js";
import { buscarUsuario, atualizaFoto, listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario, alterarSenha } from "../controllers/usuarioController.js";

const router = express.Router();

router.get("/", listarUsuarios);
router.post("/", criarUsuario);
router.put("/alterarSenha", alterarSenha);
router.put("/:id", atualizarUsuario);
router.delete("/:id", excluirUsuario);
router.put("/:id/foto", upload.single("foto"), atualizaFoto);
router.get("/:id", buscarUsuario);

export default router;