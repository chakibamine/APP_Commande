ALTER TABLE [dbo].[Produit] ADD [categorie] NVARCHAR(20) NOT NULL CONSTRAINT [Produit_categorie_df] DEFAULT N'AUTRE';
