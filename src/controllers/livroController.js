import { pool } from "../database/db.js";

export const listarLivros = async (_req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM livro ORDER BY titulo ASC"
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar livros." });
    }
};

export const buscarLivro = async (req, res) => {
    try {
        const { id } = req.params;
        let id_usuario = null;

        if (req.user) {
            id_usuario = req.user.id;
        }

        const query = `SELECT * FROM "livro" WHERE id = $1`;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        const livro = rows[0];

        let reserva = null;
        if (id_usuario) {
            const reservaQuery = `
                SELECT *
                FROM reserva
                WHERE id_livro = $1 AND id_usuario = $2 AND status = 'ativa'
                LIMIT 1
            `;
            const reservaResult = await pool.query(reservaQuery, [id, id_usuario]);
            reserva = reservaResult.rows.length > 0 ? reservaResult.rows[0] : null;
        }

        res.json({ ...livro, reserva });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar livro." });
    }
};


export const criarLivro = async (req, res) => {
    try {
        const { titulo, autor, patrimonio, total_copias, copias_disponiveis, descricao } = req.body ?? {};

        if (total_copias < 0) {
            return res.status(400).json({ error: "total_copias não pode ser negativo." });
        }

        if (copias_disponiveis < 0) {
            return res.status(400).json({ error: "copias_disponiveis não pode ser negativa." });
        }

        if (copias_disponiveis > total_copias) {
            return res.status(400).json({ error: "copias_disponiveis não pode ser maior que total_copias." });
        }

        const query =
            `INSERT INTO "livro" ("titulo", "autor", "patrimonio", "total_copias", "copias_disponiveis", "descricao")
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        const { rows } = await pool.query(query, [titulo, autor, patrimonio, total_copias, copias_disponiveis, descricao]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao cadastrar livro." });
    }
};

export const excluirLivro = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM livro WHERE id = $1", [id]);
        res.status(200).json({ message: "Livro excluído com sucesso." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao excluir livro." });
    }
};

export const atualizarLivro = async (req, res) => {
    const { id } = req.params;
    const { titulo, autor, patrimonio, total_copias, copias_disponiveis, descricao } = req.body;

    try {
        const livroExiste = await pool.query("SELECT * FROM livro WHERE id = $1", [id]);

        if (livroExiste.rowCount === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        const livroAtual = livroExiste.rows[0];

        const novoTotal = total_copias ?? livroAtual.total_copias;
        const novasDisponiveis = copias_disponiveis ?? livroAtual.copias_disponiveis;

        if (novoTotal < 0) {
            return res.status(400).json({ error: "total_copias não pode ser negativo." });
        }

        if (novasDisponiveis < 0) {
            return res.status(400).json({ error: "copias_disponiveis não pode ser negativa." });
        }

        if (novasDisponiveis > novoTotal) {
            return res.status(400).json({ error: "copias_disponiveis não pode ser maior que total_copias." });
        }

        const livroAtualizado = {
            titulo: titulo ?? livroAtual.titulo,
            autor: autor ?? livroAtual.autor,
            patrimonio: patrimonio ?? livroAtual.patrimonio,
            total_copias: novoTotal,
            copias_disponiveis: novasDisponiveis,
            descricao: descricao ?? livroAtual.descricao
        };

        const result = await pool.query(
            `UPDATE livro SET titulo = $1, autor = $2, patrimonio = $3, total_copias = $4, copias_disponiveis = $5, descricao = $6
             WHERE id = $7 RETURNING *`,
            [
                livroAtualizado.titulo,
                livroAtualizado.autor,
                livroAtualizado.patrimonio,
                livroAtualizado.total_copias,
                livroAtualizado.copias_disponiveis,
                livroAtualizado.descricao,
                id
            ]
        );

        res.status(200).json({
            message: "Livro atualizado com sucesso!",
            livro: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar livro." });
    }
};
