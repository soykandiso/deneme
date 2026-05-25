// Lightweight, code-gen-free localization layer.
// Keys + per-locale maps live here so the app compiles without `flutter gen-l10n`.
// Long-term we can swap this for ARB-based AppLocalizations without changing call sites.

import 'package:flutter/widgets.dart';

class Strings {
  Strings(this.locale);
  final Locale locale;

  static const supportedLocales = <Locale>[
    Locale('mk'),
    Locale('sq'),
    Locale('en'),
  ];

  static const delegate = _StringsDelegate();

  static Strings of(BuildContext context) =>
      Localizations.of<Strings>(context, Strings) ?? Strings(const Locale('en'));

  String _t(String key) =>
      (_dict[locale.languageCode] ?? _dict['en']!)[key] ?? _dict['en']![key] ?? key;

  String get appTitle => _t('appTitle');
  String get tabHome => _t('tabHome');
  String get tabCompanies => _t('tabCompanies');
  String get tabComplaints => _t('tabComplaints');
  String get tabMe => _t('tabMe');
  String get homeHero => _t('homeHero');
  String get homeSubtitle => _t('homeSubtitle');
  String get submitComplaint => _t('submitComplaint');
  String get suggestCompany => _t('suggestCompany');
  String get browseCompanies => _t('browseCompanies');
  String get browseComplaints => _t('browseComplaints');
  String get search => _t('search');
  String get filter => _t('filter');
  String get filters => _t('filters');
  String get all => _t('all');
  String get category => _t('category');
  String get status => _t('status');
  String get sort => _t('sort');
  String get sortNewest => _t('sortNewest');
  String get sortOldest => _t('sortOldest');
  String get sortUpdated => _t('sortUpdated');
  String get sortReported => _t('sortReported');
  String get noResults => _t('noResults');
  String get retry => _t('retry');
  String get loading => _t('loading');
  String get complaintDetail => _t('complaintDetail');
  String get companyReply => _t('companyReply');
  String get noCompanyReply => _t('noCompanyReply');
  String get evidence => _t('evidence');
  String get timeline => _t('timeline');
  String get report => _t('report');
  String get reportComplaint => _t('reportComplaint');
  String get reportReason => _t('reportReason');
  String get reportDetail => _t('reportDetail');
  String get submit => _t('submit');
  String get cancel => _t('cancel');
  String get step1Company => _t('step1Company');
  String get step2Describe => _t('step2Describe');
  String get step3Review => _t('step3Review');
  String get title => _t('title');
  String get body => _t('body');
  String get contactEmailOptional => _t('contactEmailOptional');
  String get contactPhoneOptional => _t('contactPhoneOptional');
  String get addAttachment => _t('addAttachment');
  String get attachmentsHint => _t('attachmentsHint');
  String get publish => _t('publish');
  String get publishConfirm => _t('publishConfirm');
  String get language => _t('language');
  String get languageMacedonian => _t('languageMacedonian');
  String get languageAlbanian => _t('languageAlbanian');
  String get languageEnglish => _t('languageEnglish');
  String get theme => _t('theme');
  String get themeSystem => _t('themeSystem');
  String get themeLight => _t('themeLight');
  String get themeDark => _t('themeDark');
  String get about => _t('about');
  String get aboutBody => _t('aboutBody');
  String get openCompanyPortal => _t('openCompanyPortal');
  String get errorGeneric => _t('errorGeneric');
  String get errorRateLimited => _t('errorRateLimited');
  String get errorOffline => _t('errorOffline');
  String get viewAll => _t('viewAll');

  String complaintsCount(int n) {
    final l = locale.languageCode;
    if (n == 0) {
      return {'en': 'No complaints', 'mk': 'Нема жалби', 'sq': 'Asnjë ankesë'}[l]!;
    }
    if (n == 1) {
      return {'en': '1 complaint', 'mk': '1 жалба', 'sq': '1 ankesë'}[l]!;
    }
    return {'en': '$n complaints', 'mk': '$n жалби', 'sq': '$n ankesa'}[l]!;
  }
}

class _StringsDelegate extends LocalizationsDelegate<Strings> {
  const _StringsDelegate();
  @override
  bool isSupported(Locale locale) =>
      Strings.supportedLocales.any((l) => l.languageCode == locale.languageCode);
  @override
  Future<Strings> load(Locale locale) async => Strings(locale);
  @override
  bool shouldReload(_StringsDelegate old) => false;
}

