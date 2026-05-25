import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/localization/strings.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_theme.dart';

class SuggestCompanyScreen extends ConsumerStatefulWidget {
  const SuggestCompanyScreen({super.key});

  @override
  ConsumerState<SuggestCompanyScreen> createState() => _SuggestCompanyScreenState();
}

class _SuggestCompanyScreenState extends ConsumerState<SuggestCompanyScreen> {
  final _name = TextEditingController();
  final _website = TextEditingController();
  final _category = TextEditingController();
  final _note = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _website.dispose();
    _category.dispose();
    _note.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().length < 2) return;
    setState(() => _busy = true);
    try {
      await ref.read(apiClientProvider).postJson('/suggestions', body: {
        'name': _name.text.trim(),
        if (_website.text.trim().isNotEmpty) 'website': _website.text.trim(),
        if (_category.text.trim().isNotEmpty) 'category': _category.text.trim(),
        if (_note.text.trim().isNotEmpty) 'note': _note.text.trim(),
      });
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(Strings.of(context).errorGeneric)),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(s.suggestCompany)),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.l),
        children: [
          TextField(controller: _name, decoration: InputDecoration(labelText: s.tabCompanies)),
          const SizedBox(height: AppSpacing.m),
          TextField(controller: _website, decoration: const InputDecoration(labelText: 'Website')),
          const SizedBox(height: AppSpacing.m),
          TextField(controller: _category, decoration: InputDecoration(labelText: s.category)),
          const SizedBox(height: AppSpacing.m),
          TextField(controller: _note, decoration: const InputDecoration(labelText: 'Note'), maxLines: 4, maxLength: 500),
          const SizedBox(height: AppSpacing.l),
          ElevatedButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(s.submit),
          ),
        ],
      ),
    );
  }
}
