import 'package:flutter/material.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../models/company.dart';

class CompanyCard extends StatelessWidget {
  const CompanyCard({super.key, required this.company, required this.onTap});

  final CompanySummary company;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = Strings.of(context);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadii.medium),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.l),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: AppColors.trust.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppRadii.small),
                ),
                alignment: Alignment.center,
                child: Text(
                  company.name.isNotEmpty ? company.name[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.trust, fontWeight: FontWeight.w700, fontSize: 18),
                ),
              ),
              const SizedBox(width: AppSpacing.l),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(company.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(
                      '${company.category} · ${s.complaintsCount(company.complaintCount)}',
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurface.withValues(alpha: 0.4)),
            ],
          ),
        ),
      ),
    );
  }
}
