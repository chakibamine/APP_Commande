import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models.dart';


class ProduitPage extends StatefulWidget {
  const ProduitPage({
    super.key,
    required this.produit,
    required this.quantite,
    required this.lignes,
    required this.onRetour,
    required this.onQuantite,
    required this.onPanier,
  });

  final Produit produit;
  final double quantite;
  final int lignes;
  final VoidCallback onRetour;
  final ValueChanged<double> onQuantite;
  final VoidCallback onPanier;

  @override
  State<ProduitPage> createState() => _ProduitPageState();
}

class _ProduitPageState extends State<ProduitPage> {
  late double _quantite;

  @override
  void initState() {
    super.initState();
    _quantite = widget.quantite > 0 ? widget.quantite : 1;
  }

  double get _total => _quantite * widget.produit.prixUnitaire;

  String _qteLabel(double quantite) {
    if (quantite == quantite.roundToDouble()) return quantite.toInt().toString();
    return quantite.toStringAsFixed(1).replaceAll('.', ',');
  }

  void _changer(double delta) {
    final next = _quantite + delta;
    setState(() => _quantite = next < 0 ? 0 : next);
  }

  @override
  Widget build(BuildContext context) {
    final produit = widget.produit;
    final carburant = produit.categorie == 'CARBURANT';
    final compact = produit.id.replaceAll('-', '');
    final reference = (compact.length >= 8 ? compact.substring(0, 8) : compact).toUpperCase();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) widget.onRetour();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark,
        child: ColoredBox(
          color: DepotColors.of(context).paper,
          child: Column(
            children: [
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: widget.onRetour,
                        icon: Icon(Icons.arrow_back, color: DepotColors.of(context).ink),
                      ),
                      Expanded(
                        child: Text(
                          'Fiche produit',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w600,
                            color: DepotColors.of(context).ink,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: widget.onPanier,
                        icon: Badge(
                          isLabelVisible: widget.lignes > 0,
                          label: Text('${widget.lignes}'),
                          child: Icon(Icons.shopping_cart_outlined, color: DepotColors.of(context).ink),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                  children: [
                    Text(
                      'Réf. $reference · ${(categorieLabels[produit.categorie] ?? 'Autre').toUpperCase()}',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.6,
                        color: DepotColors.of(context).label,
                      ),
                    ),
                    const SizedBox(height: 10),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: carburant ? const Color(0xFFFFF1E4) : const Color(0xFFF7F1E6),
                        borderRadius: BorderRadius.circular(22),
                      ),
                      child: SizedBox(
                        height: 210,
                        child: Center(
                          child: Icon(
                            carburant ? Icons.local_gas_station : Icons.oil_barrel_outlined,
                            color: DepotColors.of(context).amber,
                            size: 72,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      formatMoney(produit.prixUnitaire),
                      style: GoogleFonts.fraunces(
                        fontSize: 36,
                        fontWeight: FontWeight.w600,
                        color: DepotColors.of(context).amber,
                        height: 1,
                      ),
                    ),
                    Text(
                      'par ${produit.unite}',
                      style: GoogleFonts.outfit(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: DepotColors.of(context).label,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      produit.nom,
                      style: GoogleFonts.fraunces(
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        color: DepotColors.of(context).ink,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Prix unitaire appliqué au moment de la commande. Le règlement se fait sur le compte client, pas dans l’application.',
                      style: GoogleFonts.outfit(fontSize: 14, height: 1.4, color: DepotColors.of(context).muted),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'INFORMATIONS',
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: DepotColors.of(context).label,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: _InfoCarte(titre: 'Unité', valeur: produit.unite),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _InfoCarte(
                            titre: 'Catégorie',
                            valeur: categorieLabels[produit.categorie] ?? 'Autre',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _InfoCarte(
                            titre: 'Prix unitaire',
                            valeur: formatMoney(produit.prixUnitaire),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const _Politique(),
                  ],
                ),
              ),
              _BarreAjout(
                total: _total,
                quantite: _qteLabel(_quantite),
                dejaAjoute: widget.quantite > 0,
                onMoins: _quantite <= 0 ? null : () => _changer(-1),
                onPlus: () => _changer(1),
                onAjouter: _quantite <= 0 ? null : () => widget.onQuantite(_quantite),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoCarte extends StatelessWidget {
  const _InfoCarte({required this.titre, required this.valeur});

  final String titre;
  final String valeur;

  @override
  Widget build(BuildContext context) {
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
              titre,
              style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
            ),
            const SizedBox(height: 6),
            Text(
              valeur,
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: DepotColors.of(context).ink,
              ),
            ),
          ],
        ),
      ),
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
        border: Border.all(color: DepotColors.of(context).noteBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'POLITIQUE DE COMMANDE',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
                color: DepotColors.of(context).ink,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'La commande est transmise au dépôt. Aucun paiement n’est encaissé ici.',
              style: GoogleFonts.outfit(fontSize: 13, height: 1.4, color: DepotColors.of(context).muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _BarreAjout extends StatelessWidget {
  const _BarreAjout({
    required this.total,
    required this.quantite,
    required this.dejaAjoute,
    required this.onMoins,
    required this.onPlus,
    required this.onAjouter,
  });

  final double total;
  final String quantite;
  final bool dejaAjoute;
  final VoidCallback? onMoins;
  final VoidCallback onPlus;
  final VoidCallback? onAjouter;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        border: Border(top: BorderSide(color: DepotColors.of(context).line)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'TOTAL ESTIMÉ',
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color: DepotColors.of(context).label,
                          ),
                        ),
                        Text(
                          formatMoney(total),
                          style: GoogleFonts.fraunces(
                            fontSize: 26,
                            fontWeight: FontWeight.w600,
                            color: DepotColors.of(context).ink,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _Step(
                    icon: Icons.remove,
                    onPressed: onMoins,
                    filled: false,
                  ),
                  SizedBox(
                    width: 48,
                    child: Text(
                      quantite,
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: DepotColors.of(context).ink,
                      ),
                    ),
                  ),
                  _Step(icon: Icons.add, onPressed: onPlus, filled: true),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: onAjouter,
                  style: FilledButton.styleFrom(
                    backgroundColor: DepotColors.of(context).amber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    dejaAjoute ? 'METTRE À JOUR LA COMMANDE' : 'AJOUTER À LA COMMANDE',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.icon, required this.onPressed, required this.filled});

  final IconData icon;
  final VoidCallback? onPressed;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? DepotColors.of(context).amber : DepotColors.of(context).card,
      shape: CircleBorder(side: BorderSide(color: filled ? DepotColors.of(context).amber : DepotColors.of(context).line)),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(icon, size: 18, color: filled ? Colors.white : DepotColors.of(context).ink),
        ),
      ),
    );
  }
}
