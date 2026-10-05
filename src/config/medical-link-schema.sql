CREATE TABLE IF NOT EXISTS codigo_vinculo_medico (
  id_codigo INT NOT NULL AUTO_INCREMENT,
  id_medico INT NOT NULL,
  codigo_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  resgatado_em DATETIME NULL,
  id_paciente INT NULL,
  PRIMARY KEY (id_codigo),
  UNIQUE KEY uq_codigo_vinculo_hash (codigo_hash),
  UNIQUE KEY uq_codigo_vinculo_paciente (id_paciente),
  KEY idx_codigo_vinculo_medico (id_medico),
  CONSTRAINT fk_codigo_vinculo_medico
    FOREIGN KEY (id_medico) REFERENCES medico(id_usuario) ON DELETE CASCADE,
  CONSTRAINT fk_codigo_vinculo_paciente
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_usuario) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
