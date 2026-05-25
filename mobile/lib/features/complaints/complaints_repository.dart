import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_client.dart';
import '../../shared/models/complaint.dart';

class CreateComplaintRequest {
  CreateComplaintRequest({
    required this.companyId,
    required this.title,
    required this.body,
    required this.category,
    this.contactEmail,
    this.contactPhone,
  });
  final String companyId;
  final String title;
  final String body;
  final String category;
  final String? contactEmail;
  final String? contactPhone;
}

class ComplaintDraft {
  ComplaintDraft({required this.id, required this.draftToken, required this.expiresAt});
  final String id;
  final String draftToken;
  final DateTime expiresAt;
}

class ComplaintsRepository {
  ComplaintsRepository(this._client);
  final ApiClient _client;

  Future<Page<ComplaintSummary>> list({
    String? q,
    String? companyId,
    String? category,
    String? status,
    String sort = 'newest',
    String? cursor,
  }) async {
    final res = await _client.getJson('/complaints', query: {
      if (q != null && q.isNotEmpty) 'q': q,
      if (companyId != null) 'companyId': companyId,
      if (category != null) 'category': category,
      if (status != null) 'status': status,
      'sort': sort,
      if (cursor != null) 'cursor': cursor,
      'limit': 20,
    });
    return Page<ComplaintSummary>(
      items: (res['items'] as List<dynamic>)
          .map((j) => ComplaintSummary.fromJson(j as Map<String, dynamic>))
          .toList(),
      nextCursor: res['nextCursor'] as String?,
    );
  }

  Future<ComplaintDetail> detail(String id) async {
    final res = await _client.getJson('/complaints/$id');
    return ComplaintDetail.fromJson(res);
  }

  Future<ComplaintDraft> createDraft(CreateComplaintRequest req) async {
    final res = await _client.postJson('/complaints', body: {
      'companyId': req.companyId,
      'title': req.title,
      'body': req.body,
      'category': req.category,
      if (req.contactEmail != null) 'contactEmail': req.contactEmail,
      if (req.contactPhone != null) 'contactPhone': req.contactPhone,
    });
    return ComplaintDraft(
      id: res['id'] as String,
      draftToken: res['draftToken'] as String,
      expiresAt: DateTime.parse(res['expiresAt'] as String),
    );
  }

  Future<void> uploadAttachment({
    required String complaintId,
    required String draftToken,
    required String filePath,
    required String filename,
  }) async {
    final form = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: filename),
    });
    await _client.postMultipart(
      '/complaints/$complaintId/attachments',
      formData: form,
      headers: {'X-Draft-Token': draftToken},
    );
  }

  Future<void> publish({required String complaintId, required String draftToken}) async {
    await _client.postJson(
      '/complaints/$complaintId/publish',
      headers: {'X-Draft-Token': draftToken},
    );
  }

  Future<void> report({required String complaintId, required String reason, String? detail}) async {
    await _client.postJson('/complaints/$complaintId/reports', body: {
      'reason': reason,
      if (detail != null && detail.isNotEmpty) 'detail': detail,
    });
  }
}

final complaintsRepositoryProvider = Provider<ComplaintsRepository>(
  (ref) => ComplaintsRepository(ref.watch(apiClientProvider)),
);
