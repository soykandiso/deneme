import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(s.appTitle)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.l),
        children: [
          _Hero(title: s.homeHero, subtitle: s.homeSubtitle),
          const SizedBox(height: AppSpacing.l),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/submit'),
                  icon: const Icon(Icons.edit_note),
                  label: Text(s.submitComplaint),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.m),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => context.push('/suggest'),
                  icon: const Icon(Icons.add_business_outlined),
                  label: Text(s.suggestCompany),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          _SectionLink(
            icon: Icons.business,
            title: s.browseCompanies,
            onTap: () => context.go('/companies'),
          ),
          const SizedBox(height: AppSpacing.s),
          _SectionLink(
            icon: Icons.list_alt,
            title: s.browseComplaints,
            onTap: () => context.go('/complaints'),
          ),
          const SizedBox(height: AppSpacing.xxl),
          Text(s.aboutBody, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6))),
        ],
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.trust, AppColors.trustDark],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppRadii.large),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22, height: 1.2),
          ),
          const SizedBox(height: AppSpacing.s),
          Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 14)),
        ],
      ),
    );
  }
}

class _SectionLink extends StatelessWidget {
  const _SectionLink({required this.icon, required this.title, required this.onTap});
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
