import Phaser from 'phaser';

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#2c5e2e');
    const width = this.scale.width;
    const height = this.scale.height;

    // 加藤先生
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xffffff, 1);
    playerGraphics.fillRect(width * 0.2, height * 0.6, 60, 100);
    this.add.text(width * 0.2, height * 0.6 - 30, '加藤先生', { font: '20px Arial', color: '#ffffff' });

    // ドラゴン
    const enemyGraphics = this.add.graphics();
    enemyGraphics.fillStyle(0xff0000, 1);
    enemyGraphics.fillRect(width * 0.7, height * 0.4, 80, 80);
    this.add.text(width * 0.7, height * 0.4 - 30, '赤点ドラゴン', { font: '20px Arial', color: '#ff0000' });

    // メッセージ
    const messageBox = this.add.rectangle(width / 2, height - 100, width - 40, 150, 0x000000).setStrokeStyle(4, 0xffffff);
    this.messageText = this.add.text(40, height - 160, '赤点ドラゴン があらわれた！\n加藤先生 はどうする？', {
      font: '18px Arial',
      color: '#ffffff',
      wordWrap: { width: width - 80 }
    });

    // ボタン
    const attackButton = this.add.rectangle(width - 120, height - 250, 200, 60, 0x333333).setInteractive();
    this.add.text(width - 120, height - 250, '数学的攻撃', { font: '24px Arial', color: '#ffffff' }).setOrigin(0.5);

    attackButton.on('pointerdown', () => {
      this.messageText.setText('加藤先生 の 微分積分アタック！\n赤点ドラゴン に 50 のダメージ！');
      this.cameras.main.shake(200, 0.01);
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  backgroundColor: '#000000',
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BattleScene]
};

const game = new Phaser.Game(config);