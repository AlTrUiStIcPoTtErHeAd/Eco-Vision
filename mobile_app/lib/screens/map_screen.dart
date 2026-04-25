import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  // Hardcoded places
  final List<Map<String, dynamic>> places = const [
    {
      "name": "Green Earth Recycling",
      "lat": 28.6139,
      "lng": 77.2090,
    },
    {
      "name": "Eco Waste Center",
      "lat": 28.6200,
      "lng": 77.2150,
    },
    {
      "name": "City Scrap Yard",
      "lat": 28.6100,
      "lng": 77.2000,
    },
    {
      "name": "Plastic Collection Hub",
      "lat": 28.6050,
      "lng": 77.2100,
    },
  ];

  // Open Google Maps directions
  Future<void> _openMaps(double lat, double lng) async {
    final Uri url = Uri.parse(
      "https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving",
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      throw "Could not open Google Maps";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Nearby Recycling Centers"),
      ),
      body: ListView.builder(
        itemCount: places.length,
        itemBuilder: (context, index) {
          final place = places[index];

          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: ListTile(
              leading: const Icon(Icons.recycling, color: Colors.green),
              title: Text(place["name"]),
              subtitle: Text("Lat: ${place["lat"]}, Lng: ${place["lng"]}"),
              trailing: const Icon(Icons.directions),
              onTap: () {
                _openMaps(place["lat"], place["lng"]);
              },
            ),
          );
        },
      ),
    );
  }
}
