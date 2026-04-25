import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import '../services/llm_service.dart';

class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final ImagePicker _picker = ImagePicker();

  File? _image;
  String? _result;
  double? _confidence;
  String? _tips;

  bool _loading = false;
  bool _loadingTips = false;

  static const List<String> _classes = [
    'cardboard',
    'glass',
    'metal',
    'paper',
    'plastic',
  ];

  Future<void> _pickImage(ImageSource source) async {
    final picked = await _picker.pickImage(source: source, imageQuality: 85);
    if (picked == null) return;

    final file = File(picked.path);

    setState(() {
      _image = file;
      _result = null;
      _confidence = null;
      _tips = null;
      _loading = true;
    });

    await _runInference(file);
  }

  Future<void> _runInference(File imageFile) async {
    try {
      final interpreter = await Interpreter.fromAsset('assets/model.tflite');

      final bytes = await imageFile.readAsBytes();
      final decoded = img.decodeImage(bytes)!;
      final resized = img.copyResize(decoded, width: 224, height: 224);

      final input = List.generate(
        1,
        (_) => List.generate(
          224,
          (y) => List.generate(224, (x) {
            final p = resized.getPixel(x, y);
            return [p.r / 255, p.g / 255, p.b / 255];
          }),
        ),
      );

      final output = List.filled(
        1 * _classes.length,
        0.0,
      ).reshape([1, _classes.length]);

      interpreter.run(input, output);
      interpreter.close();

      final scores = output[0] as List<double>;
      final maxScore = scores.reduce((a, b) => a > b ? a : b);
      final maxIndex = scores.indexOf(maxScore);

      setState(() {
        _result = _classes[maxIndex];
        _confidence = maxScore * 100;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _result = "Error";
        _loading = false;
      });
    }
  }

  Future<void> _getTips() async {
    if (_result == null || _image == null) return;

    setState(() {
      _loadingTips = true;
    });

    try {
      final tips = await LLMService.getRecyclingTips(
        wasteType: _result!,
        imageFile: _image!,
      );

      setState(() {
        _tips = tips;
        _loadingTips = false;
      });
    } catch (e) {
      setState(() {
        _tips = "Failed to fetch tips";
        _loadingTips = false;
      });
    }
  }

  String _pretty(String s) => s[0].toUpperCase() + s.substring(1);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Scan Waste"),
        centerTitle: true,
      ),

      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: "gallery",
            mini: true,
            onPressed: () => _pickImage(ImageSource.gallery),
            child: const Icon(Icons.photo_library),
          ),
          const SizedBox(height: 12),
          FloatingActionButton(
            heroTag: "camera",
            onPressed: () => _pickImage(ImageSource.camera),
            child: const Icon(Icons.camera_alt),
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: _result == null ? 300 : 120,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: cs.surfaceContainerHighest,
              ),
              clipBehavior: Clip.antiAlias,
              child: _image == null
                  ? Center(
                      child: Text(
                        "Scan using camera",
                        style: tt.bodyMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    )
                  : Image.file(_image!, fit: BoxFit.cover),
            ),

            const SizedBox(height: 20),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              ),

            if (_result != null && !_loading)
              Card(
                elevation: 0,
                color: cs.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Text(
                        _pretty(_result!),
                        style: tt.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "${_confidence!.toStringAsFixed(1)}% confidence",
                        style: tt.bodyMedium?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: _loadingTips ? null : _getTips,
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: _loadingTips
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text("Get Recycling Tips"),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (_tips != null)
              Expanded(
                child: Card(
                  margin: const EdgeInsets.only(top: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SingleChildScrollView(
                      child: Text(
                        _tips!,
                        style: tt.bodyMedium,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
