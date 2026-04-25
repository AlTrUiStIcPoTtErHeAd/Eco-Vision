import 'package:flutter/material.dart';
import 'package:ecovision/services/api_service.dart';
import 'package:ecovision/screens/login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _stats;
  List<dynamic> _posts = [];
  bool _loading = true;

  static const List<Map<String, dynamic>> _levels = [
    {'level': 1, 'title': 'Seedling', 'min': 0, 'max': 200},
    {'level': 2, 'title': 'Sprout', 'min': 200, 'max': 500},
    {'level': 3, 'title': 'Eco Starter', 'min': 500, 'max': 900},
    {'level': 4, 'title': 'Green Mover', 'min': 900, 'max': 1400},
    {'level': 5, 'title': 'Recycler', 'min': 1400, 'max': 2000},
    {'level': 6, 'title': 'Eco Guardian', 'min': 2000, 'max': 2700},
    {'level': 7, 'title': 'Eco Warrior', 'min': 2700, 'max': 3500},
    {'level': 8, 'title': 'Green Champion', 'min': 3500, 'max': 4500},
    {'level': 9, 'title': 'Planet Protector', 'min': 4500, 'max': 6000},
    {'level': 10, 'title': 'Eco Legend', 'min': 6000, 'max': 6000},
  ];

  Map<String, dynamic> _getLevelInfo(int points) {
    for (final l in _levels.reversed) {
      if (points >= (l['min'] as int)) return l;
    }
    return _levels.first;
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  Future<void> _loadData() async {
    final stats = await ApiService.getUserStats();
    final posts = await ApiService.getPosts();
    if (mounted) {
      setState(() {
        _stats = stats;
        _posts = posts;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    if (_loading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator(color: cs.primary)),
      );
    }

    final int points = _stats?['total_points'] ?? 0;
    final int totalPosts = _stats?['total_posts'] ?? _posts.length;
    final double co2 = (_stats?['total_co2_saved'] ?? 0.0).toDouble();
    final levelInfo = _getLevelInfo(points);
    final int levelNum = levelInfo['level'] as int;
    final String levelTitle = levelInfo['title'] as String;
    final int levelMin = levelInfo['min'] as int;
    final int levelMax = levelInfo['max'] as int;
    final double progress = levelMax > levelMin
        ? ((points - levelMin) / (levelMax - levelMin)).clamp(0.0, 1.0)
        : 1.0;
    final int nextLevelPts = levelMax > points ? levelMax - points : 0;
    String nextTitle = '';
    if (levelNum < 10) nextTitle = _levels[levelNum]['title'] as String;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          ApiService.email ?? 'Profile',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ApiService.logout();
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginPage()),
                (_) => false,
              );
            },
          ),
        ],
      ),
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      _Avatar(email: ApiService.email ?? ''),
                      const SizedBox(width: 24),
                      Expanded(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _StatColumn(label: 'Posts', value: '$totalPosts'),
                            _StatColumn(
                              label: 'Eco pts',
                              value: _formatPts(points),
                              accent: true,
                            ),
                            _StatColumn(
                              label: 'CO₂ saved',
                              value: '${co2.toStringAsFixed(1)}kg',
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    ApiService.email?.split('@').first ?? 'User',
                    style: TextStyle(
                      color: cs.onSurface,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    children: [
                      _Badge(
                        label: '♻ Recycler',
                        bg: cs.primaryContainer,
                        fg: cs.onPrimaryContainer,
                      ),
                      if (points >= 2000)
                        _Badge(
                          label: '★ Top Contributor',
                          bg: cs.secondaryContainer,
                          fg: cs.onSecondaryContainer,
                        ),
                      if (ApiService.isAdmin)
                        _Badge(
                          label: '⚙ Admin',
                          bg: cs.tertiaryContainer,
                          fg: cs.onTertiaryContainer,
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _LevelBar(
                    levelNum: levelNum,
                    levelTitle: levelTitle,
                    progress: progress,
                    points: points,
                    levelMax: levelMax,
                    nextPts: nextLevelPts,
                    nextTitle: nextTitle,
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabDelegate(
              TabBar(
                controller: _tabController,
                indicatorColor: cs.primary,
                indicatorWeight: 2,
                labelColor: cs.primary,
                unselectedLabelColor: cs.onSurfaceVariant,
                tabs: const [
                  Tab(icon: Icon(Icons.grid_on, size: 20)),
                  Tab(icon: Icon(Icons.bar_chart, size: 20)),
                  Tab(icon: Icon(Icons.eco, size: 20)),
                ],
              ),
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _PostsGrid(posts: _posts),
            _PointsTab(stats: _stats),
            _ImpactTab(stats: _stats, co2: co2, points: points),
          ],
        ),
      ),
    );
  }

  String _formatPts(int pts) =>
      pts >= 1000 ? '${(pts / 1000).toStringAsFixed(1)}k' : '$pts';
}

class _Avatar extends StatelessWidget {
  final String email;
  const _Avatar({required this.email});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final initials = email.isNotEmpty ? email[0].toUpperCase() : '?';
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: cs.primary, width: 2.5),
      ),
      padding: const EdgeInsets.all(3),
      child: CircleAvatar(
        backgroundColor: cs.primaryContainer,
        child: Text(
          initials,
          style: TextStyle(
            color: cs.onPrimaryContainer,
            fontSize: 26,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
      ),
    );
  }
}

