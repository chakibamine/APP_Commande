import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api.dart';
import '../models.dart';
import '../session_store.dart';
import 'commande_detail_page.dart';


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

class CommandesPage extends StatefulWidget {
  const CommandesPage({
    super.key,
    required this.store,
    required this.generation,
  });

  final SessionStore store;
  final int generation;

  @override
  State<CommandesPage> createState() => _CommandesPageState();
}

class _CommandesPageState extends State<CommandesPage> {
  final _recherche = TextEditingController();
  List<Commande> _commandes = [];
  String? _statut;
  bool _plusRecentes = true;
  bool _chargement = true;
  bool _suite = false;
  String? _erreur;
  int _page = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _charger();
  }

  @override
  void didUpdateWidget(covariant CommandesPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.generation != oldWidget.generation && !_chargement && !_suite) {
      _charger();
    }
  }

  @override
  void dispose() {
    _recherche.dispose();
    super.dispose();
  }

  Future<void> _charger({bool suite = false}) async {
    final page = suite ? _page + 1 : 1;
    setState(() {
      if (suite) {
        _suite = true;
      } else {
        _chargement = true;
      }
      _erreur = null;
    });
    try {
      final resultat = await widget.store.api.mesCommandes(page: page);
      if (!mounted) return;
      setState(() {
        _commandes = suite ? [..._commandes, ...resultat.data] : resultat.data;
        _page = resultat.page;
        _totalPages = resultat.totalPages;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _erreur = error.message);
    } finally {
      if (mounted) {
        setState(() {
          _chargement = false;
          _suite = false;
        });
      }
    }
  }

  List<Commande> get _visibles {
    final texte = _recherche.text.trim().toLowerCase();
    final resultat = _commandes.where((commande) {
      final statutOk = _statut == null || commande.statut == _statut;
      if (!statutOk) return false;
      if (texte.isEmpty) return true;
      final reference = _reference(commande.id).toLowerCase();
      final produits = commande.lignes.map((ligne) => ligne.nom.toLowerCase()).join(' ');
      return reference.contains(texte) || produits.contains(texte);
    }).toList();
    resultat.sort((a, b) {
      final ordre = a.dateCommande.compareTo(b.dateCommande);
      return _plusRecentes ? -ordre : ordre;
    });
    return resultat;
  }

  @override
  Widget build(BuildContext context) {
    final visibles = _visibles;
    final encore = _page < _totalPages;
    return ColoredBox(
      color: DepotColors.of(context).paper,
      child: SafeArea(
        bottom: false,
        child: _chargement
            ? Center(child: CircularProgressIndicator(color: DepotColors.of(context).amber))
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                children: [
                  Text(
                    'Historique',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w600,
                      color: DepotColors.of(context).ink,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _recherche,
                    onChanged: (_) => setState(() {}),
                    style: GoogleFonts.outfit(color: DepotColors.of(context).ink),
                    decoration: InputDecoration(
                      hintText: 'Rechercher une référence ou un produit…',
                      hintStyle: GoogleFonts.outfit(color: DepotColors.of(context).label, fontSize: 14),
                      filled: true,
                      fillColor: DepotColors.of(context).field,
                      prefixIcon: Icon(Icons.search, color: DepotColors.of(context).label),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: DepotColors.of(context).line),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide(color: DepotColors.of(context).line),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _MenuFiltre(
                          statut: _statut,
                          onSelected: (statut) => setState(() => _statut = statut),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _MenuTri(
                          plusRecentes: _plusRecentes,
                          onSelected: (valeur) => setState(() => _plusRecentes = valeur),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const _Politique(),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Text(
                        'ACTIVITÉ RÉCENTE',
                        style: GoogleFonts.outfit(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.6,
                          color: DepotColors.of(context).label,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${visibles.length} commande${visibles.length > 1 ? 's' : ''}',
                        style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_erreur != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        _erreur!,
                        style: GoogleFonts.outfit(color: const Color(0xFF9D342C)),
                      ),
                    ),
                  if (visibles.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 28),
                      child: Text(
                        _commandes.isEmpty
                            ? 'Aucune commande pour le moment.'
                            : 'Aucune commande ne correspond.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(color: DepotColors.of(context).muted),
                      ),
                    )
                  else
                    ...visibles.map(
                      (commande) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _CarteCommande(
                          commande: commande,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => CommandeDetailPage(commande: commande),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  if (visibles.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      encore
                          ? 'D’autres commandes sont disponibles.'
                          : 'Fin de la liste.',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).label),
                    ),
                  ],
                  if (encore) ...[
                    const SizedBox(height: 10),
                    TextButton(
                      onPressed: _suite ? null : () => _charger(suite: true),
                      child: Text(
                        _suite ? 'Chargement…' : 'VOIR LES COMMANDES SUIVANTES',
                        style: GoogleFonts.outfit(
                          color: DepotColors.of(context).amber,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.4,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}

class _MenuFiltre extends StatelessWidget {
  const _MenuFiltre({required this.statut, required this.onSelected});

  final String? statut;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      onSelected: (valeur) => onSelected(valeur.isEmpty ? null : valeur),
      itemBuilder: (context) => [
        const PopupMenuItem(value: '', child: Text('Tous les statuts')),
        for (final entry in statutLabels.entries)
          PopupMenuItem(value: entry.key, child: Text(entry.value)),
      ],
      child: _PuceMenu(
        icon: Icons.filter_alt_outlined,
        label: statut == null ? 'Statut' : (statutLabels[statut] ?? 'Statut'),
      ),
    );
  }
}

class _MenuTri extends StatelessWidget {
  const _MenuTri({required this.plusRecentes, required this.onSelected});

  final bool plusRecentes;
  final ValueChanged<bool> onSelected;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<bool>(
      onSelected: onSelected,
      itemBuilder: (context) => const [
        PopupMenuItem(value: true, child: Text('Plus récentes')),
        PopupMenuItem(value: false, child: Text('Plus anciennes')),
      ],
      child: _PuceMenu(
        icon: Icons.swap_vert,
        label: plusRecentes ? 'Date' : 'Date ↑',
      ),
    );
  }
}

class _PuceMenu extends StatelessWidget {
  const _PuceMenu({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: DepotColors.of(context).line),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        child: Row(
          children: [
            Icon(icon, size: 16, color: DepotColors.of(context).ink),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: DepotColors.of(context).ink,
                ),
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
              'POLITIQUE DE RÈGLEMENT',
              style: GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
                color: DepotColors.of(context).ink,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Aucun paiement n’est encaissé ici. La facture est émise par le dépôt.',
              style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _CarteCommande extends StatelessWidget {
  const _CarteCommande({required this.commande, required this.onTap});

  final Commande commande;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final nombre = commande.lignes.length;
    return Material(
      color: DepotColors.of(context).card,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: DepotColors.of(context).line),
          ),
          padding: const EdgeInsets.fromLTRB(14, 12, 10, 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'RÉFÉRENCE',
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                            color: DepotColors.of(context).label,
                          ),
                        ),
                        const Spacer(),
                        _BadgeStatut(statut: commande.statut),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _reference(commande.id),
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: DepotColors.of(context).ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _date(commande.dateCommande.toLocal()),
                      style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
                    ),
                    Text(
                      '$nombre produit${nombre > 1 ? 's' : ''}',
                      style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'MONTANT',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                        color: DepotColors.of(context).label,
                      ),
                    ),
                    Text(
                      formatMoney(commande.montantTotal),
                      style: GoogleFonts.fraunces(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: DepotColors.of(context).ink,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: DepotColors.of(context).label),
            ],
          ),
        ),
      ),
    );
  }
}

class _BadgeStatut extends StatelessWidget {
  const _BadgeStatut({required this.statut});

  final String statut;

  @override
  Widget build(BuildContext context) {
    final (fond, encre, icone) = switch (statut) {
      'TERMINEE' => (const Color(0xFFE5F6EC), const Color(0xFF1D6B45), Icons.check_circle_outline),
      'CONFIRMEE' => (const Color(0xFFE7F0FF), const Color(0xFF1D4E89), Icons.autorenew),
      'ANNULEE' => (const Color(0xFFFDECEB), const Color(0xFF9D342C), Icons.cancel_outlined),
      _ => (const Color(0xFFFFF1D6), const Color(0xFF8A5A00), Icons.schedule),
    };
    return DecoratedBox(
      decoration: BoxDecoration(
        color: fond,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icone, size: 14, color: encre),
            const SizedBox(width: 4),
            Text(
              statutLabels[statut] ?? statut,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: encre,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _reference(String id) {
  final compact = id.replaceAll('-', '');
  final court = compact.length >= 8 ? compact.substring(0, 8) : compact;
  return court.toUpperCase();
}

String _date(DateTime date) {
  return '${date.day} ${_mois[date.month - 1]} ${date.year}';
}
