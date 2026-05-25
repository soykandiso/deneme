class CompanySummary {
  CompanySummary({
    required this.id,
    required this.slug,
    required this.name,
    required this.category,
    required this.complaintCount,
    this.logoUrl,
    this.description,
  });

  factory CompanySummary.fromJson(Map<String, dynamic> json) => CompanySummary(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        category: json['category'] as String,
        complaintCount: (json['complaintCount'] as num?)?.toInt() ?? 0,
        logoUrl: json['logoUrl'] as String?,
        description: json['description'] as String?,
      );

  final String id;
  final String slug;
  final String name;
  final String category;
  final int complaintCount;
  final String? logoUrl;
  final String? description;
}

class CompanyDetail extends CompanySummary {
  CompanyDetail({
    required super.id,
    required super.slug,
    required super.name,
    required super.category,
    required super.complaintCount,
    super.logoUrl,
    super.description,
    this.website,
    this.contactEmail,
    this.phone,
    this.address,
  });

  factory CompanyDetail.fromJson(Map<String, dynamic> json) => CompanyDetail(
        id: json['id'] as String,
        slug: json['slug'] as String,
        name: json['name'] as String,
        category: json['category'] as String,
        complaintCount: (json['complaintCount'] as num?)?.toInt() ?? 0,
        logoUrl: json['logoUrl'] as String?,
        description: json['description'] as String?,
        website: json['website'] as String?,
        contactEmail: json['contactEmail'] as String?,
        phone: json['phone'] as String?,
        address: json['address'] as String?,
      );

  final String? website;
  final String? contactEmail;
  final String? phone;
  final String? address;
}
