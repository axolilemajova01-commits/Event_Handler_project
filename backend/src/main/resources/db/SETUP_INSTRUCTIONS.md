# PostgreSQL Database Setup Instructions

## Step 1: Create Database in pgAdmin 4

1. Open pgAdmin 4
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `tut_event_handler`
4. Owner: `postgres` (or your preferred user)
5. Click "Save"

## Step 2: Create Database User (Optional but Recommended)

1. Right-click on "Login/Group Roles" → "Create" → "Login/Group Role"
2. Name: `tut_app_user`
3. Go to "Definition" tab:
   - Password: Choose a strong password (e.g., `TutApp2024!`)
4. Go to "Privileges" tab:
   - Check "Can login"
5. Click "Save"

## Step 3: Run the Schema Script

1. In pgAdmin, expand your database `tut_event_handler`
2. Right-click on "Query Tool" (or use the toolbar button)
3. Open the file: `backend/src/main/resources/db/migration/V1__create_schema.sql`
4. Click the "Execute/Run" button (▶️ or F5)
5. You should see: "Query returned successfully"

## Step 4: Verify Tables Created

In the Query Tool, run this to verify:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- campus
- events
- faculty
- registration
- saved_event
- users

## Step 5: Verify Seed Data

```sql
-- Check campuses
SELECT * FROM campus;

-- Check faculties
SELECT * FROM faculty;

-- Check users (should be empty initially)
SELECT COUNT(*) FROM users;
```

## Step 6: Grant Permissions (if you created a separate app user)

```sql
-- Replace 'tut_app_user' with your actual username
GRANT ALL ON ALL TABLES IN SCHEMA public TO tut_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tut_app_user;
GRANT SELECT ON v_event_summary, v_user_summary TO tut_app_user;
```

## Step 7: Update application.yml

Update your Spring Boot configuration to connect to PostgreSQL:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/tut_event_handler
    username: postgres  # or tut_app_user
    password: your_password  # replace with actual password
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate  # Use 'update' for development, 'validate' for production
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
    open-in-view: false
```

## Troubleshooting

### Error: "type user_role does not exist"
- Make sure you ran the ENUM creation statements first
- Check that the schema file executed completely

### Error: "permission denied"
- Ensure you're connected as a superuser or the table owner
- Run the GRANT statements if using a separate app user

### Error: "relation already exists"
- This is fine if you're re-running the script
- The `ON CONFLICT DO NOTHING` handles duplicate seed data

## Next Steps

After database setup:
1. Update `pom.xml` to add PostgreSQL driver dependency
2. Update JPA entities if needed (they should work as-is)
3. Test connection with Spring Boot application
4. Proceed to build admin endpoints