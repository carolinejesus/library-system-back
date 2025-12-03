import { pool } from "../database/db.js";

export const listarReservas = async (_req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                r.id, 
                u.nome AS usuario, 
                l.titulo AS livro,
                l.autor AS autor, 
                r.data_reserva,
                r.data_devolucao,
                r.status
            FROM reserva r 
            JOIN livro l ON r.id_livro = l.id
            JOIN usuario u ON r.id_usuario = u.id
            ORDER BY r.id DESC
            `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar reservas." });
    }
};

export const criarReserva = async (req, res) => {
    const { id_usuario, id_livro } = req.body;

    if (!id_usuario || !id_livro) {
        return res.status(400).json({ error: "Campos obrigatórios: id_usuario e id_livro." });
    }

    try {
        const livroResult = await pool.query(
            "SELECT copias_disponiveis FROM livro WHERE id = $1",
            [id_livro]
        );

        if (livroResult.rowCount === 0) {
            return res.status(404).json({ error: "Livro não encontrado." });
        }

        const copias_disponiveis = livroResult.rows[0].copias_disponiveis;

        if (copias_disponiveis <= 0) {
            return res.status(400).json({ error: "Não há cópias disponíveis para criarReserva." });
        }

        const reservaExiste = await pool.query(
            `SELECT id FROM reserva
            WHERE id_usuario = $1
            AND id_livro = $2
            AND status = 'ativa'`,
            [id_usuario, id_livro]
        );

        if (reservaExiste.rowCount > 0) {
            return res.status(400).json({
                error: "Você já possui uma reserva ativa deste livro."
            })
        }
        const reservaResult = await pool.query(
            `INSERT INTO reserva (id_usuario, id_livro, data_reserva, data_devolucao, status) 
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'ativa') 
            RETURNING *`,
            [id_usuario, id_livro]
        );


        await pool.query(
            "UPDATE livro SET copias_disponiveis = copias_disponiveis - 1 WHERE id = $1",
            [id_livro]
        );

        res.status(201).json(reservaResult.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao criar reserva." });
    }
};

export const atualizarStatusReserva = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const reservaResult = await pool.query("SELECT * FROM reserva WHERE id = $1", [id]);
        if (reservaResult.rowCount === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }

        const reserva = reservaResult.rows[0];

        await pool.query("UPDATE reserva SET status = $1 WHERE id = $2", [status, id]);

        if (status === "cancelada" || status === "finalizada") {
            await pool.query(
                "UPDATE livro SET copias_disponiveis = copias_disponiveis + 1 WHERE id = $1",
                [reserva.id_livro]
            );
        }
        res.json({ message: `Status atualizado para '${status}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao atualizar status da reserva." });
    }
};

export const excluirReserva = async (req, res) => {
    const { id } = req.params;

    try {
        const { rowCount } = await pool.query("DELETE FROM reserva WHERE id = $1", [id]);
        if (rowCount === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }
        res.json({ message: "Reserva excluída com sucesso." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao excluir reserva." });
    }
};

export const cancelarReserva = async (req, res) => {
    const { id } = req.params;

    try {
        const reservaResult = await pool.query(
            "SELECT * FROM reserva WHERE id = $1",
            [id]
        );

        if (reservaResult.rowCount === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }

        const reserva = reservaResult.rows[0];

        if (reserva.status !== "ativa") {
            return res.status(400).json({
                error: "Somente reservas ativas podem ser canceladas."
            });
        }

        await pool.query(
            "UPDATE reserva SET status = 'cancelada' WHERE id = $1",
            [id]
        );

        await pool.query(
            "UPDATE livro SET copias_disponiveis = copias_disponiveis + 1 WHERE id = $1",
            [reserva.id_livro]
        );

        res.json({ message: "Reserva cancelada com sucesso." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao cancelar reserva." });
    }
};

export const finalizarReserva = async (req, res) => {
    const { id } = req.params;

    try {
        const reservaResult = await pool.query(
            "SELECT * FROM reserva WHERE id = $1",
            [id]
        );

        if (reservaResult.rowCount === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }

        const reserva = reservaResult.rows[0];

        if (reserva.status !== "ativa") {
            return res.status(400).json({
                error: "Somente reservas ativas podem ser finalizadas."
            });
        }

        await pool.query(
            "UPDATE reserva SET status = 'finalizada' WHERE id = $1",
            [id]
        );

        // devolve o livro ao estoque
        await pool.query(
            "UPDATE livro SET copias_disponiveis = copias_disponiveis + 1 WHERE id = $1",
            [reserva.id_livro]
        );

        res.json({ message: "Reserva finalizada (entregue) com sucesso." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao finalizar reserva." });
    }
};


export const renovarReserva = async (req, res) => {
    const { id } = req.params;

    try {
        const reservaResult = await pool.query(
            "SELECT id, data_devolucao, renovacoes, status FROM reserva WHERE id = $1",
            [id]
        );

        if (reservaResult.rowCount === 0) {
            return res.status(404).json({ error: "Reserva não encontrada." });
        }

        const reserva = reservaResult.rows[0];

        if (reserva.renovacoes >= 3) {
            return res.status(400).json({ error: "Limite de renovações atingido." })
        }

        if (reserva.status !== "ativa") {
            return res.status(400).json({
                error: "Somente reservas ativas podem ser renovadas."
            });
        }

        const renovacoesAtuais = reserva.renovacoes ?? 0;
        if (renovacoesAtuais >= 3) {
            return res.status(400).json({ error: "Limite máximo de 3 renovações atingido." });
        }

        await pool.query(
            `UPDATE reserva 
             SET data_devolucao = data_devolucao + INTERVAL '7 days',
                 renovacoes = COALESCE(renovacoes, 0) + 1 
             WHERE id = $1
             RETURNING id, data_devolucao, renovacoes`,
            [id]
        );

        res.json({ message: "Reserva renovada com sucesso! " });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao renovar reserva." });
    }
};

export const listarUsuarioReserva = async (req, res) => {
    const { id } = req.params;

    try {
        const { rows } = await pool.query(`
            SELECT 
                r.id, 
                l.titulo AS livro,
                l.autor,
                r.data_reserva,
                r.data_devolucao,
                r.status
            FROM reserva r 
            JOIN livro l ON r.id_livro = l.id
            WHERE r.id_usuario = $1
            ORDER BY r.id DESC
        `, [id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar reservas do usuário." });
    }
};