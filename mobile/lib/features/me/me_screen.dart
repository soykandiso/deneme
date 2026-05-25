import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/localization/strings.dart';
import '../../core/preferences/preferences.dart';
import '../../core/theme/app_theme.dart';

class MeScreen extends ConsumerWidget {
  const MeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    final prefsAsync = ref.watch(preferencesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(s.tabMe)),
      body: prefsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(child: Text(s.errorGeneric)),
        data: (prefs) => ListView(
          padding: const EdgeInsets.all(AppSpacing.l),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.s),
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.language),
                      title: Text(s.language),
                      subtitle: Text(_languageLabel(prefs.localeCode, s)),
                      onTap: () => _openLanguageSheet(context, ref),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.brightness_6_outlined),
                      title: Text(s.theme),
                      subtitle: Text(_themeLabel(prefs.themeMode, s)),
                      onTap: () => _openThemeSheet(context, ref),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.l),
            Card(
              child: ListTile(
                leading: const Icon(Icons.open_in_browser),
                title: Text(s.openCompanyPortal),
                onTap: () => launchUrl(Uri.parse(_portalUrl()), mode: LaunchMode.externalApplication),
              ),
            ),
            const SizedBox(height: AppSpacing.l),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.l),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s.about, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: AppSpacing.s),
                    Text(s.aboutBody),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _languageLabel(String code, Strings s) {
    switch (code) {
      case 'mk': return s.languageMacedonian;
      case 'sq': return s.languageAlbanian;
      default:   return s.languageEnglish;
    }
  }

  String _themeLabel(AppThemeMode m, Strings s) {
    switch (m) {
      case AppThemeMode.light: return s.themeLight;
      case AppThemeMode.dark:  return s.themeDark;
      default:                 return s.themeSystem;
    }
  }

  String _portalUrl() {
    const base = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');
    return '$base/portal/login';
  }

  void _openLanguageSheet(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final entry in [
              ('mk', s.languageMacedonian),
              ('sq', s.languageAlbanian),
              ('en', s.languageEnglish),
            ])
              ListTile(
                title: Text(entry.$2),
                onTap: () async {
                  await ref.read(preferencesProvider.notifier).setLocale(entry.$1);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _openThemeSheet(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final entry in [
              (AppThemeMode.system, s.themeSystem),
              (AppThemeMode.light,  s.themeLight),
              (AppThemeMode.dark,   s.themeDark),
            ])
              ListTile(
                title: Text(entry.$2),
                onTap: () async {
                  await ref.read(preferencesProvider.notifier).setTheme(entry.$1);
                  if (ctx.mounted) Navigator.pop(ctx);
                },
              ),
          ],
        ),
      ),
    );
  }
}
