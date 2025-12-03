import { pool } from "../database/db.js";
import bcrypt from "bcrypt";


//LISTA OS USUARIOS
export const listarUsuarios = async (_req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT id, nome, email, tipo, foto FROM usuario ORDER BY id");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar usuários." });
    }
};


//CRIA USUARIO
export const criarUsuario = async (req, res) => {
    try {
        const { nome, email, senha, tipo } = req.body ?? {};

        if (!nome || !email || !senha || !tipo) {
            return res.status(400).json({ error: "Todos os campos são obrigatórios." });
        }

        const verifica = await pool.query(
            "SELECT 1 FROM usuario WHERE email = $1", [email]);

        if (verifica.rows.length > 0) {
            return res.status(400).json({ error: "E-mail já cadastrado." });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO usuario (nome, email, senha, tipo)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nome, email, tipo`;

        const { rows } = await pool.query(query, [nome, email, senhaHash, tipo]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            res.status(400).json({ error: "Email já cadastrado." });
        } else {
            res.status(500).json({ error: "Erro ao cadastrar usuário." })
        }
    }
};

//ATUALIZA UM USUARIO
export const atualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;

    try {
        const result = await pool.query(
            `UPDATE usuario SET nome = $1
            WHERE id = $2 RETURNING id, nome`,
            [nome, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }
        res.status(200).json({ message: "Usuário atualizado com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar usuário." })
    }
};

//EXCLUI UM USUARIO
export const excluirUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM usuario WHERE id = $1", [id]);
        res.status(200).json({ message: "Usuário excluído com sucesso!" })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao excluir usuário." });
    }
};

//ALTERA SENHA NE
export const alterarSenha = async (req, res) => {
    try {
        const { email, senhaAtual, novaSenha } = req.body;

        const result = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        const usuario = result.rows[0];

        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: "Senha atual incorreta." });
        }

        const saltRounds = 10;
        const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

        await pool.query("UPDATE usuario SET senha = $1 WHERE email = $2", [novaSenhaHash, email]);
        res.status(200).json({ message: "Senha alterada com sucesso!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao alterar senha." });
    }
};

export const atualizaFoto = async (req, res) => {
    try {
        const id = req.params.id;

        if (!req.file) {
            return res.status(400).json({ error: "Nenhuma imagem enviada." });
        }

        const caminho = `/uploads/usuarios/${req.file.filename}`;

        const query = "UPDATE usuario SET foto = $1 WHERE id = $2 RETURNING foto";
        const { rows } = await pool.query(query, [caminho, id]);

        res.json({ foto: rows[0].foto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar foto" });
    }
};

export const buscarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            "SELECT id, nome, email, tipo, foto FROM usuario WHERE id = $1",
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar usuário." });
    }
}