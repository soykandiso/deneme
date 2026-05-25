import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/localization/strings.dart';
import 'core/preferences/preferences.dart';
import 'core/theme/app_theme.dart';
import 'features/companies/companies_list_screen.dart';
import 'features/companies/company_detail_screen.dart';
import 'features/complaints/complaint_detail_screen.dart';
import 'features/complaints/complaints_list_screen.dart';
import 'features/home/home_screen.dart';
import 'features/me/me_screen.dart';
import 'features/submit/submit_complaint_flow.dart';
import 'features/suggest/suggest_company_screen.dart';

class ZalbaApp extends ConsumerWidget {
  const ZalbaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(preferencesProvider);
    final router = _buildRouter();
    return MaterialApp.router(
      title: 'Zalba',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: prefs.maybeWhen(data: (p) => p.materialThemeMode, orElse: () => ThemeMode.system),
      locale: prefs.maybeWhen(data: (p) => p.locale, orElse: () => null),
      supportedLocales: Strings.supportedLocales,
      localizationsDelegates: const [
        Strings.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      routerConfig: router,
    );
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/home',
      routes: [
        StatefulShellRoute.indexedStack(
          builder: (ctx, state, shell) => _RootShell(shell: shell),
          branches: [
            StatefulShellBranch(routes: [
              GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/companies',
                builder: (_, __) => const CompaniesListScreen(),
                routes: [
                  GoRoute(
                    path: ':slug',
                    builder: (_, st) => CompanyDetailScreen(slug: st.pathParameters['slug']!),
                  ),
                ],
              ),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(
                path: '/complaints',
                builder: (_, st) => ComplaintsListScreen(
                  companyId: st.uri.queryParameters['companyId'],
                ),
                routes: [
                  GoRoute(
                    path: ':id',
                    builder: (_, st) => ComplaintDetailScreen(id: st.pathParameters['id']!),
                  ),
                ],
              ),
            ]),
            StatefulShellBranch(routes: [
              GoRoute(path: '/me', builder: (_, __) => const MeScreen()),
            ]),
          ],
        ),
        GoRoute(
          path: '/submit',
          builder: (_, st) => SubmitComplaintFlow(
            initialCompanyId: st.uri.queryParameters['companyId'],
          ),
        ),
        GoRoute(path: '/suggest', builder: (_, __) => const SuggestCompanyScreen()),
      ],
    );
  }
}

class _RootShell extends StatelessWidget {
  const _RootShell({required this.shell});
  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Scaffold(
      body: shell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: shell.currentIndex,
        onTap: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        items: [
          BottomNavigationBarItem(icon: const Icon(Icons.home_outlined), activeIcon: const Icon(Icons.home), label: s.tabHome),
          BottomNavigationBarItem(icon: const Icon(Icons.business_outlined), activeIcon: const Icon(Icons.business), label: s.tabCompanies),
          BottomNavigationBarItem(icon: const Icon(Icons.list_alt_outlined), activeIcon: const Icon(Icons.list_alt), label: s.tabComplaints),
          BottomNavigationBarItem(icon: const Icon(Icons.person_outline), activeIcon: const Icon(Icons.person), label: s.tabMe),
        ],
      ),
      floatingActionButton: shell.currentIndex == 3
          ? null
          : FloatingActionButton.extended(
              onPressed: () => GoRouter.of(context).push('/submit'),
              icon: const Icon(Icons.edit_note),
              label: Text(s.submitComplaint),
            ),
    );
  }
}
