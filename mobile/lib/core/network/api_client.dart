import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../preferences/preferences.dart';

const _defaultBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

class ApiClient {
  ApiClient(this._dio);
  final Dio _dio;

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    final res = await _dio.get<Map<String, dynamic>>(path, queryParameters: query);
    return res.data ?? const {};
  }

  Future<Map<String, dynamic>> postJson(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? headers,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      path,
      data: body,
      options: Options(headers: headers),
    );
    return res.data ?? const {};
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    required FormData formData,
    Map<String, dynamic>? headers,
  }) async {
    final res = await _dio.post<Map<String, dynamic>>(
      path,
      data: formData,
      options: Options(headers: headers, contentType: 'multipart/form-data'),
    );
    return res.data ?? const {};
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: '$_defaultBaseUrl/v1',
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 20),
    responseType: ResponseType.json,
  ));

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final locale = await ref.read(preferencesProvider.future);
      options.headers['Accept-Language'] = locale.localeCode;
      handler.next(options);
    },
  ));

  return ApiClient(dio);
});
