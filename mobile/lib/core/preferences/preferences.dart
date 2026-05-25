import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum AppThemeMode { system, light, dark }

class AppPreferences {
  AppPreferences({required this.localeCode, required this.themeMode});
  final String localeCode;
  final AppThemeMode themeMode;

  AppPreferences copyWith({String? localeCode, AppThemeMode? themeMode}) =>
      AppPreferences(
        localeCode: localeCode ?? this.localeCode,
        themeMode: themeMode ?? this.themeMode,
      );

  ThemeMode get materialThemeMode => switch (themeMode) {
        AppThemeMode.system => ThemeMode.system,
        AppThemeMode.light  => ThemeMode.light,
        AppThemeMode.dark   => ThemeMode.dark,
      };

  Locale get locale => Locale(localeCode);
}

class PreferencesNotifier extends AsyncNotifier<AppPreferences> {
  static const _localeKey = 'pref.locale';
  static const _themeKey  = 'pref.theme';

  @override
  Future<AppPreferences> build() async {
    final p = await SharedPreferences.getInstance();
    final locale = p.getString(_localeKey) ?? _detectDeviceLocale();
    final themeRaw = p.getString(_themeKey) ?? 'system';
    final theme = AppThemeMode.values.firstWhere(
      (m) => m.name == themeRaw,
      orElse: () => AppThemeMode.system,
    );
    return AppPreferences(localeCode: locale, themeMode: theme);
  }

  Future<void> setLocale(String code) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_localeKey, code);
    state = AsyncData((await future).copyWith(localeCode: code));
  }

  Future<void> setTheme(AppThemeMode mode) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_themeKey, mode.name);
    state = AsyncData((await future).copyWith(themeMode: mode));
  }

  String _detectDeviceLocale() {
    final dev = WidgetsBinding.instance.platformDispatcher.locale.languageCode;
    return const {'mk', 'sq', 'en'}.contains(dev) ? dev : 'en';
  }
}

final preferencesProvider = AsyncNotifierProvider<PreferencesNotifier, AppPreferences>(
  PreferencesNotifier.new,
);
