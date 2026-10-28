-- Synthetic demo data, loaded only with the "demo" profile. Not real people, codes or programs.
insert into applicant (id, last_name, first_name, state_code) values
  (1, 'Applicant-0001', 'Test', 'XA'),
  (2, 'Applicant-0002', 'Test', 'XB'),
  (3, 'Applicant-0003', 'Test', 'XC');

insert into case_record (case_number, applicant_id, case_type, status, opened_on, closed_on, amount_claimed, updated_at) values
  ('C-000001', 1, 'ABC', 'OPEN',    date '2024-03-15', null,              1250.00, timestamptz '2024-03-15 14:00:00+00'),
  ('C-000002', 2, 'DEF', 'OPEN',    date '2026-08-01', null,               830.25, timestamptz '2026-08-01 09:30:00+00'),
  ('C-000003', 2, 'DEF', 'OPEN',    date '2026-09-10', null,               830.25, timestamptz '2026-09-10 10:00:00+00'),
  ('C-000004', 3, 'ABC', 'PENDING', date '2026-07-04', null,              2100.00, timestamptz '2026-07-04 12:00:00+00'),
  ('C-000005', 3, 'GHI', 'CLOSED',  date '2025-01-02', date '2025-06-30',  999.99, timestamptz '2025-06-30 16:45:00+00');
