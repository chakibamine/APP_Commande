import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api.dart';
import '../depot_colors.dart';
import '../session_store.dart';

class ProfilPage extends StatefulWidget {
  const ProfilPage({super.key, required this.store, required this.themes});

  final SessionStore store;
  final ThemeController themes;

  @override
  State<ProfilPage> createState() => _ProfilPageState();
}

class _ProfilPageState extends State<ProfilPage> {
  late final TextEditingController _nom;
  late final TextEditingController _telephone;
  late final TextEditingController _email;
  late final TextEditingController _adresse;
  final _motDePasse = TextEditingController();
  String? _message;
  bool _error = false;
  bool _busy = false;
  bool _masque = true;

  @override
  void initState() {
    super.initState();
    final profil = widget.store.session!.profil;
    _nom = TextEditingController(text: profil.nom);
    _telephone = TextEditingController(text: profil.telephone);
    _email = TextEditingController(text: profil.email ?? '');
    _adresse = TextEditingController(text: profil.adresse);
  }

  @override
  void dispose() {
    _nom.dispose();
    _telephone.dispose();
    _email.dispose();
    _adresse.dispose();
    _motDePasse.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    final body = {
      'nom': _nom.text.trim(),
      'telephone': _telephone.text.trim(),
      'adresse': _adresse.text.trim(),
    };
    if (_email.text.trim().isNotEmpty) body['email'] = _email.text.trim();
    if (_motDePasse.text.isNotEmpty) body['motDePasse'] = _motDePasse.text;
    try {
      final profil = await widget.store.api.mettreAJourProfil(body);
      await widget.store.mettreAJourProfil(profil);
      _motDePasse.clear();
      setState(() {
        _message = 'Profil mis à jour.';
        _error = false;
      });
    } on ApiException catch (error) {
      setState(() {
        _message = error.message;
        _error = true;
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = DepotColors.of(context);
    final profil = widget.store.session!.profil;
    final initiale = profil.nom.isEmpty ? '?' : profil.nom[0].toUpperCase();
    return ColoredBox(
      color: colors.paper,
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Text(
              'Profil',
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w600,
                color: colors.ink,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 18),
            Center(
              child: CircleAvatar(
                radius: 36,
                backgroundColor: colors.amber,
                child: Text(
                  initiale,
                  style: GoogleFonts.fraunces(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            Text(
              profil.nom,
              textAlign: TextAlign.center,
              style: GoogleFonts.fraunces(
                fontSize: 26,
                fontWeight: FontWeight.w600,
                color: colors.ink,
              ),
            ),
            Text(
              profil.telephone,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(color: colors.muted),
            ),
            const SizedBox(height: 18),
            _Carte(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'APPARENCE',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                      color: colors.label,
                    ),
                  ),
                  const SizedBox(height: 10),
                  SegmentedButton<bool>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: false,
                        label: Text('Clair'),
                        icon: Icon(Icons.light_mode_outlined),
                      ),
                      ButtonSegment(
                        value: true,
                        label: Text('Sombre'),
                        icon: Icon(Icons.dark_mode_outlined),
                      ),
                    ],
                    selected: {widget.themes.dark},
                    onSelectionChanged: (value) => widget.themes.setDark(value.first),
                    style: SegmentedButton.styleFrom(
                      selectedBackgroundColor: colors.amber,
                      selectedForegroundColor: Colors.white,
                      foregroundColor: colors.ink,
                      side: BorderSide(color: colors.line),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            if (_message != null) ...[
              Text(
                _message!,
                style: GoogleFonts.outfit(
                  color: _error ? const Color(0xFF9D342C) : colors.amber,
                ),
              ),
              const SizedBox(height: 10),
            ],
            _Carte(
              child: Column(
                children: [
                  _Champ(controller: _nom, label: 'Nom', icon: Icons.badge_outlined),
                  const SizedBox(height: 12),
                  _Champ(
                    controller: _telephone,
                    label: 'Téléphone',
                    icon: Icons.phone_outlined,
                    type: TextInputType.phone,
                  ),
                  const SizedBox(height: 12),
                  _Champ(
                    controller: _email,
                    label: 'Email',
                    icon: Icons.mail_outline,
                    type: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 12),
                  _Champ(
                    controller: _adresse,
                    label: 'Adresse',
                    icon: Icons.place_outlined,
                  ),
                  const SizedBox(height: 12),
                  _Champ(
                    controller: _motDePasse,
                    label: 'Nouveau mot de passe',
                    icon: Icons.lock_outline,
                    masque: _masque,
                    onMasque: () => setState(() => _masque = !_masque),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 52,
              child: FilledButton(
                onPressed: _busy ? null : _submit,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.amber,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  _busy ? 'Enregistrement…' : 'ENREGISTRER',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, letterSpacing: 0.5),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 52,
              child: OutlinedButton(
                onPressed: widget.store.deconnecter,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF9D342C),
                  side: const BorderSide(color: Color(0xFF9D342C)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  'DÉCONNEXION',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, letterSpacing: 0.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Carte extends StatelessWidget {
  const _Carte({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final colors = DepotColors.of(context);
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.line),
      ),
      child: Padding(padding: const EdgeInsets.all(14), child: child),
    );
  }
}

class _Champ extends StatelessWidget {
  const _Champ({
    required this.controller,
    required this.label,
    required this.icon,
    this.type,
    this.masque = false,
    this.onMasque,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? type;
  final bool masque;
  final VoidCallback? onMasque;

  @override
  Widget build(BuildContext context) {
    final colors = DepotColors.of(context);
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.line),
    );
    return TextField(
      controller: controller,
      keyboardType: type,
      obscureText: masque,
      style: GoogleFonts.outfit(color: colors.ink),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.outfit(color: colors.label),
        prefixIcon: Icon(icon, color: colors.label),
        suffixIcon: onMasque == null
            ? null
            : IconButton(
                onPressed: onMasque,
                icon: Icon(
                  masque ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: colors.label,
                ),
              ),
        filled: true,
        fillColor: colors.field,
        border: border,
        enabledBorder: border,
        focusedBorder: border.copyWith(borderSide: BorderSide(color: colors.amber, width: 1.4)),
      ),
    );
  }
}
