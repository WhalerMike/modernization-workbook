-- Synthetic legacy schema, DB2 dialect. Not copied from any real system.
-- CHAR columns are fixed width, so values come back padded with trailing spaces.
-- CLOSE_DT is NOT NULL and uses 0001-01-01 to mean "no date" (a common legacy habit).

CREATE TABLE APPLICANT (
    APPL_ID   INTEGER  NOT NULL PRIMARY KEY,
    LAST_NM   CHAR(30) NOT NULL,
    FIRST_NM  CHAR(20) NOT NULL,
    ST_CD     CHAR(2)  NOT NULL
);

CREATE TABLE CASE_MSTR (
    CASE_NO      CHAR(10)      NOT NULL PRIMARY KEY,
    APPL_ID      INTEGER       NOT NULL REFERENCES APPLICANT (APPL_ID),
    CASE_TYP_CD  CHAR(3)       NOT NULL,
    STAT_CD      CHAR(1)       NOT NULL CHECK (STAT_CD IN ('O', 'P', 'C')),
    OPEN_DT      DATE          NOT NULL,
    CLOSE_DT     DATE          NOT NULL DEFAULT '0001-01-01',
    AMT_CLAIMED  DECIMAL(11,2) NOT NULL,
    LAST_UPD_TS  TIMESTAMP     NOT NULL
);

CREATE INDEX CASE_MSTR_UPD_IX ON CASE_MSTR (LAST_UPD_TS);
