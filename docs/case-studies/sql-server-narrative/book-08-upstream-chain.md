# Book 08 — The Upstream Application Chain

**Applications that depend on Windows Authentication or LDAP**

## Why this book exists

The SQL Server authentication migration is not complete until the applications that connect to it have been migrated. Applications that depend on Windows Authentication or LDAP bind must be migrated or wrapped.

## Four classes of applications

1. **Native token support.** Applications that can be reconfigured to use cloud-identity tokens without code changes. These are migrated by changing the connection string.
2. **Proxy required.** Applications that cannot use tokens natively but can be fronted by a proxy that translates between the application’s authentication model and the cloud identity plane.
3. **Code change required.** Applications that embed Windows Authentication or LDAP bind in a way that cannot be proxied. These require a code change before they can be migrated.
4. **Retire.** Applications that are no longer required. These are retired before any authentication work begins on the instances they use.

## Connection-string migration

Every connection string found in the authentication audit is classified into one of the four classes. The classification is the work plan. Connection strings that can be changed without code changes are changed first. Connection strings that require code changes are scheduled. Connection strings for retired applications are removed.

## The gate

No instance is considered fully migrated until every connection string that targets it has been classified and either changed, scheduled, or removed.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
