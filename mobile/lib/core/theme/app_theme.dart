import 'package:flutter/material.dart';

class AppColors {
  static const trust       = Color(0xFF1D4ED8); // primary
  static const trustDark   = Color(0xFF1E3A8A);
  static const surface     = Color(0xFFF7F8FB);
  static const surfaceDark = Color(0xFF0F1320);
  static const card        = Color(0xFFFFFFFF);
  static const cardDark    = Color(0xFF161B2C);
  static const ink         = Color(0xFF1B2230);
  static const inkDark     = Color(0xFFE7EAF2);
  static const muted       = Color(0xFF5A6577);
  static const mutedDark   = Color(0xFF8B93A7);
  static const divider     = Color(0xFFE3E7EC);
  static const dividerDark = Color(0xFF232940);
  static const danger      = Color(0xFFB91C1C);
  static const warn        = Color(0xFFB45309);
  static const good        = Color(0xFF047857);
}

class AppSpacing {
  static const xs = 4.0;
  static const s = 8.0;
  static const m = 12.0;
  static const l = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;
}

class AppRadii {
  static const small = 8.0;
  static const medium = 12.0;
  static const large = 16.0;
}

class AppTheme {
  static ThemeData light() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: AppColors.trust,
        onPrimary: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.ink,
      ),
      scaffoldBackgroundColor: AppColors.surface,
      fontFamily: 'Inter',
    );
    return _decorate(base, dark: false);
  }

  static ThemeData dark() {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.trust,
        onPrimary: Colors.white,
        surface: AppColors.surfaceDark,
        onSurface: AppColors.inkDark,
      ),
      scaffoldBackgroundColor: AppColors.surfaceDark,
      fontFamily: 'Inter',
    );
    return _decorate(base, dark: true);
  }

  static ThemeData _decorate(ThemeData base, {required bool dark}) {
    final card = dark ? AppColors.cardDark : AppColors.card;
    final divider = dark ? AppColors.dividerDark : AppColors.divider;
    return base.copyWith(
      appBarTheme: AppBarTheme(
        backgroundColor: dark ? AppColors.surfaceDark : AppColors.surface,
        foregroundColor: dark ? AppColors.inkDark : AppColors.ink,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: TextStyle(
          color: dark ? AppColors.inkDark : AppColors.ink,
          fontWeight: FontWeight.w600,
          fontSize: 18,
        ),
      ),
      dividerTheme: DividerThemeData(color: divider, space: 1, thickness: 1),
      cardTheme: CardTheme(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.medium),
          side: BorderSide(color: divider),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: BorderSide(color: divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: BorderSide(color: divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.small),
          borderSide: const BorderSide(color: AppColors.trust, width: 1.5),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.trust,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.small)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: dark ? AppColors.inkDark : AppColors.ink,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          side: BorderSide(color: divider),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.small)),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: dark ? AppColors.cardDark : AppColors.card,
        side: BorderSide(color: divider),
        labelStyle: TextStyle(color: dark ? AppColors.inkDark : AppColors.ink),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: dark ? AppColors.cardDark : AppColors.card,
        selectedItemColor: AppColors.trust,
        unselectedItemColor: dark ? AppColors.mutedDark : AppColors.muted,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
    );
  }
}