class _StatColumn extends StatelessWidget {
  final String label;
  final String value;
  final bool accent;
  const _StatColumn({
    required this.label,
    required this.value,
    this.accent = false,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: accent ? cs.primary : cs.onSurface,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
      ],
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;
  const _Badge({required this.label, required this.bg, required this.fg});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold),
      ),
    );
  }
}

class _LevelBar extends StatelessWidget {
  final int levelNum;
  final String levelTitle;
  final double progress;
  final int points;
  final int levelMax;
  final int nextPts;
  final String nextTitle;

  const _LevelBar({
    required this.levelNum,
    required this.levelTitle,
    required this.progress,
    required this.points,
    required this.levelMax,
    required this.nextPts,
    required this.nextTitle,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Level $levelNum — $levelTitle',
                style: TextStyle(
                  color: cs.onSurface,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
              Text(
                '$points / $levelMax pts',
                style: TextStyle(
                  color: cs.primary,
                  fontSize: 12,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 6,
              backgroundColor: cs.surfaceContainerLowest,
              valueColor: AlwaysStoppedAnimation<Color>(cs.primary),
            ),
          ),
          if (nextTitle.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              '$nextPts pts to Level ${levelNum + 1} — $nextTitle',
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }
}

class _PostsGrid extends StatelessWidget {
  final List<dynamic> posts;
  const _PostsGrid({required this.posts});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (posts.isEmpty) {
      return Center(
        child: Text(
          'No posts yet',
          style: TextStyle(color: cs.onSurfaceVariant),
        ),
      );
    }
    return GridView.builder(
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: posts.length,
      itemBuilder: (context, i) {
        final post = posts[i];
        final imageUrl = post['image_url'] as String?;
        return Stack(
          fit: StackFit.expand,
          children: [
            imageUrl != null
                ? Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        Container(color: cs.surfaceContainerHighest),
                  )
                : Container(color: cs.surfaceContainerHighest),
            Positioned(
              bottom: 4,
              left: 4,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.inverseSurface.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  (post['waste_type'] ?? '').toString().toUpperCase(),
                  style: TextStyle(
                    color: cs.onInverseSurface,
                    fontSize: 9,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PointsTab extends StatelessWidget {
  final Map<String, dynamic>? stats;
  const _PointsTab({required this.stats});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final wasteBreakdown =
        stats?['waste_breakdown'] as Map<String, dynamic>? ?? {};
    const wasteTypes = ['cardboard', 'glass', 'metal', 'paper', 'plastic'];
    const ptsPerItem = {
      'cardboard': 20,
      'glass': 25,
      'metal': 30,
      'paper': 15,
      'plastic': 20,
    };
    const icons = {
      'cardboard': '📦',
      'glass': '🫙',
      'metal': '🔩',
      'paper': '📄',
      'plastic': '🧴',
    };

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        ...wasteTypes.map((type) {
          final count = (wasteBreakdown[type] ?? 0) as int;
          final pts = count * (ptsPerItem[type] ?? 20);
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: cs.outlineVariant),
            ),
            child: Row(
              children: [
                Text(icons[type] ?? '♻', style: const TextStyle(fontSize: 22)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${type[0].toUpperCase()}${type.substring(1)} recycled',
                        style: TextStyle(
                          color: cs.onSurface,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '$count items scanned',
                        style: TextStyle(
                          color: cs.onSurfaceVariant,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  '+$pts pts',
                  style: TextStyle(
                    color: cs.primary,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          );
        }),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: cs.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: cs.outlineVariant),
          ),
          child: Row(
            children: [
              const Text('🔥', style: TextStyle(fontSize: 22)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Streak bonus',
                      style: TextStyle(
                        color: cs.onSurface,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Keep scanning daily!',
                      style: TextStyle(
                        color: cs.onSurfaceVariant,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '+${(stats?['streak_bonus'] ?? 0)} pts',
                style: TextStyle(
                  color: cs.secondary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ImpactTab extends StatelessWidget {
  final Map<String, dynamic>? stats;
  final double co2;
  final int points;
  const _ImpactTab({
    required this.stats,
    required this.co2,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final totalItems = (stats?['total_posts'] ?? 0) as int;
    final streak = (stats?['streak_days'] ?? 0) as int;
    final rank = (stats?['rank'] ?? '-').toString();
    final wasteBreakdown =
        stats?['waste_breakdown'] as Map<String, dynamic>? ?? {};
    final total = wasteBreakdown.values.fold<int>(0, (s, v) => s + (v as int));

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.6,
          children: [
            _MetricCard(
              value: co2.toStringAsFixed(1),
              label: 'kg CO₂ saved',
              color: cs.primary,
            ),
            _MetricCard(
              value: '$totalItems',
              label: 'items recycled',
              color: cs.secondary,
            ),
            _MetricCard(
              value: '$streak',
              label: 'day streak',
              color: cs.tertiary,
            ),
            _MetricCard(value: '#$rank', label: 'leaderboard', color: cs.error),
          ],
        ),
        const SizedBox(height: 12),
        if (total > 0)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: cs.outlineVariant),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Waste breakdown',
                  style: TextStyle(
                    color: cs.onSurfaceVariant,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 12),
                ...wasteBreakdown.entries.map((e) {
                  final pct = total > 0 ? (e.value as int) / total : 0.0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              e.key,
                              style: TextStyle(
                                color: cs.onSurfaceVariant,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              '${(pct * 100).round()}%',
                              style: TextStyle(
                                color: cs.onSurface,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: pct,
                            minHeight: 5,
                            backgroundColor: cs.surfaceContainerLowest,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              cs.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _MetricCard({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              fontFamily: 'monospace',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _TabDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return ColoredBox(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabDelegate old) => false;
}
