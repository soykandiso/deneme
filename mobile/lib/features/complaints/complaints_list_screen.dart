import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/localization/strings.dart';
import '../../core/theme/app_theme.dart';
import '../../shared/models/complaint.dart';
import '../../shared/widgets/complaint_card.dart';
import '../../shared/widgets/empty_state.dart';
import 'complaints_repository.dart';

class ComplaintsListScreen extends ConsumerStatefulWidget {
  const ComplaintsListScreen({super.key, this.companyId});
  final String? companyId;

  @override
  ConsumerState<ComplaintsListScreen> createState() => _ComplaintsListScreenState();
}

class _ComplaintsListScreenState extends ConsumerState<ComplaintsListScreen> {
  final _scroll = ScrollController();
  final _searchCtl = TextEditingController();

  String _q = '';
  String? _category;
  String? _status;
  String _sort = 'newest';

  bool _loading = false;
  bool _exhausted = false;
  String? _cursor;
  final List<ComplaintSummary> _items = [];
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
      final page = await ref.read(complaintsRepositoryProvider).list(
            q: _q,
            companyId: widget.companyId,
            category: _category,
            status: _status,
            sort: _sort,
            cursor: _cursor,
          );
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

  void _openFilters() {
    final s = Strings.of(context);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        String? category = _category;
        String? status = _status;
        String sort = _sort;
        return StatefulBuilder(
          builder: (ctx, setSt) => Padding(
            padding: EdgeInsets.fromLTRB(
              AppSpacing.l, AppSpacing.l, AppSpacing.l,
              MediaQuery.viewInsetsOf(ctx).bottom + AppSpacing.l,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s.filters, style: Theme.of(ctx).textTheme.titleLarge),
                const SizedBox(height: AppSpacing.l),
                Text(s.category),
                const SizedBox(height: AppSpacing.s),
                Wrap(spacing: 6, children: [
                  _chip(s.all, category == null, () => setSt(() => category = null)),
                  for (final c in const ['QUALITY','BILLING','DELIVERY','SUPPORT','ACCOUNT','WARRANTY','MISLEADING','OTHER'])
                    _chip(c, category == c, () => setSt(() => category = c)),
                ]),
                const SizedBox(height: AppSpacing.l),
                Text(s.status),
                const SizedBox(height: AppSpacing.s),
                Wrap(spacing: 6, children: [
                  _chip(s.all, status == null, () => setSt(() => status = null)),
                  for (final st in const ['NEW','CONTACTED','RESOLVED'])
                    _chip(st, status == st, () => setSt(() => status = st)),
                ]),
                const SizedBox(height: AppSpacing.l),
                Text(s.sort),
                const SizedBox(height: AppSpacing.s),
                Wrap(spacing: 6, children: [
                  _chip(s.sortNewest, sort == 'newest', () => setSt(() => sort = 'newest')),
                  _chip(s.sortOldest, sort == 'oldest', () => setSt(() => sort = 'oldest')),
                  _chip(s.sortUpdated, sort == 'updated', () => setSt(() => sort = 'updated')),
                  _chip(s.sortReported, sort == 'reported', () => setSt(() => sort = 'reported')),
                ]),
                const SizedBox(height: AppSpacing.l),
                Row(
                  children: [
                    Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(ctx), child: Text(s.cancel))),
                    const SizedBox(width: AppSpacing.m),
                    Expanded(child: ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _category = category;
                          _status = status;
                          _sort = sort;
                        });
                        Navigator.pop(ctx);
                        _fetch(reset: true);
                      },
                      child: Text(s.submit),
                    )),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) {
    return ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap());
  }

  @override
  Widget build(BuildContext context) {
    final s = Strings.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(s.tabComplaints),
        actions: [
          IconButton(onPressed: _openFilters, icon: const Icon(Icons.tune), tooltip: s.filters),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(AppSpacing.l),
            child: TextField(
              controller: _searchCtl,
              decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: s.search),
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
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(Strings.of(context).errorGeneric),
            const SizedBox(height: AppSpacing.m),
            OutlinedButton(onPressed: () => _fetch(reset: true), child: Text(Strings.of(context).retry)),
          ],
        ),
      );
    }
    if (_items.isEmpty && !_loading) {
      return EmptyState(title: Strings.of(context).noResults, icon: Icons.search_off);
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
          return ComplaintCard(complaint: c, onTap: () => context.push('/complaints/${c.id}'));
        },
        separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.m),
        itemCount: _items.length + (_loading && !_exhausted ? 1 : 0),
      ),
    );
  }
}
