-- Datos iniciales del sistema

-- Tipos de vehículo
INSERT INTO tipo_vehiculo (nombre, descripcion) VALUES
('bicicleta', 'Bicicleta convencional o eléctrica'),
('motocicleta', 'Motocicleta de cualquier cilindraje'),
('automóvil', 'Automóvil particular o sedán'),
('camioneta', 'Camioneta, SUV o vehículo utilitario'),
('bus/buseta', 'Bus, buseta o microbús'),
('camión', 'Camión de carga de cualquier tonelaje');

-- Tarifas por tipo de vehículo
INSERT INTO tarifa (id_tipo_vehiculo, valor_hora) VALUES
(1, 500.00),
(2, 1500.00),
(3, 3000.00),
(4, 4000.00),
(5, 10000.00),
(6, 8000.00);

-- Empleados iniciales (contraseñas: admin123, secre123)
-- Hash generado con bcrypt rounds=10
INSERT INTO empleado (nombre, apellido, numero_documento, cargo, usuario, contrasena_hash, rol) VALUES
('Carlos', 'García', '1001001001', 'Administrador General', 'admin',
 '$2b$10$aJvCVXl4EZGgbIlD3sxWFu0D7S5pqzD4ci3Rjt//As0a9hzOdEm9i', 'administrador'),
('María', 'López', '1002002002', 'Operadora de Cabina', 'secretaria',
 '$2b$10$pgrHcF9fRJa/IGEYYHHzqeCiHLqg.1kCYbKtcVrp6jH26djSqAZ1y', 'secretaria');

-- Propietarios de ejemplo
INSERT INTO propietario (nombre, apellido, tipo_documento, numero_documento, telefono, correo) VALUES
('Juan', 'Pérez', 'CC', '1234567890', '3001234567', 'juan.perez@email.com'),
('Ana', 'Martínez', 'CC', '9876543210', '3109876543', 'ana.martinez@email.com');

-- Vehículos de ejemplo
INSERT INTO vehiculo (placa, id_tipo_vehiculo, id_propietario, modelo, color, anio) VALUES
('ABC123', 3, 1, 'Corolla', 'Rojo', 2022),
('XYZ789', 2, 2, 'Ninja 400', 'Negro', 2023),
('MEN001', 3, 1, 'Civic', 'Azul', 2021);

-- Mensualidad de ejemplo para MEN001
INSERT INTO mensualidad (id_vehiculo, id_propietario, fecha_inicio, fecha_fin, valor_pagado, activa, id_empleado_registro) VALUES
(3, 1, '2026-05-01', '2026-05-31', 150000.00, TRUE, 1);
