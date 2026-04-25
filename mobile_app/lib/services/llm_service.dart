import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class LLMService {
  static const String apiKey =
      "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";

  static Future<String> getRecyclingTips({
    required String wasteType,
    required File imageFile,
  }) async {
    final url = Uri.parse("https://openrouter.ai/api/v1/chat/completions");

    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);

    final response = await http.post(
      url,
      headers: {
        "Authorization": "Bearer $apiKey",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "model": "openai/gpt-4o-mini",
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text":
                    "This item is classified as $wasteType. Give practical recycling tips. Be specific, actionable, no explanations. No formatting, just plain text.",
              },
              {
                "type": "image_url",
                "image_url": {"url": "data:image/jpeg;base64,$base64Image"},
              },
            ],
          },
        ],
      }),
    );

    if (response.statusCode != 200) {
      throw Exception("LLM Error: ${response.body}");
    }

    final data = jsonDecode(response.body);
    return data["choices"][0]["message"]["content"];
  }
}
