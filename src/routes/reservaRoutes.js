import express from "express";
import { listarUsuarioReserva, finalizarReserva, renovarReserva, cancelarReserva, listarReservas, criarReserva, atualizarStatusReserva, excluirReserva } from "../controllers/reservaController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/usuario/:id", listarUsuarioReserva);
router.get("/", listarReservas);
router.post("/", criarReserva);
router.put("/:id/cancelar", cancelarReserva);
router.put("/:id/renovar", renovarReserva);
router.put("/:id/finalizar", finalizarReserva);
router.put("/:id", atualizarStatusReserva),
router.delete("/:id", excluirReserva);







export default router;