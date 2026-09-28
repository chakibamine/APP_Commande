import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api.dart';
import '../models.dart';
import '../session_store.dart';
import 'commande_detail_page.dart';
import 'panier_page.dart';
import 'produit_page.dart';


enum _Famille { tous, carburant, lubrifiant, gaz, autre }

enum _Tri { nom, prixCroissant, prixDecroissant }

class CataloguePage extends StatefulWidget {
  const CataloguePage({super.key, required this.store});

  final SessionStore store;

  @override
  State<CataloguePage> createState() => _CataloguePageState();
}

class _CataloguePageState extends State<CataloguePage> {
  late Future<List<Produit>> _produits;
  final _recherche = TextEditingController();
  final _quantites = <String, double>{};
  _Famille _famille = _Famille.tous;
  _Tri _tri = _Tri.nom;
  String? _error;
  bool _busy = false;
  bool _panierOuvert = false;
  Produit? _ouvert;

  @override
  void initState() {
    super.initState();
    _produits = widget.store.api.produits();
  }

  @override
  void dispose() {
    _recherche.dispose();
    super.dispose();
  }

  double _qte(String id) => _quantites[id] ?? 0;

  int get _lignes => _quantites.values.where((q) => q > 0).length;

  double _estimation(List<Produit> produits) {
    var total = 0.0;
    for (final produit in produits) {
      final quantite = _qte(produit.id);
      if (quantite > 0) total += quantite * produit.prixUnitaire;
    }
    return total;
  }

  void _ajouter(String id) {
    setState(() => _quantites[id] = _qte(id) + 1);
  }

  List<Produit> _filtrer(List<Produit> produits) {
    final texte = _recherche.text.trim().toLowerCase();
    final resultat = produits.where((produit) {
      final familleOk = _famille == _Famille.tous || _familleDe(produit) == _famille;
      final texteOk = texte.isEmpty || produit.nom.toLowerCase().contains(texte);
      return familleOk && texteOk;
    }).toList();
    resultat.sort((a, b) {
      switch (_tri) {
        case _Tri.nom:
          return a.nom.toLowerCase().compareTo(b.nom.toLowerCase());
        case _Tri.prixCroissant:
          return a.prixUnitaire.compareTo(b.prixUnitaire);
        case _Tri.prixDecroissant:
          return b.prixUnitaire.compareTo(a.prixUnitaire);
      }
    });
    return resultat;
  }

  void _ouvrirPanier() {
    setState(() {
      _error = null;
      _panierOuvert = true;
      _ouvert = null;
    });
  }

  void _changerQuantite(String id, double quantite) {
    setState(() {
      if (quantite <= 0) {
        _quantites.remove(id);
      } else {
        _quantites[id] = quantite;
      }
    });
  }

