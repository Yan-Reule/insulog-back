ALTER TABLE registroglicose
  ADD COLUMN observacao TEXT NULL;

CREATE TABLE IF NOT EXISTS tipoinsulina (
  id_tipo_insulina INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_tipo_insulina)
);

CREATE TABLE IF NOT EXISTS registroinsulina (
  id_registro_insulina INT NOT NULL AUTO_INCREMENT,
  id_registro INT NOT NULL,
  id_tipo_insulina INT NOT NULL,
  unidade_insulina DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_registro_insulina),
  CONSTRAINT fk_registroinsulina_registro_glicose
    FOREIGN KEY (id_registro) REFERENCES registroglicose(id_registro),
  CONSTRAINT fk_registroinsulina_tipo_insulina
    FOREIGN KEY (id_tipo_insulina) REFERENCES tipoinsulina(id_tipo_insulina)
);

CREATE TABLE IF NOT EXISTS alarme (
  id_alarme INT NOT NULL AUTO_INCREMENT,
  id_usuario INT NOT NULL,
  data_hora DATETIME NOT NULL,
  id_periodo INT NULL,
  id_registro INT NULL,
  dias_semana SET('SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM') NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  tem_som BOOLEAN NOT NULL DEFAULT TRUE,
  tem_vibracao BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_alarme),
  CONSTRAINT fk_alarme_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_alarme_periodo
    FOREIGN KEY (id_periodo) REFERENCES periodo(id_periodo),
  CONSTRAINT fk_alarme_registro_glicose
    FOREIGN KEY (id_registro) REFERENCES registroglicose(id_registro)
);
