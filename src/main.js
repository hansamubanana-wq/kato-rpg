import Phaser from 'phaser';

// 【ここを修正しました】
// フォルダ分けされていないので、 './scenes/...' ではなく './...' から読み込みます
import { OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, NormalClearScene, SecretBossIntroScene, TrueClearScene } from './MenuScenes.js';
import { BattleScene } from './BattleScene.js';

// ゲームの設定
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
  // 読み込むシーンのリスト
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

// ゲーム開始
new Phaser.Game(config);