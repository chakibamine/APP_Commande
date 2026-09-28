import 'package:flutter_test/flutter_test.dart';
import 'package:petrole_client/api.dart';
import 'package:petrole_client/main.dart';
import 'package:petrole_client/session_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('affiche la connexion', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(PetroleApp(store: SessionStore(Api())));
    await tester.pumpAndSettle();
    expect(find.text('SE CONNECTER'), findsOneWidget);
  });
}
