import Phaser from 'phaser';

// 1. 各ファイルからクラスをインポート（パスは './ファイル名'）
import { OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, NormalClearScene, SecretBossIntroScene, TrueClearScene } from './MenuScenes.js';
import { BattleScene } from './BattleScene.js';

// 2. ゲームの設定
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  backgroundColor: '#000000',
  parent: 'game-container',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // 3. ここで読み込むシーンをリスト化
  scene: [
    OpeningScene,
    TutorialScene,
    WorldScene,
    ShopScene,
    SkillScene,
    BattleScene,
    NormalClearScene,
    SecretBossIntroScene,
    TrueClearScene
  ]
};

// 4. ゲーム開始
new Phaser.Game(config);