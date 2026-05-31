-- Sistema de Gestión de Parqueadero (SGP)
-- Script de inicialización - Normalizado a 3FN

CREATE TABLE tipo_vehiculo (
    id_tipo_vehiculo SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE propietario (
    id_propietario SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    correo VARCHAR(100),
    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE vehiculo (
    id_vehiculo SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL UNIQUE,
    id_tipo_vehiculo INT NOT NULL REFERENCES tipo_vehiculo(id_tipo_vehiculo),
    id_propietario INT NOT NULL REFERENCES propietario(id_propietario),
    modelo VARCHAR(50),
    color VARCHAR(30),
    anio SMALLINT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE empleado (
    id_empleado SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    numero_documento VARCHAR(20) NOT NULL UNIQUE,
    cargo VARCHAR(50) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('secretaria', 'administrador')),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tarifa (
    id_tarifa SERIAL PRIMARY KEY,
    id_tipo_vehiculo INT NOT NULL REFERENCES tipo_vehiculo(id_tipo_vehiculo),
    valor_hora NUMERIC(10,2) NOT NULL,
    vigente_desde TIMESTAMP NOT NULL DEFAULT NOW(),
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE mensualidad (
    id_mensualidad SERIAL PRIMARY KEY,
    id_vehiculo INT NOT NULL REFERENCES vehiculo(id_vehiculo),
    id_propietario INT NOT NULL REFERENCES propietario(id_propietario),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    valor_pagado NUMERIC(10,2) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    id_empleado_registro INT NOT NULL REFERENCES empleado(id_empleado)
);

CREATE TABLE registro_estadia (
    id_registro SERIAL PRIMARY KEY,
    id_vehiculo INT NOT NULL REFERENCES vehiculo(id_vehiculo),
    id_empleado_entrada INT NOT NULL REFERENCES empleado(id_empleado),
    id_empleado_salida INT REFERENCES empleado(id_empleado),
    id_tarifa INT REFERENCES tarifa(id_tarifa),
    fecha_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_entrada TIME NOT NULL DEFAULT CURRENT_TIME,
    fecha_salida DATE,
    hora_salida TIME,
    horas_cobradas NUMERIC(5,2),
    valor_total NUMERIC(10,2),
    es_mensualidad BOOLEAN NOT NULL DEFAULT FALSE,
    anulado BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE recibo (
    id_recibo SERIAL PRIMARY KEY,
    id_registro INT NOT NULL REFERENCES registro_estadia(id_registro),
    numero_recibo VARCHAR(20) NOT NULL UNIQUE,
    fecha_emision TIMESTAMP NOT NULL DEFAULT NOW(),
    impreso BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_vehiculo_placa ON vehiculo(placa);
CREATE INDEX idx_registro_vehiculo_activo ON registro_estadia(id_vehiculo) WHERE fecha_salida IS NULL;
CREATE INDEX idx_mensualidad_vehiculo_activa ON mensualidad(id_vehiculo) WHERE activa = TRUE;
CREATE INDEX idx_tarifa_tipo_activa ON tarifa(id_tipo_vehiculo) WHERE activa = TRUE;

-- Secuencia para números de recibo
CREATE SEQUENCE seq_recibo START 1;
