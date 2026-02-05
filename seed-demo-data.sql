-- =============================================
-- ZARK CRM - Demo Data Seed Script
-- =============================================
-- Execute este script no SQL Editor do Supabase
-- para criar dados de demonstração

-- 1. Criar um Space (sem created_by, usando NULL para evitar FK constraint)
INSERT INTO spaces (id, name, description, created_by, created_at)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid,
  'ZARK Demo Space',
  'Space de demonstração para testes da integração Supabase',
  NULL,  -- NULL porque não temos um usuário autenticado
  NOW()
);

-- 2. Criar uma List
INSERT INTO lists (id, space_id, name, description, position, created_at)
VALUES (
  'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid,
  'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid,
  'Projetos em Andamento',
  'Lista principal de projetos do cliente',
  0,
  NOW()
);

-- 3. Criar Columns (Kanban)
INSERT INTO columns (id, list_id, name, position, created_at) VALUES
  ('c3d4e5f6-a789-4901-c234-56789abcdef0'::uuid, 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid, 'NEW', 0, NOW()),
  ('d4e5f6a7-8901-4a12-d345-6789abcdef01'::uuid, 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid, 'WAITING', 1, NOW()),
  ('e5f6a789-0123-4b23-e456-789abcdef012'::uuid, 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid, 'APPROVED', 2, NOW());

-- 4. Criar Tasks de Demonstração
INSERT INTO tasks (
  id,
  list_id,
  column_id,
  title,
  description,
  priority,
  due_date,
  position,
  time_spent,
  created_by,
  created_at
) VALUES
-- Task 1: Table B24 (NEW)
(
  'f6a78901-2345-4c34-f567-89abcdef0123'::uuid,
  'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid,
  'c3d4e5f6-a789-4901-c234-56789abcdef0'::uuid,
  'Table B24',
  'Room preparation needed for the VIP client meeting. Ensure all equipment is functioning properly.',
  'urgent',
  '2025-09-27',
  0,
  45,
  NULL,  -- NULL porque não temos usuário autenticado
  NOW()
),
-- Task 2: Family table 2 (WAITING)
(
  'a7890123-4567-4d45-a678-9abcdef01234'::uuid,
  'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid,
  'd4e5f6a7-8901-4a12-d345-6789abcdef01'::uuid,
  'Family table 2',
  'Reserva para família de 6 pessoas',
  'high',
  '2025-09-27',
  0,
  30,
  NULL,  -- NULL porque não temos usuário autenticado
  NOW()
),
-- Task 3: Coworking V223 (NEW)
(
  '89012345-6789-4e56-9012-abcdef012345'::uuid,
  'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid,
  'c3d4e5f6-a789-4901-c234-56789abcdef0'::uuid,
  'Coworking V223',
  'Configurar mesa de coworking',
  'medium',
  '2025-09-27',
  1,
  60,
  NULL,  -- NULL porque não temos usuário autenticado
  NOW()
);

-- =============================================
-- VERIFICAÇÃO: Execute estes SELECTs para confirmar
-- =============================================

SELECT 'Space criado:' as status, id, name FROM spaces WHERE id = 'a1b2c3d4-e5f6-4789-a012-3456789abcde'::uuid;
SELECT 'List criada:' as status, id, name FROM lists WHERE id = 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid;
SELECT 'Columns criadas:' as status, COUNT(*) as total FROM columns WHERE list_id = 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid;
SELECT 'Tasks criadas:' as status, COUNT(*) as total FROM tasks WHERE list_id = 'b2c3d4e5-f6a7-4890-b123-456789abcdef'::uuid;

-- =============================================
-- IDS GERADOS (PARA USAR NA APLICAÇÃO):
-- =============================================
-- Space ID:  a1b2c3d4-e5f6-4789-a012-3456789abcde
-- List ID:   b2c3d4e5-f6a7-4890-b123-456789abcdef
-- Column IDs:
--   NEW:      c3d4e5f6-a789-4901-c234-56789abcdef0
--   WAITING:  d4e5f6a7-8901-4a12-d345-6789abcdef01
--   APPROVED: e5f6a789-0123-4b23-e456-789abcdef012
-- Task IDs:
--   Table B24:       f6a78901-2345-4c34-f567-89abcdef0123
--   Family table 2:  a7890123-4567-4d45-a678-9abcdef01234
--   Coworking V223:  89012345-6789-4e56-9012-abcdef012345
