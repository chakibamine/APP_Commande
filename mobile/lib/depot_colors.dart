import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends ChangeNotifier {
  ThemeMode mode = ThemeMode.light;

  bool get dark => mode == ThemeMode.dark;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    mode = prefs.getString(_key) == 'dark' ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  Future<void> setDark(bool value) async {
    mode = value ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, value ? 'dark' : 'light');
  }

  static const _key = 'petrole.theme';
}

class DepotColors extends ThemeExtension<DepotColors> {
  const DepotColors({
    required this.paper,
    required this.card,
    required this.ink,
    required this.amber,
    required this.muted,
    required this.label,
    required this.line,
    required this.field,
    required this.note,
    required this.noteBorder,
  });

  final Color paper;
  final Color card;
  final Color ink;
  final Color amber;
  final Color muted;
  final Color label;
  final Color line;
  final Color field;
  final Color note;
  final Color noteBorder;

  static const light = DepotColors(
    paper: Color(0xFFF3EFE6),
    card: Color(0xFFFFFFFF),
    ink: Color(0xFF172033),
    amber: Color(0xFFD86A1F),
    muted: Color(0xFF6E655B),
    label: Color(0xFF8A8178),
    line: Color(0xFFE4DAC8),
    field: Color(0xFFF6F3EE),
    note: Color(0xFFFFF6EA),
    noteBorder: Color(0xFFF0D7B0),
  );

  static const dark = DepotColors(
    paper: Color(0xFF0F1623),
    card: Color(0xFF1B2433),
    ink: Color(0xFFF7F4EE),
    amber: Color(0xFFE5921A),
    muted: Color(0xFFC4BDB2),
    label: Color(0xFF9C948A),
    line: Color(0xFF2E3A4C),
    field: Color(0xFF243044),
    note: Color(0xFF2A241C),
    noteBorder: Color(0xFF6B5340),
  );

  static DepotColors of(BuildContext context) {
    return Theme.of(context).extension<DepotColors>() ?? light;
  }

  @override
  DepotColors copyWith({
    Color? paper,
    Color? card,
    Color? ink,
    Color? amber,
    Color? muted,
    Color? label,
    Color? line,
    Color? field,
    Color? note,
    Color? noteBorder,
  }) {
    return DepotColors(
      paper: paper ?? this.paper,
      card: card ?? this.card,
      ink: ink ?? this.ink,
      amber: amber ?? this.amber,
      muted: muted ?? this.muted,
      label: label ?? this.label,
      line: line ?? this.line,
      field: field ?? this.field,
      note: note ?? this.note,
      noteBorder: noteBorder ?? this.noteBorder,
    );
  }

  @override
  DepotColors lerp(DepotColors? other, double t) {
    if (other == null) return this;
    return DepotColors(
      paper: Color.lerp(paper, other.paper, t) ?? paper,
      card: Color.lerp(card, other.card, t) ?? card,
      ink: Color.lerp(ink, other.ink, t) ?? ink,
      amber: Color.lerp(amber, other.amber, t) ?? amber,
      muted: Color.lerp(muted, other.muted, t) ?? muted,
      label: Color.lerp(label, other.label, t) ?? label,
      line: Color.lerp(line, other.line, t) ?? line,
      field: Color.lerp(field, other.field, t) ?? field,
      note: Color.lerp(note, other.note, t) ?? note,
      noteBorder: Color.lerp(noteBorder, other.noteBorder, t) ?? noteBorder,
    );
  }
}

ThemeData depotTheme(DepotColors colors, Brightness brightness) {
  return ThemeData(
    useMaterial3: true,
    brightness: brightness,
    scaffoldBackgroundColor: colors.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: colors.amber,
      brightness: brightness,
    ),
    extensions: [colors],
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderSide: BorderSide(color: colors.line)),
    ),
  );
}