const Map<String, Map<String, String>> _dict = {
  'en': {
    'appTitle': 'Zalba',
    'tabHome': 'Home',
    'tabCompanies': 'Companies',
    'tabComplaints': 'Complaints',
    'tabMe': 'Me',
    'homeHero': 'Hold companies accountable.',
    'homeSubtitle': 'Submit, track and explore public complaints.',
    'submitComplaint': 'Submit a complaint',
    'suggestCompany': 'Suggest a company',
    'browseCompanies': 'Browse companies',
    'browseComplaints': 'Browse complaints',
    'search': 'Search',
    'filter': 'Filter',
    'filters': 'Filters',
    'all': 'All',
    'category': 'Category',
    'status': 'Status',
    'sort': 'Sort',
    'sortNewest': 'Newest',
    'sortOldest': 'Oldest',
    'sortUpdated': 'Recently updated',
    'sortReported': 'Most reported',
    'noResults': 'Nothing found yet.',
    'retry': 'Retry',
    'loading': 'Loading…',
    'complaintDetail': 'Complaint',
    'companyReply': 'Company reply',
    'noCompanyReply': 'No reply yet from the company.',
    'evidence': 'Evidence',
    'timeline': 'Timeline',
    'report': 'Report',
    'reportComplaint': 'Report this complaint',
    'reportReason': 'Reason',
    'reportDetail': 'Details (optional)',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'step1Company': 'Choose company',
    'step2Describe': 'Describe the issue',
    'step3Review': 'Review & submit',
    'title': 'Title',
    'body': 'Description',
    'contactEmailOptional': 'Contact email (optional, kept private)',
    'contactPhoneOptional': 'Contact phone (optional, kept private)',
    'addAttachment': 'Add attachment',
    'attachmentsHint': 'Up to 5 files, 10 MB each. Images and PDFs only.',
    'publish': 'Publish complaint',
    'publishConfirm': 'Once published your complaint becomes public.',
    'language': 'Language',
    'languageMacedonian': 'Македонски',
    'languageAlbanian': 'Shqip',
    'languageEnglish': 'English',
    'theme': 'Theme',
    'themeSystem': 'System',
    'themeLight': 'Light',
    'themeDark': 'Dark',
    'about': 'About Zalba',
    'aboutBody': 'Zalba is an independent public complaint platform.',
    'openCompanyPortal': 'Company portal (web)',
    'errorGeneric': 'Something went wrong. Please try again.',
    'errorRateLimited': 'Too many requests. Please try again later.',
    'errorOffline': 'You appear to be offline.',
    'viewAll': 'View all',
  },
  'mk': {
    'appTitle': 'Жалба',
    'tabHome': 'Почетна',
    'tabCompanies': 'Компании',
    'tabComplaints': 'Жалби',
    'tabMe': 'Профил',
    'homeHero': 'Барајте одговорност од компаниите.',
    'homeSubtitle': 'Поднесете, следете и истражувајте јавни жалби.',
    'submitComplaint': 'Поднеси жалба',
    'suggestCompany': 'Предложи компанија',
    'browseCompanies': 'Преглед на компании',
    'browseComplaints': 'Преглед на жалби',
    'search': 'Пребарување',
    'filter': 'Филтер',
    'filters': 'Филтри',
    'all': 'Сите',
    'category': 'Категорија',
    'status': 'Статус',
    'sort': 'Подреди',
    'sortNewest': 'Најнови',
    'sortOldest': 'Најстари',
    'sortUpdated': 'Неодамна ажурирани',
    'sortReported': 'Најмногу пријавени',
    'noResults': 'Сè уште нема резултати.',
    'retry': 'Обиди се повторно',
    'loading': 'Се вчитува…',
    'complaintDetail': 'Жалба',
    'companyReply': 'Одговор од компанијата',
    'noCompanyReply': 'Сè уште нема одговор од компанијата.',
    'evidence': 'Докази',
    'timeline': 'Хронологија',
    'report': 'Пријави',
    'reportComplaint': 'Пријави ја оваа жалба',
    'reportReason': 'Причина',
    'reportDetail': 'Детали (опционално)',
    'submit': 'Поднеси',
    'cancel': 'Откажи',
    'step1Company': 'Избери компанија',
    'step2Describe': 'Опиши го проблемот',
    'step3Review': 'Преглед и поднесување',
    'title': 'Наслов',
    'body': 'Опис',
    'contactEmailOptional': 'Контакт е-пошта (опционално, приватно)',
    'contactPhoneOptional': 'Контакт телефон (опционално, приватно)',
    'addAttachment': 'Додај прилог',
    'attachmentsHint': 'До 5 датотеки, по 10 MB. Само слики и PDF.',
    'publish': 'Објави жалба',
    'publishConfirm': 'По објавувањето жалбата станува јавна.',
    'language': 'Јазик',
    'languageMacedonian': 'Македонски',
    'languageAlbanian': 'Shqip',
    'languageEnglish': 'English',
    'theme': 'Тема',
    'themeSystem': 'Системска',
    'themeLight': 'Светла',
    'themeDark': 'Темна',
    'about': 'За Жалба',
    'aboutBody': 'Жалба е независна јавна платформа за поплаки.',
    'openCompanyPortal': 'Портал за компании (веб)',
    'errorGeneric': 'Се случи грешка. Обидете се повторно.',
    'errorRateLimited': 'Премногу барања. Обидете се подоцна.',
    'errorOffline': 'Изгледа дека сте офлајн.',
    'viewAll': 'Види ги сите',
  },
  'sq': {
    'appTitle': 'Ankesa',
    'tabHome': 'Kreu',
    'tabCompanies': 'Kompanitë',
    'tabComplaints': 'Ankesat',
    'tabMe': 'Profili',
    'homeHero': 'Kërko llogari nga kompanitë.',
    'homeSubtitle': 'Dorëzo, ndiq dhe shfleto ankesa publike.',
    'submitComplaint': 'Dorëzo një ankesë',
    'suggestCompany': 'Sugjero një kompani',
    'browseCompanies': 'Shfleto kompanitë',
    'browseComplaints': 'Shfleto ankesat',
    'search': 'Kërko',
    'filter': 'Filtër',
    'filters': 'Filtrat',
    'all': 'Të gjitha',
    'category': 'Kategoria',
    'status': 'Statusi',
    'sort': 'Rendit',
    'sortNewest': 'Më të rejat',
    'sortOldest': 'Më të vjetrat',
    'sortUpdated': 'Të përditësuara së fundi',
    'sortReported': 'Më të raportuarat',
    'noResults': 'Ende asgjë e gjetur.',
    'retry': 'Provo përsëri',
    'loading': 'Po ngarkohet…',
    'complaintDetail': 'Ankesa',
    'companyReply': 'Përgjigja e kompanisë',
    'noCompanyReply': 'Ende pa përgjigje nga kompania.',
    'evidence': 'Prova',
    'timeline': 'Kronologjia',
    'report': 'Raporto',
    'reportComplaint': 'Raporto këtë ankesë',
    'reportReason': 'Arsyeja',
    'reportDetail': 'Detaje (opsionale)',
    'submit': 'Dorëzo',
    'cancel': 'Anulo',
    'step1Company': 'Zgjidh kompaninë',
    'step2Describe': 'Përshkruaj problemin',
    'step3Review': 'Rishikim dhe dorëzim',
    'title': 'Titulli',
    'body': 'Përshkrimi',
    'contactEmailOptional': 'Email-i i kontaktit (opsional, privat)',
    'contactPhoneOptional': 'Telefoni i kontaktit (opsional, privat)',
    'addAttachment': 'Shto bashkëngjitje',
    'attachmentsHint': 'Deri në 5 skedarë, 10 MB secili. Vetëm imazhe dhe PDF.',
    'publish': 'Publiko ankesën',
    'publishConfirm': 'Pas publikimit ankesa bëhet publike.',
    'language': 'Gjuha',
    'languageMacedonian': 'Македонски',
    'languageAlbanian': 'Shqip',
    'languageEnglish': 'English',
    'theme': 'Tema',
    'themeSystem': 'Sistemi',
    'themeLight': 'E çelët',
    'themeDark': 'E errët',
    'about': 'Rreth Ankesa',
    'aboutBody': 'Ankesa është platformë e pavarur publike për ankesa.',
    'openCompanyPortal': 'Portali për kompanitë (ueb)',
    'errorGeneric': 'Diçka shkoi keq. Provoni përsëri.',
    'errorRateLimited': 'Shumë kërkesa. Provoni më vonë.',
    'errorOffline': 'Duket se jeni offline.',
    'viewAll': 'Shiko të gjitha',
  },
};
