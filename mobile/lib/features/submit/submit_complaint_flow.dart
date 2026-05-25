import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/company.dart';
import '../companies/companies_repository.dart';
import '../complaints/complaints_repository.dart';

class SubmitComplaintFlow extends ConsumerStatefulWidget {
  const SubmitComplaintFlow({super.key, this.initialCompanyId});
  final String? initialCompanyId;

  @override
  ConsumerState<SubmitComplaintFlow> createState() => _SubmitComplaintFlowState();
}

class _SubmitComplaintFlowState extends ConsumerState<SubmitComplaintFlow> {
  int _step = 0;

  CompanySummary? _company;
  String _title = '';
  String _body = '';
  String _category = 'OTHER';
  String? _email;
  String? _phone;
  final List<File> _attachments = [];

  bool _submitting = false;

  void _next() => setState(() => _step = (_step + 1).clamp(0, 2));
  void _back() => setState(() => _step = (_step - 1).clamp(0, 2));

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.submitComplaint),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.maybePop(context),
        ),
      ),
      body: Column(
        children: [
          _StepIndicator(step: _step, labels: [s.step1Company, s.step2Describe, s.step3Review]),
          Expanded(child: _bodyForStep()),
          _footer(),
        ],
      ),
    );
  }

  Widget _bodyForStep() {
    switch (_step) {
      case 0: return _StepCompany(initial: _company, onPick: (c) => setState(() => _company = c), initialCompanyId: widget.initialCompanyId);
      case 1: return _StepDescribe(
        title: _title, body: _body, category: _category, email: _email, phone: _phone,
        onChanged: ({String? title, String? body, String? category, String? email, String? phone}) {
          setState(() {
            if (title != null) _title = title;
            if (body != null) _body = body;
            if (category != null) _category = category;
            if (email != null) _email = email.isEmpty ? null : email;
            if (phone != null) _phone = phone.isEmpty ? null : phone;
          });
        },
      );
      case 2: return _StepReview(
        company: _company,
        title: _title,
        body: _body,
        category: _category,
        attachments: _attachments,
        onAddAttachment: () async {
          final res = await FilePicker.platform.pickFiles(
            type: FileType.custom,
            allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf'],
            allowMultiple: false,
          );
          final path = res?.files.single.path;
          if (path != null && _attachments.length < 5) {
            setState(() => _attachments.add(File(path)));
          }
        },
        onRemoveAttachment: (i) => setState(() => _attachments.removeAt(i)),
      );
      default: return const SizedBox.shrink();
    }
  }

  bool _canAdvance() {
    if (_step == 0) return _company != null;
    if (_step == 1) return _title.trim().length >= 8 && _body.trim().length >= 30;
    return true;
  }

  Widget _footer() {
    final s = Strings.of(context);
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.l),
        child: Row(
          children: [
            if (_step > 0)
              Expanded(
                child: OutlinedButton(onPressed: _submitting ? null : _back, child: Text(s.cancel)),
              ),
            if (_step > 0) const SizedBox(width: AppSpacing.m),
            Expanded(
              child: ElevatedButton(
                onPressed: _submitting || !_canAdvance()
                    ? null
                    : (_step < 2 ? _next : _submit),
                child: _submitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_step < 2 ? s.submit : s.publish),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final repo = ref.read(complaintsRepositoryProvider);
      final draft = await repo.createDraft(CreateComplaintRequest(
        companyId: _company!.id,
        title: _title.trim(),
        body: _body.trim(),
        category: _category,
        contactEmail: _email,
        contactPhone: _phone,
      ));
      for (final f in _attachments) {
        await repo.uploadAttachment(
          complaintId: draft.id,
          draftToken: draft.draftToken,
          filePath: f.path,
          filename: f.path.split(Platform.pathSeparator).last,
        );
      }
      await repo.publish(complaintId: draft.id, draftToken: draft.draftToken);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(Strings.of(context).submit)),
        );
        if (mounted) context.go('/complaints/${draft.id}');
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(Strings.of(context).errorGeneric)),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.step, required this.labels});
  final int step;
  final List<String> labels;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(AppSpacing.l, AppSpacing.s, AppSpacing.l, AppSpacing.l),
      child: Row(
        children: List.generate(labels.length, (i) {
          final active = i <= step;
          return Expanded(
            child: Container(
              margin: EdgeInsets.only(right: i == labels.length - 1 ? 0 : 6),
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: active ? AppColors.trust : AppColors.divider,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Center(
                child: Text(
                  '${i + 1}. ${labels[i]}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: active ? Colors.white : AppColors.muted,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _StepCompany extends ConsumerStatefulWidget {
  const _StepCompany({required this.initial, required this.onPick, this.initialCompanyId});
  final CompanySummary? initial;
  final ValueChanged<CompanySummary> onPick;
  final String? initialCompanyId;

  @override
  ConsumerState<_StepCompany> createState() => _StepCompanyState();
}

class _StepCompanyState extends ConsumerState<_StepCompany> {
  final _searchCtl = TextEditingController();
  String _q = '';
  late Future<List<CompanySummary>> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<List<CompanySummary>> _load() async {
    final page = await ref.read(companiesRepositoryProvider).list(q: _q);
    return page.items;
  }

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.l, 0, AppSpacing.l, AppSpacing.l),
          child: TextField(
            controller: _searchCtl,
            decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: s.search),
            onSubmitted: (v) {
              _q = v.trim();
              setState(() => _future = _load());
            },
          ),
        ),
        Expanded(
          child: FutureBuilder<List<CompanySummary>>(
            future: _future,
            builder: (ctx, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              final items = snap.data ?? const [];
              if (items.isEmpty) return Center(child: Text(s.noResults));
              return ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.l),
                itemBuilder: (_, i) {
                  final c = items[i];
                  final selected = widget.initial?.id == c.id;
                  return Card(
                    child: ListTile(
                      title: Text(c.name),
                      subtitle: Text(c.category),
                      trailing: selected ? const Icon(Icons.check_circle, color: AppColors.trust) : null,
                      onTap: () => widget.onPick(c),
                    ),
                  );
                },
                separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s),
                itemCount: items.length,
              );
            },
          ),
        ),
      ],
    );
  }
}

