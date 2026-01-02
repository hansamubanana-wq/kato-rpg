import Phaser from 'phaser';
import { OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, NormalClearScene, SecretBossIntroScene, TrueClearScene } from './MenuScenes';
import { BattleScene } from './BattleScene';
import { loadGame } from './data'; // データをロードする関数をインポート

// ★重要：ゲーム起動時に必ずセーブデータをロードする！
loadGame();

const config = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  backgroundColor: '#000000',
  parent: 'game-container',
  pixelArt: true, // ドット絵をくっきり表示
  scene: [
    OpeningScene,
    TutorialScene,
    WorldScene,
    BattleScene,
    ShopScene,
    SkillScene,
    NormalClearScene,
    SecretBossIntroScene,
    TrueClearScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // スマホで音が鳴らない問題対策
  audio: {
    disableWebAudio: false
  }
};

const game = new Phaser.Game(config);