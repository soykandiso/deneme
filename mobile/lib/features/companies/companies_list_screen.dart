import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/company.dart';
import '../../shared/models/complaint.dart';
import '../../shared/widgets/company_card.dart';
import '../../shared/widgets/empty_state.dart';
import 'companies_repository.dart';

class CompaniesListScreen extends ConsumerStatefulWidget {
  const CompaniesListScreen({super.key});

  @override
  ConsumerState<CompaniesListScreen> createState() => _CompaniesListScreenState();
}

class _CompaniesListScreenState extends ConsumerState<CompaniesListScreen> {
  final _scroll = ScrollController();
  final _searchCtl = TextEditingController();

  String _q = '';
  bool _loading = false;
  bool _exhausted = false;
  String? _cursor;
  final List<CompanySummary> _items = [];
  Object? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_maybeLoadMore);
    _fetch(reset: true);
  }

  @override
  void dispose() {
    _scroll.dispose();
    _searchCtl.dispose();
    super.dispose();
  }

  Future<void> _fetch({required bool reset}) async {
    if (_loading) return;
    setState(() {
      _loading = true;
      _error = null;
      if (reset) {
        _items.clear();
        _cursor = null;
        _exhausted = false;
      }
    });
    try {
      final Page<CompanySummary> page =
          await ref.read(companiesRepositoryProvider).list(q: _q, cursor: _cursor);
      setState(() {
        _items.addAll(page.items);
        _cursor = page.nextCursor;
        _exhausted = page.nextCursor == null;
      });
    } catch (e) {
      setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _maybeLoadMore() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 300 &&
        !_loading &&
        !_exhausted) {
      _fetch(reset: false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(s.tabCompanies)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: TextField(
              controller: _searchCtl,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search),
                hintText: s.search,
              ),
              textInputAction: TextInputAction.search,
              onSubmitted: (v) {
                _q = v.trim();
                _fetch(reset: true);
              },
            ),
          ),
          Expanded(child: _buildList()),
        ],
      ),
    );
  }

  Widget _buildList() {
    if (_error != null && _items.isEmpty) {
      return _ErrorRetry(onRetry: () => _fetch(reset: true));
    }
    if (_items.isEmpty && !_loading) {
      return EmptyState(title: Strings.of(context).noResults, icon: Icons.business);
    }
    return RefreshIndicator(
      onRefresh: () => _fetch(reset: true),
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(AppSpacing.l, 0, AppSpacing.l, AppSpacing.xl),
        itemBuilder: (ctx, i) {
          if (i >= _items.length) {
            return const Padding(
              padding: EdgeInsets.all(AppSpacing.l),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final c = _items[i];
          return CompanyCard(
            company: c,
            onTap: () => context.push('/companies/${c.slug}'),
          );
        },
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.m),
        itemCount: _items.length + (_loading && !_exhausted ? 1 : 0),
      ),
    );
  }
}

class _ErrorRetry extends StatelessWidget {
  const _ErrorRetry({required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(s.errorGeneric),
          const SizedBox(height: AppSpacing.m),
          OutlinedButton(onPressed: onRetry, child: Text(s.retry)),
        ],
      ),
    );
  }
}
