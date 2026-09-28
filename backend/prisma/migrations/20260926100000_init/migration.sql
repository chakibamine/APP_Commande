BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Client] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nom] NVARCHAR(200) NOT NULL,
    [telephone] NVARCHAR(30) NOT NULL,
    [email] NVARCHAR(255),
    [adresse] NVARCHAR(500) NOT NULL,
    [motDePasse] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Client_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Client_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Client_telephone_key] UNIQUE NONCLUSTERED ([telephone])
);

-- CreateTable
CREATE TABLE [dbo].[Utilisateur] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nom] NVARCHAR(200) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [motDePasse] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(20) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Utilisateur_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Utilisateur_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Utilisateur_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Produit] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [nom] NVARCHAR(200) NOT NULL,
    [unite] NVARCHAR(50) NOT NULL,
    [prixUnitaire] DECIMAL(18,4) NOT NULL,
    [disponible] BIT NOT NULL CONSTRAINT [Produit_disponible_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Produit_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Produit_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Commande] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [clientId] UNIQUEIDENTIFIER NOT NULL,
    [statut] NVARCHAR(20) NOT NULL CONSTRAINT [Commande_statut_df] DEFAULT 'EN_ATTENTE',
    [montantTotal] DECIMAL(18,4) NOT NULL,
    [dateCommande] DATETIME2 NOT NULL CONSTRAINT [Commande_dateCommande_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Commande_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[LigneCommande] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [commandeId] UNIQUEIDENTIFIER NOT NULL,
    [produitId] UNIQUEIDENTIFIER NOT NULL,
    [quantite] DECIMAL(18,4) NOT NULL,
    [prixUnitaireApplique] DECIMAL(18,4) NOT NULL,
    CONSTRAINT [LigneCommande_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Commande_clientId_idx] ON [dbo].[Commande]([clientId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Commande_statut_idx] ON [dbo].[Commande]([statut]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LigneCommande_commandeId_idx] ON [dbo].[LigneCommande]([commandeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [LigneCommande_produitId_idx] ON [dbo].[LigneCommande]([produitId]);

-- AddForeignKey
ALTER TABLE [dbo].[Commande] ADD CONSTRAINT [Commande_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[Client]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LigneCommande] ADD CONSTRAINT [LigneCommande_commandeId_fkey] FOREIGN KEY ([commandeId]) REFERENCES [dbo].[Commande]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[LigneCommande] ADD CONSTRAINT [LigneCommande_produitId_fkey] FOREIGN KEY ([produitId]) REFERENCES [dbo].[Produit]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- SQL Server autorise plusieurs emails NULL ; l'unicité ne porte que sur les valeurs renseignées.
CREATE UNIQUE NONCLUSTERED INDEX [Client_email_key] ON [dbo].[Client]([email]) WHERE [email] IS NOT NULL;

ALTER TABLE [dbo].[Utilisateur] ADD CONSTRAINT [Utilisateur_role_check] CHECK ([role] IN (N'ADMIN', N'GESTIONNAIRE'));

ALTER TABLE [dbo].[Commande] ADD CONSTRAINT [Commande_statut_check] CHECK ([statut] IN (N'EN_ATTENTE', N'CONFIRMEE', N'TERMINEE', N'ANNULEE'));

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
