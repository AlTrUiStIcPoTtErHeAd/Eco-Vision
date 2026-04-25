import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiService {
  static const String _base = 'http://172.16.152.96:8000';

  // ─── Session state ────────────────────────────────────────
  static String? _token;
  static String? _userId;
  static String? _email;
  static bool _isAdmin = false;

  static bool get isLoggedIn => _token != null;
  static bool get isAdmin => _isAdmin;
  static String? get userId => _userId;
  static String? get email => _email;

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_token != null) 'Authorization': 'Bearer $_token',
  };

  /// Stores session fields from any auth response.
  static void _storeSession(Map<String, dynamic> data) {
    _token = data['access_token'] ?? data['token'];
    _userId = data['user_id'];
    _email = data['email'];
    _isAdmin = data['is_admin'] ?? false;
  }

  // ─── AUTH ─────────────────────────────────────────────────

  /// Returns the full response map on success, null on failure.
  /// Backend now creates a token on signup, so we store it immediately.
  static Future<Map<String, dynamic>?> signup(
    String email,
    String password,
    String name,
  ) async {
    final res = await http.post(
      Uri.parse('$_base/auth/signup'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'is_admin': false,
      }),
    );
    if (res.statusCode == 200 || res.statusCode == 201) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _storeSession(data);
      return data;
    }
    return null;
  }

  /// Returns the full response map on success, null on failure.
  static Future<Map<String, dynamic>?> login(
    String email,
    String password,
  ) async {
    final res = await http.post(
      Uri.parse('$_base/auth/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _storeSession(data);
      return data;
    }
    return null;
  }

  /// Admin-only login — backend returns 403 if user is not admin.
  static Future<Map<String, dynamic>?> adminLogin(
    String email,
    String password,
  ) async {
    final res = await http.post(
      Uri.parse('$_base/auth/admin/login'),
      headers: _headers,
      body: jsonEncode({'email': email, 'password': password}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      _storeSession(data);
      return data;
    }
    return null;
  }

  static void logout() {
    _token = null;
    _userId = null;
    _email = null;
    _isAdmin = false;
  }

  // ─── PREDICTION ───────────────────────────────────────────

  static Future<Map<String, dynamic>?> predict(File imageFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/predict'),
    );
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    request.files.add(
      await http.MultipartFile.fromPath('file', imageFile.path),
    );

    final streamed = await request.send();
    final res = await http.Response.fromStream(streamed);

    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ─── POSTS ────────────────────────────────────────────────

  static Future<bool> createPost({
    required File image,
    required String caption,
    required String wasteType,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_base/posts/create'),
    );
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    request.fields['caption'] = caption;
    request.fields['waste_type'] = wasteType;
    request.files.add(await http.MultipartFile.fromPath('file', image.path));

    final streamed = await request.send();
    return streamed.statusCode == 200 || streamed.statusCode == 201;
  }

  static Future<List<dynamic>> getPosts() async {
    final res = await http.get(
      Uri.parse('$_base/posts'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return [];
  }

  // ─── USER ─────────────────────────────────────────────────

  static Future<Map<String, dynamic>?> getUserStats() async {
    final res = await http.get(
      Uri.parse('$_base/user/stats'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  // ─── ADMIN ────────────────────────────────────────────────

  static Future<Map<String, dynamic>?> getUsersCount() async {
    final res = await http.get(
      Uri.parse('$_base/admin/users-count'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  static Future<Map<String, dynamic>?> getCo2Saved() async {
    final res = await http.get(
      Uri.parse('$_base/admin/co2-saved'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  static Future<Map<String, dynamic>?> getActivity() async {
    final res = await http.get(
      Uri.parse('$_base/admin/activity'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return null;
  }

  static Future<bool> deletePost(String id) async {
    final res = await http.delete(
      Uri.parse('$_base/admin/post/$id'),
      headers: _headers,
    );
    return res.statusCode == 200;
  }

  // ─── HEALTH ───────────────────────────────────────────────

  static Future<bool> healthCheck() async {
    final res = await http.get(Uri.parse(_base));
    return res.statusCode == 200;
  }
}
