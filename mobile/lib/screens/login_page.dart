import 'package:flutter/material.dart';
import '../depot_colors.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api.dart';
import '../session_store.dart';


class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.store});

  final SessionStore store;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _telephone = TextEditingController();
  final _motDePasse = TextEditingController();
  String? _error;
  bool _busy = false;
  bool _masque = true;

  @override
  void dispose() {
    _telephone.dispose();
    _motDePasse.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final session = await widget.store.api.login(
        _telephone.text.trim(),
        _motDePasse.text,
      );
      await widget.store.connecter(session);
    } on ApiException catch (error) {
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final title = GoogleFonts.fraunces(
      fontSize: 34,
      fontWeight: FontWeight.w600,
      color: DepotColors.of(context).ink,
      height: 1.05,
    );
    final body = GoogleFonts.outfit(color: DepotColors.of(context).ink, fontSize: 15);

    return Scaffold(
      backgroundColor: DepotColors.of(context).paper,
      body: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: Theme.of(context).brightness == Brightness.dark
                ? const [Color(0xFF0F1623), Color(0xFF1A2740), Color(0xFF3D2C22)]
                : const [Color(0xFFF8F5EF), Color(0xFFF3EFE6), Color(0xFFE7DDD0)],
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
            children: [
              const SizedBox(height: 50),
              const Center(child: _PumpMark()),
              const SizedBox(height: 18),
              Text(
                'BGI Commandes',
                textAlign: TextAlign.center,
                style: title,
              ),
              const SizedBox(height: 70),
              DecoratedBox(
                decoration: BoxDecoration(
                  color: DepotColors.of(context).card,
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x14172033),
                      blurRadius: 28,
                      offset: Offset(0, 14),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 20, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_error != null) ...[
                        _ErrorBanner(message: _error!),
                        const SizedBox(height: 14),
                      ],
                      const _FieldLabel('TÉLÉPHONE'),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _telephone,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        style: body,
                        decoration: _fieldDecoration(
                          hint: '06 12 34 56 78',
                          icon: Icons.phone_outlined,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const _FieldLabel('MOT DE PASSE'),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _motDePasse,
                        obscureText: _masque,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) {
                          if (!_busy) _submit();
                        },
                        style: body,
                        decoration: _fieldDecoration(
                          hint: '••••••••',
                          icon: Icons.lock_outline,
                          suffix: IconButton(
                            onPressed: () => setState(() => _masque = !_masque),
                            icon: Icon(
                              _masque
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                              color: DepotColors.of(context).label,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                      SizedBox(
                        height: 52,
                        child: FilledButton(
                          onPressed: _busy ? null : _submit,
                          style: FilledButton.styleFrom(
                            backgroundColor: DepotColors.of(context).amber,
                            disabledBackgroundColor: DepotColors.of(context).amber.withValues(
                              alpha: 0.6,
                            ),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            textStyle: GoogleFonts.outfit(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            ),
                          ),
                          child: _busy
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2.2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('SE CONNECTER'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 22),
              const SizedBox(height: 16),
              const SizedBox(height: 22),
              Text(
                'Version 1.0.0',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(fontSize: 12, color: DepotColors.of(context).label),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _fieldDecoration({
    required String hint,
    required IconData icon,
    Widget? suffix,
  }) {
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: DepotColors.of(context).line),
    );
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.outfit(color: const Color(0xFFB3A89C)),
      filled: true,
      fillColor: DepotColors.of(context).field,
      prefixIcon: Icon(icon, color: DepotColors.of(context).label),
      suffixIcon: suffix,
      contentPadding: const EdgeInsets.symmetric(vertical: 16),
      border: border,
      enabledBorder: border,
      focusedBorder: border.copyWith(
        borderSide: BorderSide(color: DepotColors.of(context).amber, width: 1.4),
      ),
    );
  }
}

class _PumpMark extends StatelessWidget {
  const _PumpMark();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      decoration: BoxDecoration(
        color: DepotColors.of(context).amber,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Color(0x33D86A1F),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: const Icon(Icons.local_gas_station, color: Colors.white, size: 34),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: GoogleFonts.outfit(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.8,
        color: DepotColors.of(context).label,
      ),
    );
  }
}





class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

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
          style: GoogleFonts.outfit(
            color: const Color(0xFF9D342C),
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}
