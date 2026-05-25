import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../shared/models/company.dart';
import '../../shared/models/complaint.dart';

class CompaniesRepository {
  CompaniesRepository(this._client);
  final ApiClient _client;

  Future<Page<CompanySummary>> list({String? q, String? category, String? cursor}) async {
    final res = await _client.getJson('/companies', query: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (category != null && category.isNotEmpty) 'category': category,
      if (cursor != null) 'cursor': cursor,
      'limit': 20,
    });
    return Page<CompanySummary>(
      items: (res['items'] as List<dynamic>)
          .map((j) => CompanySummary.fromJson(j as Map<String, dynamic>))
          .toList(),
      nextCursor: res['nextCursor'] as String?,
    );
  }

  Future<CompanyDetail> detail(String slug) async {
    final res = await _client.getJson('/companies/$slug');
    return CompanyDetail.fromJson(res);
  }
}

final companiesRepositoryProvider = Provider<CompaniesRepository>(
  (ref) => CompaniesRepository(ref.watch(apiClientProvider)),
);
