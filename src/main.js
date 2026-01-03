import Phaser from 'phaser';
import { OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, NormalClearScene, SecretBossIntroScene, TrueClearScene } from './MenuScenes';
import { BattleScene } from './BattleScene';
import { loadGame } from './data'; 

// ゲーム起動時にセーブデータを読み込む
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
  audio: {
    disableWebAudio: false // スマホでの音再生対策
  }
};

const game = new Phaser.Game(config);