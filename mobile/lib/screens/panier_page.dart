import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models.dart';


class PanierPage extends StatelessWidget {
  const PanierPage({
    super.key,
    required this.produits,
    required this.quantiteDe,
    required this.busy,
    required this.erreur,
    required this.onRetour,
    required this.onQuantite,
    required this.onCommander,
  });

  final List<Produit> produits;
  final double Function(String id) quantiteDe;
  final bool busy;
  final String? erreur;
  final VoidCallback onRetour;
  final void Function(String id, double quantite) onQuantite;
  final VoidCallback onCommander;

  double get _total {
    var total = 0.0;
    for (final produit in produits) {
      final quantite = quantiteDe(produit.id);
      if (quantite > 0) total += quantite * produit.prixUnitaire;
    }
    return total;
  }

  @override
  Widget build(BuildContext context) {
    final lignes = produits.where((produit) => quantiteDe(produit.id) > 0).toList();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) onRetour();
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
                        onPressed: onRetour,
                        icon: Icon(Icons.arrow_back, color: DepotColors.of(context).ink),
                      ),
                      Expanded(
                        child: Text(
                          'Votre commande',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.w600,
                            color: DepotColors.of(context).ink,
                          ),
                        ),
                      ),
                      const SizedBox(width: 48),
                    ],
                  ),
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                  children: [
                    const _Politique(),
                    const SizedBox(height: 18),
                    Text(
                      'Articles (${lignes.length})',
                      style: GoogleFonts.fraunces(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: DepotColors.of(context).ink,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (lignes.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 28),
                        child: Text(
                          'Aucun article pour le moment.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(color: DepotColors.of(context).muted),
                        ),
                      )
                    else
                      ...lignes.map(
                        (produit) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _LignePanier(
                            produit: produit,
                            quantite: quantiteDe(produit.id),
                            onQuantite: (quantite) => onQuantite(produit.id, quantite),
                          ),
                        ),
                      ),
                    if (lignes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        'RÉCAPITULATIF',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: DepotColors.of(context).label,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _LigneTotal(label: 'Sous-total', valeur: formatMoney(_total)),
                      Divider(height: 22, color: DepotColors.of(context).line),
                      _LigneTotal(label: 'Total', valeur: formatMoney(_total), fort: true),
                      const SizedBox(height: 12),
                      const _Note(),
                    ],
                    if (erreur != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        erreur!,
                        style: GoogleFonts.outfit(color: const Color(0xFF9D342C)),
                      ),
                    ],
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: FilledButton(
                      onPressed: busy || lignes.isEmpty ? null : onCommander,
                      style: FilledButton.styleFrom(
                        backgroundColor: DepotColors.of(context).amber,
                        disabledBackgroundColor: DepotColors.of(context).amber.withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        busy ? 'Envoi…' : 'ENVOYER LA COMMANDE',
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
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
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.info_outline, color: DepotColors.of(context).amber, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'POLITIQUE DE COMMANDE',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.4,
                      color: DepotColors.of(context).ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Les commandes partent au dépôt. Le prix reste indicatif jusqu’à confirmation.',
                    style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LignePanier extends StatefulWidget {
  const _LignePanier({
    required this.produit,
    required this.quantite,
    required this.onQuantite,
  });

  final Produit produit;
  final double quantite;
  final ValueChanged<double> onQuantite;

  @override
  State<_LignePanier> createState() => _LignePanierState();
}

class _LignePanierState extends State<_LignePanier> {
  late final TextEditingController _champ;

  @override
  void initState() {
    super.initState();
    _champ = TextEditingController(text: _texte(widget.quantite));
  }

  @override
  void didUpdateWidget(covariant _LignePanier oldWidget) {
    super.didUpdateWidget(oldWidget);
    final saisie = double.tryParse(_champ.text.replaceAll(',', '.'));
    if (widget.quantite != oldWidget.quantite && saisie != widget.quantite) {
      _champ.text = _texte(widget.quantite);
    }
  }

  @override
  void dispose() {
    _champ.dispose();
    super.dispose();
  }

  String _texte(double quantite) {
    if (quantite == quantite.roundToDouble()) return quantite.toInt().toString();
    return quantite.toStringAsFixed(2).replaceAll('.', ',');
  }

  void _appliquer(String texte) {
    final quantite = double.tryParse(texte.replaceAll(',', '.'));
    if (quantite == null || quantite < 0) return;
    widget.onQuantite(quantite);
  }

  @override
  Widget build(BuildContext context) {
    final carburant = widget.produit.categorie == 'CARBURANT';
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
                width: 64,
                height: 64,
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
                    widget.produit.nom,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      color: DepotColors.of(context).ink,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    formatMoney(widget.produit.prixUnitaire),
                    style: GoogleFonts.outfit(
                      color: DepotColors.of(context).amber,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    'par ${widget.produit.unite}',
                    style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).label),
                  ),
                ],
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                color: const Color(0xFFF6F3EE),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _Step(
                    icon: Icons.remove,
                    onPressed: () => widget.onQuantite(widget.quantite - 1),
                  ),
                  SizedBox(
                    width: 44,
                    child: TextField(
                      controller: _champ,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.w700,
                        color: DepotColors.of(context).ink,
                      ),
                      decoration: const InputDecoration(
                        isDense: true,
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.zero,
                      ),
                      onChanged: _appliquer,
                    ),
                  ),
                  _Step(
                    icon: Icons.add,
                    onPressed: () => widget.onQuantite(widget.quantite + 1),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPressed,
      customBorder: const CircleBorder(),
      child: SizedBox(
        width: 32,
        height: 32,
        child: Icon(icon, size: 16, color: DepotColors.of(context).ink),
      ),
    );
  }
}

class _LigneTotal extends StatelessWidget {
  const _LigneTotal({required this.label, required this.valeur, this.fort = false});

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
        Text(valeur, style: style),
      ],
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
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          'Aucun paiement n’est encaissé ici. La facture est émise par le dépôt.',
          style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
        ),
      ),
    );
  }
}