import bcrypt from "bcrypt";
import { pool } from "../database/db.js";
import jwt from "jsonwebtoken";


export const autenticarUsuario = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const result = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: "E-mail ou senha incorretos." });
        }

        const usuario = result.rows[0];

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
            return res.status(401).json({ error: "E-mail ou senha incorretos." });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, tipo: usuario.tipo },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            message: "Login realizado com sucesso!",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                tipo: usuario.tipo,
                email: usuario.email,
                foto: usuario.foto
            }, token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao realizar login." });
    }
}
export const logout = (req, res) => {
    res.clearCookie("token");
    return res.json({ mensagem: "Logout efetuado com sucesso" });
};