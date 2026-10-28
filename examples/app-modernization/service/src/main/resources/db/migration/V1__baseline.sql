-- Target schema for the case service (PostgreSQL). Owned by the service through Flyway.
-- The migration CLI's tests apply this same file; there is no second copy.

create table applicant (
    id          bigint      primary key,
    last_name   varchar(30) not null,
    first_name  varchar(20) not null,
    state_code  char(2)     not null
);

create table case_record (
    case_number    varchar(10)   primary key,
    applicant_id   bigint        not null references applicant (id),
    case_type      varchar(3)    not null,
    status         varchar(10)   not null check (status in ('OPEN', 'PENDING', 'CLOSED')),
    opened_on      date          not null,
    closed_on      date          null,
    amount_claimed numeric(11,2) not null,
    updated_at     timestamptz   not null
);

create index case_record_applicant_idx on case_record (applicant_id);

create table agent_proposal (
    id          bigserial   primary key,
    case_number varchar(10) not null references case_record,
    agent_id    varchar(64) not null,
    sponsor     varchar(64) not null,
    action      varchar(32) not null,
    rationale   text        not null,
    status      varchar(10) not null check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    created_at  timestamptz not null default now(),
    decided_by  varchar(64),
    decided_at  timestamptz
);

create table agent_audit (
    id          bigserial   primary key,
    agent_id    varchar(64) not null,
    tool        varchar(64) not null,
    case_number varchar(10),
    allowed     boolean     not null,
    detail      text,
    at          timestamptz not null default now()
);
