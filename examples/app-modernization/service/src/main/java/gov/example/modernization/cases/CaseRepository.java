package gov.example.modernization.cases;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class CaseRepository {

    private static final String SELECT = """
            select c.case_number, c.applicant_id, a.last_name, a.first_name, a.state_code, c.case_type,
                   c.status, c.opened_on, c.closed_on, c.amount_claimed, c.updated_at
              from case_record c join applicant a on a.id = c.applicant_id
            """;
    private static final String NEWEST_FIRST = " order by c.opened_on desc, c.case_number desc";

    private final JdbcClient jdbc;

    public CaseRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public List<CaseView> list(CaseStatus status) {
        if (status == null) {
            return jdbc.sql(SELECT + NEWEST_FIRST).query(CaseRepository::map).list();
        }
        return jdbc.sql(SELECT + " where c.status = :status" + NEWEST_FIRST)
                .param("status", status.name())
                .query(CaseRepository::map).list();
    }

    public Optional<CaseView> find(String caseNumber) {
        return jdbc.sql(SELECT + " where c.case_number = :cn")
                .param("cn", caseNumber)
                .query(CaseRepository::map).optional();
    }

    /** Other cases of the same applicant, newest first. */
    public List<CaseView> relatedTo(String caseNumber) {
        return jdbc.sql(SELECT
                        + " where c.applicant_id = (select applicant_id from case_record where case_number = :cn)"
                        + " and c.case_number <> :cn" + NEWEST_FIRST)
                .param("cn", caseNumber)
                .query(CaseRepository::map).list();
    }

    /** Used only by the human decision path, never by the agent. */
    public void updateStatus(String caseNumber, CaseStatus status, LocalDate closedOn, OffsetDateTime now) {
        jdbc.sql("update case_record set status = :s, closed_on = :closed, updated_at = :now where case_number = :cn")
                .param("s", status.name())
                .param("closed", closedOn)
                .param("now", now)
                .param("cn", caseNumber)
                .update();
    }

    private static CaseView map(ResultSet rs, int row) throws SQLException {
        return new CaseView(
                rs.getString("case_number"),
                rs.getLong("applicant_id"),
                rs.getString("last_name") + ", " + rs.getString("first_name"),
                rs.getString("state_code"),
                rs.getString("case_type"),
                CaseStatus.valueOf(rs.getString("status")),
                rs.getObject("opened_on", LocalDate.class),
                rs.getObject("closed_on", LocalDate.class),
                rs.getBigDecimal("amount_claimed"),
                rs.getObject("updated_at", OffsetDateTime.class));
    }
}
