import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:zalba_mobile/core/localization/strings.dart';

void main() {
  test('falls back to English for missing keys', () {
    final mk = Strings(const Locale('mk'));
    expect(mk.appTitle, 'Жалба');
    expect(mk.tabHome, 'Почетна');
  });

  test('pluralizes complaint counts', () {
    final en = Strings(const Locale('en'));
    expect(en.complaintsCount(0), 'No complaints');
    expect(en.complaintsCount(1), '1 complaint');
    expect(en.complaintsCount(5), '5 complaints');
  });

  test('returns English for unknown locale', () {
    final unknown = Strings(const Locale('fr'));
    expect(unknown.tabHome, 'Home');
  });
}
