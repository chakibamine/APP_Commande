import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';
import 'models.dart';

class ApiException implements Exception {
  ApiException(this.message);
  final String message;

  @override
  String toString() => message;
}

class Api {
  Api({http.Client? client, this.token}) : _client = client ?? http.Client();

  final http.Client _client;
  String? token;

  Future<Session> login(String telephone, String motDePasse) {
    return _auth('/auth/login-client', {
      'telephone': telephone,
      'motDePasse': motDePasse,
    });
  }

  Future<List<Produit>> produits() async {
    final json = await _send('GET', '/produits?limit=100');
    final data = (json as Map<String, dynamic>)['data'] as List<dynamic>;
    return data
        .map((item) => Produit.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<Commande> creerCommande(List<Map<String, Object>> lignes) async {
    final json = await _send(
      'POST',
      '/commandes',
      body: {'lignes': lignes},
    );
    return Commande.fromJson(json as Map<String, dynamic>);
  }

  Future<ListeCommandes> mesCommandes({int page = 1, int limit = 20}) async {
    final json = await _send(
      'GET',
      '/commandes/mes-commandes?page=$page&limit=$limit',
    );
    final map = json as Map<String, dynamic>;
    final meta = map['meta'] as Map<String, dynamic>;
    final data = (map['data'] as List<dynamic>)
        .map((item) => Commande.fromJson(item as Map<String, dynamic>))
        .toList();
    return ListeCommandes(
      data: data,
      page: (meta['page'] as num).toInt(),
      totalPages: (meta['totalPages'] as num).toInt(),
      total: (meta['total'] as num).toInt(),
    );
  }

  Future<Commande> commande(String id) async {
    final json = await _send('GET', '/commandes/$id');
    return Commande.fromJson(json as Map<String, dynamic>);
  }

  Future<ClientProfil> profil() async {
    final json = await _send('GET', '/clients/me');
    return ClientProfil.fromJson(json as Map<String, dynamic>);
  }

  Future<ClientProfil> mettreAJourProfil(Map<String, String> body) async {
    final json = await _send('PATCH', '/clients/me', body: body);
    return ClientProfil.fromJson(json as Map<String, dynamic>);
  }

  Future<Session> _auth(String path, Map<String, String> body) async {
    final json = await _send('POST', path, body: body, authenticated: false);
    return Session.fromJson(json as Map<String, dynamic>);
  }

  Future<Object?> _send(
    String method,
    String path, {
    Object? body,
    bool authenticated = true,
  }) async {
    final request = http.Request(method, Uri.parse('$apiBaseUrl$path'));
    request.headers['Accept'] = 'application/json';
    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }
    if (authenticated && token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    final streamed = await _client.send(request);
    final response = await http.Response.fromStream(streamed);
    final decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw ApiException(_message(decoded));
    }
    return decoded;
  }

  String _message(Object? payload) {
    if (payload is Map && payload['message'] != null) {
      final message = payload['message'];
      if (message is List) return message.join(' ');
      return message.toString();
    }
    return 'La requête a échoué';
  }
}
