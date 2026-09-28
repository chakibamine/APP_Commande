import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models.dart';


const _mois = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

class CommandeDetailPage extends StatelessWidget {
  const CommandeDetailPage({super.key, required this.commande});

  final Commande commande;

  @override
  Widget build(BuildContext context) {
    final sousTotal = commande.lignes.fold<double>(
      0,
      (total, ligne) => total + ligne.quantite * ligne.prixUnitaireApplique,
    );
    return Scaffold(
      backgroundColor: DepotColors.of(context).paper,
      appBar: AppBar(
        backgroundColor: DepotColors.of(context).paper,
        foregroundColor: DepotColors.of(context).ink,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Commande ${_reference(commande.id)}',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        children: [
          _Statut(commande: commande),
          const SizedBox(height: 12),
          const _Note(),
          const SizedBox(height: 12),
          _Client(commande: commande),
          const SizedBox(height: 18),
          Text(
            'LIGNES (${commande.lignes.length})',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: DepotColors.of(context).label,
            ),
          ),
          const SizedBox(height: 10),
          ...commande.lignes.map(
            (ligne) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _Ligne(ligne: ligne),
            ),
          ),
          const SizedBox(height: 6),
          _Montant(label: 'Sous-total', valeur: formatMoney(sousTotal)),
          Divider(height: 22, color: DepotColors.of(context).line),
          _Montant(label: 'Total', valeur: formatMoney(commande.montantTotal), fort: true),
          const SizedBox(height: 14),
          const _Politique(),
          const SizedBox(height: 18),
          Text(
            'SUIVI',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: DepotColors.of(context).label,
            ),
          ),
          const SizedBox(height: 10),
          _Suivi(commande: commande),
        ],
      ),
    );
  }
}

class _Statut extends StatelessWidget {
  const _Statut({required this.commande});

  final Commande commande;

  @override
  Widget build(BuildContext context) {
    final (fond, encre, icone) = _couleurs(commande.statut);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: DepotColors.of(context).line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    statutLabels[commande.statut] ?? commande.statut,
                    style: GoogleFonts.fraunces(
                      fontSize: 26,
                      fontWeight: FontWeight.w600,
                      color: DepotColors.of(context).ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Passée le ${_date(commande.dateCommande.toLocal())}',
                    style: GoogleFonts.outfit(color: DepotColors.of(context).muted),
                  ),
                ],
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(color: fond, shape: BoxShape.circle),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Icon(icone, color: encre),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Note extends StatelessWidget {
  const _Note();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).note,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DepotColors.of(context).noteBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'NOTE',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
                color: DepotColors.of(context).ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'La commande est traitée par le dépôt. Le montant est celui confirmé sur les lignes.',
              style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _Client extends StatelessWidget {
  const _Client({required this.commande});

  final Commande commande;

  @override
  Widget build(BuildContext context) {
    final telephone = commande.clientTelephone;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DepotColors.of(context).line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CLIENT',
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: DepotColors.of(context).label,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              commande.clientNom,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w700,
                color: DepotColors.of(context).ink,
                fontSize: 16,
              ),
            ),
            if (telephone != null && telephone.isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(telephone, style: GoogleFonts.outfit(color: DepotColors.of(context).muted)),
            ],
          ],
        ),
      ),
    );
  }
}

class _Ligne extends StatelessWidget {
  const _Ligne({required this.ligne});

  final LigneCommande ligne;

  @override
  Widget build(BuildContext context) {
    final carburant = ligne.categorie == 'CARBURANT';
    final montant = ligne.quantite * ligne.prixUnitaireApplique;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DepotColors.of(context).line),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                color: carburant ? const Color(0xFFFFF1E4) : const Color(0xFFF4F1EA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: SizedBox(
                width: 52,
                height: 52,
                child: Icon(
                  carburant ? Icons.local_gas_station : Icons.oil_barrel_outlined,
                  color: DepotColors.of(context).amber,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    ligne.nom,
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: DepotColors.of(context).ink),
                  ),
                  Text(
                    '${_qte(ligne.quantite)} ${ligne.unite} · ${formatMoney(ligne.prixUnitaireApplique)}',
                    style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
                  ),
                ],
              ),
            ),
            Text(
              formatMoney(montant),
              style: GoogleFonts.outfit(fontWeight: FontWeight.w700, color: DepotColors.of(context).amber),
            ),
          ],
        ),
      ),
    );
  }
}