  Future<void> _commander() async {
    final lignes = <Map<String, Object>>[];
    _quantites.forEach((id, quantite) {
      if (quantite > 0) {
        lignes.add({'produitId': id, 'quantite': quantite});
      }
    });
    if (lignes.isEmpty) {
      setState(() => _error = 'Ajoutez au moins un produit.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final commande = await widget.store.api.creerCommande(lignes);
      if (!mounted) return;
      setState(() {
        _quantites.clear();
        _panierOuvert = false;
        _ouvert = null;
      });
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => CommandeDetailPage(commande: commande),
        ),
      );
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: ColoredBox(
        color: DepotColors.of(context).paper,
        child: FutureBuilder<List<Produit>>(
          future: _produits,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return Center(child: CircularProgressIndicator(color: DepotColors.of(context).amber));
            }
            if (snapshot.hasError) {
              return _ChargementEchoue(
                message: '${snapshot.error}',
                onRetry: () {
                  setState(() => _produits = widget.store.api.produits());
                },
              );
            }
            final produits = snapshot.data ?? [];
            if (_panierOuvert) {
              return PanierPage(
                produits: produits,
                quantiteDe: _qte,
                busy: _busy,
                erreur: _error,
                onRetour: () => setState(() => _panierOuvert = false),
                onQuantite: _changerQuantite,
                onCommander: _commander,
              );
            }
            final ouvert = _ouvert;
            if (ouvert != null) {
              return ProduitPage(
                produit: ouvert,
                quantite: _qte(ouvert.id),
                lignes: _lignes,
                onRetour: () => setState(() => _ouvert = null),
                onQuantite: (quantite) {
                  setState(() {
                    if (quantite <= 0) {
                      _quantites.remove(ouvert.id);
                    } else {
                      _quantites[ouvert.id] = quantite;
                    }
                    _ouvert = null;
                  });
                },
                onPanier: _ouvrirPanier,
              );
            }
            final visibles = _filtrer(produits);
            return Column(
              children: [
                _Entete(
                  recherche: _recherche,
                  lignes: _lignes,
                  onRecherche: () => setState(() {}),
                  onPanier: _ouvrirPanier,
                ),
                Expanded(
                  child: CustomScrollView(
                    slivers: [
                      if (_error != null)
                        SliverToBoxAdapter(
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                            child: _Message(message: _error!),
                          ),
                        ),
                      const SliverToBoxAdapter(child: _Banniere()),
                      SliverToBoxAdapter(
                        child: _Categories(
                          produits: produits,
                          selection: _famille,
                          onSelected: (famille) => setState(() => _famille = famille),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: _TitreListe(
                          nombre: visibles.length,
                          tri: _tri,
                          onTri: (tri) => setState(() => _tri = tri),
                        ),
                      ),
                      if (visibles.isEmpty)
                        const SliverToBoxAdapter(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Text(
                              'Aucun produit ne correspond.',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        )
                      else
                        SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.62,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final produit = visibles[index];
                                return _CarteProduit(
                                  produit: produit,
                                  quantite: _qte(produit.id),
                                  onAjouter: () => _ajouter(produit.id),
                                  onOuvrir: () => setState(() => _ouvert = produit),
                                );
                              },
                              childCount: visibles.length,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                _BarreCommande(
                  total: _estimation(produits),
                  onVoir: _busy ? null : _ouvrirPanier,
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

_Famille _familleDe(Produit produit) {
  return switch (produit.categorie) {
    'CARBURANT' => _Famille.carburant,
    'LUBRIFIANT' => _Famille.lubrifiant,
    'GAZ' => _Famille.gaz,
    _ => _Famille.autre,
  };
}

class _Entete extends StatelessWidget {
  const _Entete({
    required this.recherche,
    required this.lignes,
    required this.onRecherche,
    required this.onPanier,
  });

  final TextEditingController recherche;
  final int lignes;
  final VoidCallback onRecherche;
  final VoidCallback onPanier;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF243656),
            Color(0xFF8C4E3A),
            Color(0xFFE39A55),
            Color(0xFFF6D7A2),
          ],
          stops: [0, 0.42, 0.72, 1],
        ),
      ),
      child: Stack(
        children: [
          const Positioned.fill(child: CustomPaint(painter: _CuvesPainter())),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const SizedBox(width: 48),
                      Expanded(
                        child: Text(
                          'Catalogue',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: onPanier,
                        icon: Badge(
                          isLabelVisible: lignes > 0,
                          label: Text('$lignes'),
                          child: const Icon(Icons.shopping_cart_outlined, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    'BGI Commandes',
                    style: GoogleFonts.fraunces(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w600,
                      height: 1.05,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Carburants et lubrifiants',
                    style: GoogleFonts.outfit(color: const Color(0xFFF8EFE4), fontSize: 14),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: recherche,
                    onChanged: (_) => onRecherche(),
                    style: GoogleFonts.outfit(color: DepotColors.of(context).ink),
                    decoration: InputDecoration(
                      hintText: 'Rechercher un produit…',
                      hintStyle: GoogleFonts.outfit(color: DepotColors.of(context).label),
                      filled: true,
                      fillColor: Colors.white,
                      prefixIcon: Icon(Icons.search, color: DepotColors.of(context).label),
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none,
                      ),
                    ),
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

class _CuvesPainter extends CustomPainter {
  const _CuvesPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0x33FFFFFF);
    final base = size.height - 8;
    for (var i = 0; i < 5; i++) {
      final left = size.width * (0.08 + i * 0.18);
      final hauteur = 28.0 + (i % 2) * 10;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(left, base - hauteur, 28, hauteur),
          const Radius.circular(4),
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Banniere extends StatelessWidget {
  const _Banniere();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: DepotColors.of(context).note,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: DepotColors.of(context).noteBorder),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.receipt_long_outlined, color: DepotColors.of(context).amber, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'COMMANDE SANS PAIEMENT EN LIGNE',
                      style: GoogleFonts.outfit(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.4,
                        color: DepotColors.of(context).ink,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Les commandes sont envoyées au dépôt. Le règlement se fait sur le compte client.',
                      style: GoogleFonts.outfit(fontSize: 13, height: 1.35, color: DepotColors.of(context).muted),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Categories extends StatelessWidget {
  const _Categories({
    required this.produits,
    required this.selection,
    required this.onSelected,
  });

  final List<Produit> produits;
  final _Famille selection;
  final ValueChanged<_Famille> onSelected;

  @override
  Widget build(BuildContext context) {
    final familles = [
      _Famille.tous,
      if (produits.any((produit) => _familleDe(produit) == _Famille.carburant))
        _Famille.carburant,
      if (produits.any((produit) => _familleDe(produit) == _Famille.lubrifiant))
        _Famille.lubrifiant,
      if (produits.any((produit) => _familleDe(produit) == _Famille.gaz)) _Famille.gaz,
      if (produits.any((produit) => _familleDe(produit) == _Famille.autre)) _Famille.autre,
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'CATÉGORIES',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.6,
                  color: DepotColors.of(context).label,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => onSelected(_Famille.tous),
                child: Text(
                  'Tout voir',
                  style: GoogleFonts.outfit(
                    color: DepotColors.of(context).amber,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(
            height: 78,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: familles.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final famille = familles[index];
                return _PuceCategorie(
                  famille: famille,
                  selected: famille == selection,
                  onTap: () => onSelected(famille),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _PuceCategorie extends StatelessWidget {
  const _PuceCategorie({
    required this.famille,
    required this.selected,
    required this.onTap,
  });

  final _Famille famille;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final (label, icon) = switch (famille) {
      _Famille.tous => ('Tous', Icons.grid_view_rounded),
      _Famille.carburant => ('Carburant', Icons.local_gas_station),
      _Famille.lubrifiant => ('Lubrifiants', Icons.water_drop_outlined),
      _Famille.gaz => ('Gaz', Icons.propane_tank_outlined),
      _Famille.autre => ('Autres', Icons.inventory_2_outlined),
    };
    final fond = selected ? DepotColors.of(context).amber : DepotColors.of(context).card;
    final encre = selected ? Colors.white : DepotColors.of(context).ink;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 76,
        decoration: BoxDecoration(
          color: fond,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: selected ? DepotColors.of(context).amber : DepotColors.of(context).line),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: encre, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: encre,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TitreListe extends StatelessWidget {
  const _TitreListe({
    required this.nombre,
    required this.tri,
    required this.onTri,
  });

  final int nombre;
  final _Tri tri;
  final ValueChanged<_Tri> onTri;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
      child: Row(
        children: [
          Text(
            'TOUS LES PRODUITS ($nombre)',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
              color: DepotColors.of(context).ink,
            ),
          ),
          const Spacer(),
          PopupMenuButton<_Tri>(
            initialValue: tri,
            onSelected: onTri,
            icon: Icon(Icons.swap_vert, color: DepotColors.of(context).ink),
            itemBuilder: (context) => const [
              PopupMenuItem(value: _Tri.nom, child: Text('Nom')),
              PopupMenuItem(value: _Tri.prixCroissant, child: Text('Prix croissant')),
              PopupMenuItem(value: _Tri.prixDecroissant, child: Text('Prix décroissant')),
            ],
          ),
        ],
      ),
    );
  }
}

class _CarteProduit extends StatelessWidget {
  const _CarteProduit({
    required this.produit,
    required this.quantite,
    required this.onAjouter,
    required this.onOuvrir,
  });

  final Produit produit;
  final double quantite;
  final VoidCallback onAjouter;
  final VoidCallback onOuvrir;

  @override
  Widget build(BuildContext context) {
    final carburant = _familleDe(produit) == _Famille.carburant;
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10172033),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: DepotColors.of(context).card,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onOuvrir,
          child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: carburant ? const Color(0xFFFFF1E4) : const Color(0xFFF4F1EA),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Icon(
                    carburant ? Icons.local_gas_station : Icons.oil_barrel_outlined,
                    color: DepotColors.of(context).amber,
                    size: 36,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              produit.nom,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.outfit(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: DepotColors.of(context).ink,
                height: 1.2,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              categorieLabels[produit.categorie] ?? 'Autre',
              style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).muted),
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        formatMoney(produit.prixUnitaire),
                        style: GoogleFonts.outfit(
                          color: DepotColors.of(context).amber,
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        'par ${produit.unite}',
                        style: GoogleFonts.outfit(fontSize: 11, color: DepotColors.of(context).label),
                      ),
                    ],
                  ),
                ),
                _BoutonPlus(quantite: quantite, onPressed: onAjouter),
              ],
            ),
          ],
        ),
          ),
        ),
      ),
    );
  }
}

class _BoutonPlus extends StatelessWidget {
  const _BoutonPlus({required this.quantite, required this.onPressed});

  final double quantite;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final label = quantite == quantite.roundToDouble()
        ? quantite.toInt().toString()
        : quantite.toStringAsFixed(1);
    return Material(
      color: DepotColors.of(context).amber,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onPressed,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Center(
            child: quantite > 0
                ? Text(
                    label,
                    style: GoogleFonts.outfit(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  )
                : const Icon(Icons.add, color: Colors.white, size: 20),
          ),
        ),
      ),
    );
  }
}

class _BarreCommande extends StatelessWidget {
  const _BarreCommande({required this.total, required this.onVoir});

  final double total;
  final VoidCallback? onVoir;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? const Color(0xFF243044)
              : const Color(0xFF172033),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 10, 10),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: DepotColors.of(context).amber,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.shopping_bag_outlined, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'VOTRE COMMANDE',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.4,
                      ),
                    ),
                    Text(
                      'Estimation ${formatMoney(total)}',
                      style: GoogleFonts.outfit(color: const Color(0xFFD9D3C8), fontSize: 12),
                    ),
                  ],
                ),
              ),
              FilledButton(
                onPressed: onVoir,
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: const Color(0xFF172033),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(
                  'VOIR',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, letterSpacing: 0.6),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


class _Message extends StatelessWidget {
  const _Message({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFFDECEB),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          message,
          style: GoogleFonts.outfit(color: const Color(0xFF9D342C), fontSize: 14),
        ),
      ),
    );
  }
}

class _ChargementEchoue extends StatelessWidget {
  const _ChargementEchoue({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            FilledButton(onPressed: onRetry, child: const Text('Réessayer')),
          ],
        ),
      ),
    );
  }
}
