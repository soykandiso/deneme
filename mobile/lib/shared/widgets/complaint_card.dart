import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_theme.dart';
import '../models/complaint.dart';
import 'status_badge.dart';

class ComplaintCard extends StatelessWidget {
  const ComplaintCard({super.key, required this.complaint, required this.onTap});

  final ComplaintSummary complaint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final df = DateFormat.yMMMd(Localizations.localeOf(context).languageCode);
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadii.medium),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.l),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  StatusBadge(status: complaint.status),
                  const SizedBox(width: AppSpacing.s),
                  Text(
                    complaint.category,
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                  ),
                  const Spacer(),
                  Text(
                    df.format(complaint.createdAt),
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s),
              Text(
                complaint.title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: AppSpacing.s),
              Row(
                children: [
                  Icon(Icons.business_outlined, size: 14, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      complaint.companyName,
                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (complaint.attachmentCount > 0) ...[
                    const SizedBox(width: AppSpacing.s),
                    Icon(Icons.attach_file, size: 14, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                    Text(' ${complaint.attachmentCount}', style: theme.textTheme.bodySmall),
                  ],
                  if (complaint.hasReply) ...[
                    const SizedBox(width: AppSpacing.s),
                    Icon(Icons.reply, size: 14, color: AppColors.good),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
