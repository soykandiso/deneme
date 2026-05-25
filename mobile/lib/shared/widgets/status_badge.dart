import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../models/complaint.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({super.key, required this.status});
  final ComplaintStatus status;

  @override
  Widget build(BuildContext context) {
    final (color, label) = switch (status) {
      ComplaintStatus.newStatus => (AppColors.trust, 'NEW'),
      ComplaintStatus.contacted => (AppColors.warn,  'CONTACTED'),
      ComplaintStatus.resolved  => (AppColors.good,  'RESOLVED'),
      ComplaintStatus.removed   => (AppColors.muted, 'REMOVED'),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 11,
          letterSpacing: 0.6,
        ),
      ),
    );
  }
}
