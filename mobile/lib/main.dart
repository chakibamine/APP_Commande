import 'package:flutter/material.dart';

import 'api.dart';
import 'depot_colors.dart';
import 'screens/home_page.dart';
import 'screens/login_page.dart';
import 'session_store.dart';

void main() {
  final store = SessionStore(Api());
  runApp(PetroleApp(store: store));
}

class PetroleApp extends StatefulWidget {
  const PetroleApp({super.key, required this.store});

  final SessionStore store;

  @override
  State<PetroleApp> createState() => _PetroleAppState();
}

class _PetroleAppState extends State<PetroleApp> {
  final _themes = ThemeController();

  @override
  void initState() {
    super.initState();
    _themes.addListener(_onChange);
    widget.store.addListener(_onChange);
    _themes.load();
    widget.store.load();
  }

  @override
  void dispose() {
    _themes.removeListener(_onChange);
    widget.store.removeListener(_onChange);
    super.dispose();
  }

  void _onChange() {
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Dépôt',
      theme: depotTheme(DepotColors.light, Brightness.light),
      darkTheme: depotTheme(DepotColors.dark, Brightness.dark),
      themeMode: _themes.mode,
      home: !widget.store.ready
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : widget.store.session == null
              ? LoginPage(store: widget.store)
              : HomePage(store: widget.store, themes: _themes),
    );
  }
}
