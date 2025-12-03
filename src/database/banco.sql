CREATE TABLE livro (
	id SERIAL PRIMARY KEY,
	titulo VARCHAR(225) NOT NULL,
	autor VARCHAR(225) NOT NULL,
	patrimonio VARCHAR(50),
	total_copias INT,
	copias_disponiveis INT
);

INSERT INTO livro (titulo, autor, patrimonio, total_copias, copias_disponiveis)
VALUES ('Dom Casmurro', 'Machado de Assis', 'P001', 10, 8),
('Branca de neve', 'Mariana Nunes', 'P002', 13, 7),
('Cinderela', 'Marisa Mercedez', 'P003', 15, 5);
