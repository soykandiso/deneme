enum ComplaintStatus { newStatus, contacted, resolved, removed }

ComplaintStatus complaintStatusFrom(String raw) {
  switch (raw) {
    case 'NEW':       return ComplaintStatus.newStatus;
    case 'CONTACTED': return ComplaintStatus.contacted;
    case 'RESOLVED':  return ComplaintStatus.resolved;
    case 'REMOVED':   return ComplaintStatus.removed;
    default:          return ComplaintStatus.newStatus;
  }
}

class ComplaintSummary {
  ComplaintSummary({
    required this.id,
    required this.title,
    required this.category,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.hasReply,
    required this.attachmentCount,
    required this.companyId,
    required this.companySlug,
    required this.companyName,
  });

  factory ComplaintSummary.fromJson(Map<String, dynamic> json) {
    final co = json['company'] as Map<String, dynamic>;
    return ComplaintSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      status: complaintStatusFrom(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      hasReply: json['hasReply'] as bool? ?? false,
      attachmentCount: (json['attachmentCount'] as num?)?.toInt() ?? 0,
      companyId: co['id'] as String,
      companySlug: co['slug'] as String,
      companyName: co['name'] as String,
    );
  }

  final String id;
  final String title;
  final String category;
  final ComplaintStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool hasReply;
  final int attachmentCount;
  final String companyId;
  final String companySlug;
  final String companyName;
}

class ComplaintTimelineEntry {
  ComplaintTimelineEntry({required this.id, required this.actor, required this.note, required this.createdAt});

  factory ComplaintTimelineEntry.fromJson(Map<String, dynamic> json) => ComplaintTimelineEntry(
        id: json['id'] as String,
        actor: json['actor'] as String,
        note: json['note'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  final String id;
  final String actor;
  final String note;
  final DateTime createdAt;
}

class ComplaintAttachmentInfo {
  ComplaintAttachmentInfo({required this.id, required this.contentType, required this.filename, required this.size});

  factory ComplaintAttachmentInfo.fromJson(Map<String, dynamic> json) => ComplaintAttachmentInfo(
        id: json['id'] as String,
        contentType: json['contentType'] as String,
        filename: json['filename'] as String,
        size: (json['size'] as num).toInt(),
      );

  final String id;
  final String contentType;
  final String filename;
  final int size;
}

class ComplaintDetail extends ComplaintSummary {
  ComplaintDetail({
    required super.id,
    required super.title,
    required super.category,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
    required super.hasReply,
    required super.attachmentCount,
    required super.companyId,
    required super.companySlug,
    required super.companyName,
    required this.body,
    required this.attachments,
    required this.timeline,
    this.companyReply,
    this.companyReplyUpdatedAt,
  });

  factory ComplaintDetail.fromJson(Map<String, dynamic> json) {
    final co = json['company'] as Map<String, dynamic>;
    return ComplaintDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      status: complaintStatusFrom(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      hasReply: json['hasReply'] as bool? ?? false,
      attachmentCount: (json['attachmentCount'] as num?)?.toInt() ?? 0,
      companyId: co['id'] as String,
      companySlug: co['slug'] as String,
      companyName: co['name'] as String,
      body: json['body'] as String,
      companyReply: json['companyReply'] as String?,
      companyReplyUpdatedAt: json['companyReplyUpdatedAt'] != null
          ? DateTime.parse(json['companyReplyUpdatedAt'] as String)
          : null,
      attachments: (json['attachments'] as List<dynamic>? ?? [])
          .map((j) => ComplaintAttachmentInfo.fromJson(j as Map<String, dynamic>))
          .toList(),
      timeline: (json['timeline'] as List<dynamic>? ?? [])
          .map((j) => ComplaintTimelineEntry.fromJson(j as Map<String, dynamic>))
          .toList(),
    );
  }

  final String body;
  final String? companyReply;
  final DateTime? companyReplyUpdatedAt;
  final List<ComplaintAttachmentInfo> attachments;
  final List<ComplaintTimelineEntry> timeline;
}

class Page<T> {
  Page({required this.items, this.nextCursor});
  final List<T> items;
  final String? nextCursor;
}
