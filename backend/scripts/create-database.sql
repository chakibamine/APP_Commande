IF DB_ID(N'petrole_db') IS NULL
BEGIN
  CREATE DATABASE petrole_db;
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'petrole_app')
BEGIN
  CREATE LOGIN petrole_app
    WITH PASSWORD = N'Your_strong_Password1',
         CHECK_POLICY = ON,
         CHECK_EXPIRATION = OFF;
END
GO

USE petrole_db;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'petrole_app')
BEGIN
  CREATE USER petrole_app FOR LOGIN petrole_app;
END
GO

ALTER ROLE db_owner ADD MEMBER petrole_app;
GO
