class ClientProfil {
  const ClientProfil({
    required this.id,
    required this.nom,
    required this.telephone,
    required this.email,
    required this.adresse,
  });

  final String id;
  final String nom;
  final String telephone;
  final String? email;
  final String adresse;

  factory ClientProfil.fromJson(Map<String, dynamic> json) {
    return ClientProfil(
      id: json['id'] as String,
      nom: json['nom'] as String,
      telephone: json['telephone'] as String,
      email: json['email'] as String?,
      adresse: json['adresse'] as String,
    );
  }

  ClientProfil copyWith({
    String? nom,
    String? telephone,
    String? email,
    String? adresse,
  }) {
    return ClientProfil(
      id: id,
      nom: nom ?? this.nom,
      telephone: telephone ?? this.telephone,
      email: email ?? this.email,
      adresse: adresse ?? this.adresse,
    );
  }
}

class Session {
  const Session({required this.accessToken, required this.profil});

  final String accessToken;
  final ClientProfil profil;

  factory Session.fromJson(Map<String, dynamic> json) {
    return Session(
      accessToken: json['accessToken'] as String,
      profil: ClientProfil.fromJson(json['profil'] as Map<String, dynamic>),
    );
  }
}

class Produit {
  const Produit({
    required this.id,
    required this.nom,
    required this.unite,
    required this.categorie,
    required this.prixUnitaire,
  });

  final String id;
  final String nom;
  final String unite;
  final String categorie;
  final double prixUnitaire;

  factory Produit.fromJson(Map<String, dynamic> json) {
    return Produit(
      id: json['id'] as String,
      nom: json['nom'] as String,
      unite: json['unite'] as String,
      categorie: json['categorie'] as String? ?? 'AUTRE',
      prixUnitaire: (json['prixUnitaire'] as num).toDouble(),
    );
  }
}

class LigneCommande {
  const LigneCommande({
    required this.id,
    required this.nom,
    required this.unite,
    required this.categorie,
    required this.quantite,
    required this.prixUnitaireApplique,
  });

  final String id;
  final String nom;
  final String unite;
  final String categorie;
  final double quantite;
  final double prixUnitaireApplique;

  factory LigneCommande.fromJson(Map<String, dynamic> json) {
    final produit = json['produit'] as Map<String, dynamic>;
    return LigneCommande(
      id: json['id'] as String,
      nom: produit['nom'] as String,
      unite: produit['unite'] as String,
      categorie: produit['categorie'] as String? ?? 'AUTRE',
      quantite: (json['quantite'] as num).toDouble(),
      prixUnitaireApplique: (json['prixUnitaireApplique'] as num).toDouble(),
    );
  }
}

class Commande {
  const Commande({
    required this.id,
    required this.statut,
    required this.montantTotal,
    required this.dateCommande,
    required this.updatedAt,
    required this.clientNom,
    required this.clientTelephone,
    required this.lignes,
  });

  final String id;
  final String statut;
  final double montantTotal;
  final DateTime dateCommande;
  final DateTime updatedAt;
  final String clientNom;
  final String? clientTelephone;
  final List<LigneCommande> lignes;

  factory Commande.fromJson(Map<String, dynamic> json) {
    final client = json['client'] as Map<String, dynamic>;
    final dateCommande = DateTime.parse(json['dateCommande'] as String);
    return Commande(
      id: json['id'] as String,
      statut: json['statut'] as String,
      montantTotal: (json['montantTotal'] as num).toDouble(),
      dateCommande: dateCommande,
      updatedAt: json['updatedAt'] == null
          ? dateCommande
          : DateTime.parse(json['updatedAt'] as String),
      clientNom: client['nom'] as String,
      clientTelephone: client['telephone'] as String?,
      lignes: (json['lignes'] as List<dynamic>)
          .map((ligne) => LigneCommande.fromJson(ligne as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ListeCommandes {
  const ListeCommandes({
    required this.data,
    required this.page,
    required this.totalPages,
    required this.total,
  });

  final List<Commande> data;
  final int page;
  final int totalPages;
  final int total;
}

const statutLabels = {
  'EN_ATTENTE': 'En attente',
  'CONFIRMEE': 'Confirmée',
  'TERMINEE': 'Terminée',
  'ANNULEE': 'Annulée',
};

const categorieLabels = {
  'CARBURANT': 'Carburant',
  'LUBRIFIANT': 'Lubrifiant',
  'GAZ': 'Gaz',
  'AUTRE': 'Autre',
};

String formatMoney(double value) {
  return '${value.toStringAsFixed(2).replaceAll('.', ',')} DH';
}
