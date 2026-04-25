import 'package:ecovision/screens/analysis_page.dart';
import 'package:flutter/material.dart';

class ScanScreen extends StatelessWidget {
  const ScanScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: TextButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const AnalysisPage(),
              ),
            );
          },
          child: Text("Scan"),
        ),
      ),
    );
  }
}
