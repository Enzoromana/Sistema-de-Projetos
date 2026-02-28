-- Sincronização de sequências de ID após migração
-- Execute este script no SQL Editor do NOVO PROJETO

SELECT setval('public.projects_id_seq', (SELECT MAX(id) FROM public.projects));
SELECT setval('public.tasks_id_seq', (SELECT MAX(id) FROM public.tasks));
SELECT setval('public.subtasks_id_seq', (SELECT MAX(id) FROM public.subtasks));
SELECT setval('public.room_bookings_id_seq', (SELECT MAX(id) FROM public.room_bookings));
SELECT setval('public.medical_requests_id_seq', (SELECT MAX(id) FROM public.medical_requests));
SELECT setval('public.medical_procedures_id_seq', (SELECT MAX(id) FROM public.medical_procedures));
SELECT setval('public.medical_materials_id_seq', (SELECT MAX(id) FROM public.medical_materials));
SELECT setval('public.medical_attachments_id_seq', (SELECT MAX(id) FROM public.medical_attachments));