class _Montant extends StatelessWidget {
  const _Montant({required this.label, required this.valeur, this.fort = false});

  final String label;
  final String valeur;
  final bool fort;

  @override
  Widget build(BuildContext context) {
    final style = GoogleFonts.outfit(
      fontSize: fort ? 18 : 14,
      fontWeight: fort ? FontWeight.w700 : FontWeight.w500,
      color: DepotColors.of(context).ink,
    );
    return Row(
      children: [
        Text(label, style: style),
        const Spacer(),
        Text(valeur, style: fort ? GoogleFonts.fraunces(fontSize: 26, fontWeight: FontWeight.w600, color: DepotColors.of(context).ink) : style),
      ],
    );
  }
}

class _Politique extends StatelessWidget {
  const _Politique();

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).note,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Text(
          'Aucun paiement n’est encaissé ici. La facture est émise par le dépôt.',
          style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
        ),
      ),
    );
  }
}

class _Suivi extends StatelessWidget {
  const _Suivi({required this.commande});

  final Commande commande;

  @override
  Widget build(BuildContext context) {
    final etapes = _etapes(commande);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DepotColors.of(context).line),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 6),
        child: Column(
          children: [
            for (var i = 0; i < etapes.length; i++)
              _EtapeLigne(etape: etapes[i], derniere: i == etapes.length - 1),
          ],
        ),
      ),
    );
  }
}

class _EtapeLigne extends StatelessWidget {
  const _EtapeLigne({required this.etape, required this.derniere});

  final _Etape etape;
  final bool derniere;

  @override
  Widget build(BuildContext context) {
    final couleur = etape.faite ? DepotColors.of(context).amber : DepotColors.of(context).line;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 22,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    color: etape.faite ? DepotColors.of(context).amber : DepotColors.of(context).card,
                    shape: BoxShape.circle,
                    border: Border.all(color: couleur, width: 2),
                  ),
                ),
                if (!derniere)
                  Expanded(child: Container(width: 2, color: couleur)),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    etape.titre,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      color: etape.faite ? DepotColors.of(context).ink : DepotColors.of(context).label,
                    ),
                  ),
                  if (etape.detail != null)
                    Text(
                      etape.detail!,
                      style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Etape {
  const _Etape({required this.titre, required this.faite, this.detail});

  final String titre;
  final bool faite;
  final String? detail;
}

List<_Etape> _etapes(Commande commande) {
  final passee = _date(commande.dateCommande.toLocal());
  final maj = _date(commande.updatedAt.toLocal());
  if (commande.statut == 'ANNULEE') {
    return [
      _Etape(titre: 'Commande passée', faite: true, detail: passee),
      _Etape(titre: 'Annulée', faite: true, detail: maj),
    ];
  }
  final confirmee = commande.statut == 'CONFIRMEE' || commande.statut == 'TERMINEE';
  final terminee = commande.statut == 'TERMINEE';
  return [
    _Etape(titre: 'Commande passée', faite: true, detail: passee),
    _Etape(
      titre: 'Confirmée',
      faite: confirmee,
      detail: commande.statut == 'CONFIRMEE' ? maj : null,
    ),
    _Etape(titre: 'Terminée', faite: terminee, detail: terminee ? maj : null),
  ];
}

(Color, Color, IconData) _couleurs(String statut) {
  return switch (statut) {
    'TERMINEE' => (const Color(0xFFE5F6EC), const Color(0xFF1D6B45), Icons.check_circle_outline),
    'CONFIRMEE' => (const Color(0xFFE7F0FF), const Color(0xFF1D4E89), Icons.autorenew),
    'ANNULEE' => (const Color(0xFFFDECEB), const Color(0xFF9D342C), Icons.cancel_outlined),
    _ => (const Color(0xFFFFF1D6), const Color(0xFF8A5A00), Icons.schedule),
  };
}

String _reference(String id) {
  final compact = id.replaceAll('-', '');
  final court = compact.length >= 8 ? compact.substring(0, 8) : compact;
  return court.toUpperCase();
}

String _date(DateTime date) {
  return '${date.day} ${_mois[date.month - 1]} ${date.year}';
}

String _qte(double quantite) {
  if (quantite == quantite.roundToDouble()) return quantite.toInt().toString();
  return quantite.toStringAsFixed(2).replaceAll('.', ',');
}