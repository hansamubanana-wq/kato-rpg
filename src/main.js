import Phaser from 'phaser';
// 【修正】 ./scenes/... ではなく ./... からインポートする
import { OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, NormalClearScene, SecretBossIntroScene, TrueClearScene } from './MenuScenes.js';
import { BattleScene } from './BattleScene.js';

// シーン登録
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

new Phaser.Game(config);