class _StepDescribe extends StatelessWidget {
  const _StepDescribe({
    required this.title, required this.body, required this.category, this.email, this.phone, required this.onChanged,
  });
  final String title;
  final String body;
  final String category;
  final String? email;
  final String? phone;
  final void Function({String? title, String? body, String? category, String? email, String? phone}) onChanged;

  static const _categories = [
    'QUALITY','BILLING','DELIVERY','SUPPORT','ACCOUNT','WARRANTY','MISLEADING','OTHER',
  ];

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.l),
      children: [
        TextField(
          controller: TextEditingController(text: title)..selection = TextSelection.collapsed(offset: title.length),
          decoration: InputDecoration(labelText: s.title),
          onChanged: (v) => onChanged(title: v),
          maxLength: 160,
        ),
        const SizedBox(height: AppSpacing.m),
        TextField(
          controller: TextEditingController(text: body)..selection = TextSelection.collapsed(offset: body.length),
          decoration: InputDecoration(labelText: s.body),
          onChanged: (v) => onChanged(body: v),
          maxLength: 8000,
          maxLines: 6,
        ),
        const SizedBox(height: AppSpacing.m),
        Text(s.category, style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: AppSpacing.s),
        Wrap(
          spacing: 6,
          children: _categories.map((c) => ChoiceChip(
            label: Text(c),
            selected: category == c,
            onSelected: (_) => onChanged(category: c),
          )).toList(),
        ),
        const SizedBox(height: AppSpacing.l),
        TextField(
          controller: TextEditingController(text: email ?? ''),
          decoration: InputDecoration(labelText: s.contactEmailOptional),
          keyboardType: TextInputType.emailAddress,
          onChanged: (v) => onChanged(email: v),
        ),
        const SizedBox(height: AppSpacing.m),
        TextField(
          controller: TextEditingController(text: phone ?? ''),
          decoration: InputDecoration(labelText: s.contactPhoneOptional),
          keyboardType: TextInputType.phone,
          onChanged: (v) => onChanged(phone: v),
        ),
      ],
    );
  }
}

class _StepReview extends StatelessWidget {
  const _StepReview({
    required this.company,
    required this.title,
    required this.body,
    required this.category,
    required this.attachments,
    required this.onAddAttachment,
    required this.onRemoveAttachment,
  });
  final CompanySummary? company;
  final String title;
  final String body;
  final String category;
  final List<File> attachments;
  final VoidCallback onAddAttachment;
  final ValueChanged<int> onRemoveAttachment;

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.l),
      children: [
        Card(
          child: ListTile(
            title: Text(company?.name ?? '-'),
            subtitle: Text(category),
          ),
        ),
        const SizedBox(height: AppSpacing.m),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: AppSpacing.s),
                Text(body),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.l),
        Text(s.evidence, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: AppSpacing.s),
        Text(s.attachmentsHint, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: AppSpacing.s),
        ...attachments.asMap().entries.map((e) => Card(
          child: ListTile(
            leading: const Icon(Icons.attach_file),
            title: Text(e.value.path.split(Platform.pathSeparator).last),
            trailing: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () => onRemoveAttachment(e.key),
            ),
          ),
        )),
        if (attachments.length < 5)
          OutlinedButton.icon(
            onPressed: onAddAttachment,
            icon: const Icon(Icons.add_photo_alternate_outlined),
            label: Text(s.addAttachment),
          ),
        const SizedBox(height: AppSpacing.l),
        Card(
          color: AppColors.trust.withValues(alpha: 0.06),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: Text(s.publishConfirm),
          ),
        ),
      ],
    );
  }
}
