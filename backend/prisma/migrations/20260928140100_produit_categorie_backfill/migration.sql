ALTER TABLE [dbo].[Produit] ADD CONSTRAINT [Produit_categorie_check] CHECK ([categorie] IN (N'CARBURANT', N'LUBRIFIANT', N'GAZ', N'AUTRE'));

UPDATE [dbo].[Produit]
SET [categorie] = N'CARBURANT'
WHERE [nom] IN (N'Gasoil', N'SSP', N'Gazole', N'Essence', N'Super sans plomb');
