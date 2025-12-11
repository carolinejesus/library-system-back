import jwt from "jsonwebtoken"; 
import dotenv from "dotenv";
dotenv.config();

const { JWT_ACCESS_SECRET } = process.env;

export function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "token ausente" });
        }

        const token = authHeader.slice(7);
        const payload = jwt.verify(token, JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        console.error("Erro no authMiddleware:", err);
        return res.status(401).json({ error: "token inválido" });
    }
}
