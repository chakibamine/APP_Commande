import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api.dart';
import 'models.dart';

class SessionStore extends ChangeNotifier {
  SessionStore(this.api);

  static const _key = 'petrole.session';

  final Api api;
  Session? session;
  bool ready = false;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw != null) {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      session = Session(
        accessToken: json['accessToken'] as String,
        profil: ClientProfil.fromJson(json['profil'] as Map<String, dynamic>),
      );
      api.token = session!.accessToken;
    }
    ready = true;
    notifyListeners();
  }

  Future<void> connecter(Session next) async {
    session = next;
    api.token = next.accessToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _key,
      jsonEncode({
        'accessToken': next.accessToken,
        'profil': {
          'id': next.profil.id,
          'nom': next.profil.nom,
          'telephone': next.profil.telephone,
          'email': next.profil.email,
          'adresse': next.profil.adresse,
        },
      }),
    );
    notifyListeners();
  }

  Future<void> mettreAJourProfil(ClientProfil profil) async {
    if (session == null) return;
    await connecter(Session(accessToken: session!.accessToken, profil: profil));
  }

  Future<void> deconnecter() async {
    session = null;
    api.token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
    notifyListeners();
  }
}
