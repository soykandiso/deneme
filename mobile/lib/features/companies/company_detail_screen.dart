import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/company.dart';
import 'companies_repository.dart';

class CompanyDetailScreen extends ConsumerWidget {
  const CompanyDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(s.complaintDetail)),
      body: FutureBuilder<CompanyDetail>(
        future: ref.read(companiesRepositoryProvider).detail(slug),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || !snap.hasData) {
            return Center(child: Text(s.errorGeneric));
          }
          final c = snap.data!;
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.l),
            children: [
              _Header(company: c),
              const SizedBox(height: AppSpacing.l),
              if (c.description != null && c.description!.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.l),
                    child: Text(c.description!),
                  ),
                ),
              const SizedBox(height: AppSpacing.l),
              ElevatedButton.icon(
                onPressed: () => context.push('/submit?companyId=${c.id}'),
                icon: const Icon(Icons.edit_note),
                label: Text(s.submitComplaint),
              ),
              const SizedBox(height: AppSpacing.l),
              OutlinedButton.icon(
                onPressed: () => context.go('/complaints?companyId=${c.id}'),
                icon: const Icon(Icons.list_alt),
                label: Text(s.browseComplaints),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.company});
  final CompanyDetail company;

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.l),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.trust.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(AppRadii.medium),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    company.name.isNotEmpty ? company.name[0].toUpperCase() : '?',
                    style: const TextStyle(color: AppColors.trust, fontWeight: FontWeight.w700, fontSize: 22),
                  ),
                ),
                const SizedBox(width: AppSpacing.l),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(company.name, style: Theme.of(context).textTheme.titleLarge),
                      Text(company.category, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.l),
            Text(s.complaintsCount(company.complaintCount)),
          ],
        ),
      ),
    );
  }
}
