import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/complaint.dart';
import '../../shared/widgets/status_badge.dart';
import 'complaints_repository.dart';

class ComplaintDetailScreen extends ConsumerWidget {
  const ComplaintDetailScreen({super.key, required this.id});
  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.complaintDetail),
        actions: [
          Builder(
            builder: (ctx) => IconButton(
              onPressed: () => _showReportSheet(ctx, ref),
              icon: const Icon(Icons.flag_outlined),
              tooltip: s.report,
            ),
          ),
        ],
      ),
      body: FutureBuilder<ComplaintDetail>(
        future: ref.read(complaintsRepositoryProvider).detail(id),
        builder: (ctx, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snap.hasError || !snap.hasData) {
            return Center(child: Text(s.errorGeneric));
          }
          final c = snap.data!;
          final df = DateFormat.yMMMd(Localizations.localeOf(context).languageCode).add_Hm();
          final theme = Theme.of(context);
          return ListView(
            padding: const EdgeInsets.all(AppSpacing.l),
            children: [
              Row(
                children: [
                  StatusBadge(status: c.status),
                  const SizedBox(width: AppSpacing.s),
                  Text(c.category, style: theme.textTheme.labelSmall),
                  const Spacer(),
                  Text(df.format(c.createdAt), style: theme.textTheme.bodySmall),
                ],
              ),
              const SizedBox(height: AppSpacing.m),
              Text(c.title, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
              const SizedBox(height: AppSpacing.s),
              Text('${s.tabCompanies}: ${c.companyName}',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
              const SizedBox(height: AppSpacing.l),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.l),
                  child: Text(c.body),
                ),
              ),
              const SizedBox(height: AppSpacing.l),
              if (c.attachments.isNotEmpty) ...[
                Text(s.evidence, style: theme.textTheme.titleMedium),
                const SizedBox(height: AppSpacing.s),
                ...c.attachments.map((a) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.attach_file),
                    title: Text(a.filename),
                    subtitle: Text(a.contentType),
                  ),
                )),
                const SizedBox(height: AppSpacing.l),
              ],
              Text(s.companyReply, style: theme.textTheme.titleMedium),
              const SizedBox(height: AppSpacing.s),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.l),
                  child: Text(
                    c.companyReply ?? s.noCompanyReply,
                    style: c.companyReply == null
                        ? theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6), fontStyle: FontStyle.italic)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.l),
              Text(s.timeline, style: theme.textTheme.titleMedium),
              const SizedBox(height: AppSpacing.s),
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.s),
                  child: Column(
                    children: c.timeline.map((t) => ListTile(
                      dense: true,
                      leading: Icon(_timelineIcon(t.actor), size: 18),
                      title: Text(t.note, style: const TextStyle(fontFamily: 'monospace')),
                      subtitle: Text(df.format(t.createdAt)),
                    )).toList(),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  IconData _timelineIcon(String actor) {
    switch (actor) {
      case 'company': return Icons.business;
      case 'admin':   return Icons.shield_outlined;
      case 'public':  return Icons.person_outline;
      default:        return Icons.history;
    }
  }

  void _showReportSheet(BuildContext context, WidgetRef ref) {
    final s = Strings.of(context);
    String reason = 'spam';
    final detailCtl = TextEditingController();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.l, AppSpacing.l, AppSpacing.l,
          MediaQuery.viewInsetsOf(ctx).bottom + AppSpacing.l,
        ),
        child: StatefulBuilder(
          builder: (ctx, setSt) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(s.reportComplaint, style: Theme.of(ctx).textTheme.titleLarge),
              const SizedBox(height: AppSpacing.l),
              Text(s.reportReason),
              const SizedBox(height: AppSpacing.s),
              Wrap(
                spacing: 6,
                children: const ['spam','abuse','hate','duplicate','private_info','misleading','other']
                    .map((r) => ChoiceChip(
                          label: Text(r),
                          selected: reason == r,
                          onSelected: (_) => setSt(() => reason = r),
                        ))
                    .toList(),
              ),
              const SizedBox(height: AppSpacing.l),
              TextField(
                controller: detailCtl,
                maxLines: 3,
                maxLength: 500,
                decoration: InputDecoration(labelText: s.reportDetail),
              ),
              const SizedBox(height: AppSpacing.m),
              ElevatedButton(
                onPressed: () async {
                  try {
                    await ref.read(complaintsRepositoryProvider).report(
                          complaintId: id,
                          reason: reason,
                          detail: detailCtl.text.trim(),
                        );
                    if (ctx.mounted) Navigator.pop(ctx);
                  } catch (_) {
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(s.errorGeneric)));
                    }
                  }
                },
                child: Text(s.submit),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
