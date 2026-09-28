import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../depot_colors.dart';
import '../session_store.dart';
import 'catalogue_page.dart';
import 'commandes_page.dart';
import 'profil_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, required this.store, required this.themes});

  final SessionStore store;
  final ThemeController themes;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;
  int _historique = 0;

  @override
  Widget build(BuildContext context) {
    final colors = DepotColors.of(context);
    return Scaffold(
      backgroundColor: colors.paper,
      body: IndexedStack(
        index: _index,
        children: [
          CataloguePage(store: widget.store),
          CommandesPage(store: widget.store, generation: _historique),
          ProfilPage(store: widget.store, themes: widget.themes),
        ],
      ),
      bottomNavigationBar: Theme(
        data: Theme.of(context).copyWith(
          navigationBarTheme: NavigationBarThemeData(
            backgroundColor: colors.card,
            indicatorColor: colors.amber.withValues(alpha: 0.18),
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return GoogleFonts.outfit(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? colors.amber : colors.label,
              );
            }),
            iconTheme: WidgetStateProperty.resolveWith((states) {
              final selected = states.contains(WidgetState.selected);
              return IconThemeData(color: selected ? colors.amber : colors.label);
            }),
          ),
        ),
        child: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (index) {
            setState(() {
              _index = index;
              if (index == 1) _historique++;
            });
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.grid_view_outlined),
              selectedIcon: Icon(Icons.grid_view_rounded),
              label: 'Catalogue',
            ),
            NavigationDestination(
              icon: Icon(Icons.receipt_long_outlined),
              selectedIcon: Icon(Icons.receipt_long),
              label: 'Commandes',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }
}
