import Phaser from 'phaser';

// ----------------------------------------------------------------
// 0. ドット絵の設計図（ここをいじると絵が変わります）
// ----------------------------------------------------------------
// パレット（数字と色の対応）
const PALETTE = {
  '.': null,      // 透明
  '0': '#000000', // 黒（輪郭/髪）
  '1': '#ffe0c0', // 肌色
  '2': '#ffffff', // 白（白衣）
  '3': '#3333cc', // 青（ネクタイ/ズボン）
  '4': '#ff3333', // 赤（敵）
  '5': '#cc0000', // 暗い赤（敵の影）
  '6': '#8888ff', // 薄い青（スライム）
  '7': '#4444aa', // 濃い青
};

// 加藤先生のドット絵（16x16）
const KATO_ART = [
  "......0000......",
  ".....000000.....",
  "....00000000....",
  "....00000000....", // 髪
  "....01111110....", // 顔
  "....03111130....", // メガネ
  "....01111110....",
  ".....222222.....", // 白衣
  "....22233222....", // ネクタイ
  "....22222222....",
  "....22222222....",
  ".....33..33.....", // 足
  ".....33..33.....",
  ".....00..00....."  // 靴
];

// 敵：数式スライム（16x16）
const SLIME_ART = [
  "................",
  "................",
  "......6666......",
  "....66666666....",
  "...6667667666...", // 目
  "..666666666666..",
  "..666606606666..", // 口
  ".66666666666666.",
  "6666666666666666",
  "................"
];

// 敵：赤点ドラゴン（16x16）
const DRAGON_ART = [
  ".......44.......",
  "......4444......",
  ".....445544.....", // 目
  "....44444444....",
  "...4440000444...", // 口
  "..444444444444..",
  ".444..4444..444.", // 翼
  "44....4444....44",
  "......4444......",
  "......4..4......"
];


// ----------------------------------------------------------------
// 1. ゲームデータ
// ----------------------------------------------------------------
const GAME_DATA = {
  player: {
    name: '加藤先生',
    level: 1,
    exp: 0,
    nextExp: 50,
    hp: 100,
    maxHp: 100,
    atk: 15,
    healPower: 30,
    items: [] 
  }
};

const ENEMY_LIST = [
  { name: '数式スライム', hp: 30, atk: 5, exp: 10, key: 'slime', drop: { name: '消しゴム', type: 'heal', value: 30 } },
  { name: '赤点ドラゴン', hp: 120, atk: 15, exp: 100, key: 'dragon', drop: { name: '魔法のチョーク', type: 'super_atk', value: 50 } }
];

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  // ここで「文字」を「画像」に変換して登録します
  preload() {
    this.createTextureFromText('kato', KATO_ART);
    this.createTextureFromText('slime', SLIME_ART);
    this.createTextureFromText('dragon', DRAGON_ART);
  }

  create() {
    this.cameras.main.setBackgroundColor('#222222');
    const width = this.scale.width;
    const height = this.scale.height;

    // --- プレイヤー表示（画像に変更） ---
    // ドット絵は小さいので、setScale(4)で4倍に拡大表示します
    this.playerSprite = this.add.sprite(width * 0.25, height * 0.6, 'kato').setScale(5);
    this.playerNameText = this.add.text(width * 0.25, height * 0.6 - 50, '', { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    this.playerHpText = this.add.text(width * 0.25, height * 0.6 + 60, '', { font: '24px Arial', color: '#00ff00' }).setOrigin(0.5);
    this.playerLvText = this.add.text(width * 0.25, height * 0.6 + 90, '', { font: '16px Arial', color: '#ffff00' }).setOrigin(0.5);

    // --- 敵表示（画像に変更） ---
    this.enemySprite = this.add.sprite(width * 0.75, height * 0.4, 'slime').setScale(5).setVisible(false);
    this.enemyNameText = this.add.text(width * 0.75, height * 0.4 - 50, '', { font: '20px Arial', color: '#ffaaaa' }).setOrigin(0.5);
    this.enemyHpText = this.add.text(width * 0.75, height * 0.4 + 50, '', { font: '24px Arial', color: '#ffaaaa' }).setOrigin(0.5);

    // メッセージウィンドウ
    this.createMessageBox(width, height);

    // --- コマンドボタン群 ---
    this.btnGroup = this.add.group();
    const attackBtn = this.createButton(width - 100, height - 280, 'たたかう', 0xcc3333, () => this.playerTurn('attack'));
    const healBtn = this.createButton(width - 240, height - 280, '回復', 0x33cc33, () => this.playerTurn('heal'));
    const itemBtn = this.createButton(width - 100, height - 210, 'アイテム', 0x3333cc, () => this.openItemMenu());
    this.btnGroup.add(attackBtn);
    this.btnGroup.add(healBtn);
    this.btnGroup.add(itemBtn);

    // 次へボタン
    this.nextBtn = this.add.rectangle(width / 2, height / 2, 200, 80, 0xffaa00).setInteractive().setVisible(false);
    this.nextBtnText = this.add.text(width / 2, height / 2, '次の戦いへ', { font: '28px Arial', color: '#000000' }).setOrigin(0.5).setVisible(false);
    this.nextBtn.on('pointerdown', () => this.startBattle());

    // ゲーム開始
    this.currentEnemy = null;
    this.isPlayerTurn = true;
    this.refreshStatus();
    this.startBattle();
  }

  // --- ドット絵生成システム ---
  createTextureFromText(key, artArray) {
    const pixelSize = 1; // 1文字1ピクセルとして扱う
    const width = artArray[0].length;
    const height = artArray.length;
    
    // Canvasを作って絵を描く
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const char = artArray[y][x];
        const color = PALETTE[char];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Phaserにテクスチャとして登録
    this.textures.addCanvas(key, canvas);
  }

  // --- バトル開始処理 ---
  startBattle() {
    this.nextBtn.setVisible(false);
    this.nextBtnText.setVisible(false);
    this.btnGroup.setVisible(true);

    const enemyData = ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)];
    this.currentEnemy = { ...enemyData };
    this.currentEnemy.maxHp = enemyData.hp;

    // 敵の画像を変更
    this.enemySprite.setTexture(this.currentEnemy.key);
    this.enemySprite.setVisible(true);
    this.enemyHpText.setVisible(true);
    this.enemyNameText.setText(this.currentEnemy.name);
    this.enemyNameText.setVisible(true);

    this.updateMessage(`${this.currentEnemy.name} があらわれた！`);
    
    // 登場アニメーション（ピョンと跳ねる）
    this.tweens.add({
        targets: this.enemySprite,
        y: this.enemySprite.y - 20,
        duration: 200,
        yoyo: true,
        ease: 'Power1'
    });

    this.isPlayerTurn = true;
    this.refreshStatus();
  }

  // --- プレイヤー処理 ---
  playerTurn(action, item = null) {
    if (!this.isPlayerTurn) return;
    this.isPlayerTurn = false;

    // 攻撃アニメーション（前に出る）
    this.tweens.add({
        targets: this.playerSprite,
        x: this.playerSprite.x + 30,
        duration: 100,
        yoyo: true
    });

    if (action === 'attack') {
      const damage = GAME_DATA.player.atk;
      this.currentEnemy.hp -= damage;
      this.updateMessage(`${GAME_DATA.player.name} の攻撃！\n${damage} のダメージ！`);
      this.cameras.main.shake(100, 0.01);

    } else if (action === 'heal') {
      const heal = GAME_DATA.player.healPower;
      GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + heal, GAME_DATA.player.maxHp);
      this.updateMessage(`加藤先生は一息ついた。\nHPが ${heal} 回復！`);

    } else if (action === 'item') {
      if (item.type === 'heal') {
        GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + item.value, GAME_DATA.player.maxHp);
        this.updateMessage(`${item.name} を使った！\nHPが ${item.value} 回復！`);
      } else if (item.type === 'super_atk') {
        const damage = item.value;
        this.currentEnemy.hp -= damage;
        this.updateMessage(`${item.name} を投げつけた！\n${damage} の大ダメージ！`);
      }
      const index = GAME_DATA.player.items.indexOf(item);
      if (index > -1) GAME_DATA.player.items.splice(index, 1);
    }

    this.refreshStatus();

    if (this.currentEnemy.hp <= 0) {
      this.currentEnemy.hp = 0;
      this.time.delayedCall(1000, () => this.winBattle());
    } else {
      this.time.delayedCall(1200, () => this.enemyTurn());
    }
  }

  // --- 敵の行動 ---
  enemyTurn() {
    if (this.currentEnemy.hp <= 0) return;

    // 攻撃アニメーション（前に出る）
    this.tweens.add({
        targets: this.enemySprite,
        x: this.enemySprite.x - 30,
        duration: 100,
        yoyo: true
    });

    const damage = this.currentEnemy.atk;
    GAME_DATA.player.hp -= damage;
    this.updateMessage(`${this.currentEnemy.name} の攻撃！\n${damage} のダメージを受けた！`);
    this.cameras.main.shake(200, 0.02);
    this.refreshStatus();

    if (GAME_DATA.player.hp <= 0) {
        GAME_DATA.player.hp = 0;
        this.updateMessage(`目の前が真っ暗になった... (リロードして再挑戦)`);
    } else {
        this.isPlayerTurn = true;
    }
  }

  winBattle() {
    // 敵が点滅して消える演出
    this.tweens.add({
        targets: this.enemySprite,
        alpha: 0,
        duration: 200,
        repeat: 3,
        onComplete: () => {
            this.enemySprite.setVisible(false);
            this.enemySprite.alpha = 1; // 元に戻す
        }
    });
    
    this.enemyHpText.setVisible(false);
    this.enemyNameText.setVisible(false);
    this.btnGroup.setVisible(false);

    GAME_DATA.player.exp += this.currentEnemy.exp;
    let msg = `${this.currentEnemy.name} を倒した！\n経験値 ${this.currentEnemy.exp} を獲得！`;

    if (this.currentEnemy.drop) {
      GAME_DATA.player.items.push(this.currentEnemy.drop);
      msg += `\n[${this.currentEnemy.drop.name}] を手に入れた！`;
    }

    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
      GAME_DATA.player.level++;
      GAME_DATA.player.maxHp += 20;
      GAME_DATA.player.hp = GAME_DATA.player.maxHp;
      GAME_DATA.player.atk += 5;
      GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
      msg += `\nレベルアップ！ Lv${GAME_DATA.player.level} になった！`;
    }

    this.updateMessage(msg);
    this.nextBtn.setVisible(true);
    this.nextBtnText.setVisible(true);
  }

  refreshStatus() {
    this.playerNameText.setText(GAME_DATA.player.name);
    this.playerHpText.setText(`HP: ${GAME_DATA.player.hp} / ${GAME_DATA.player.maxHp}`);
    this.playerLvText.setText(`Lv: ${GAME_DATA.player.level}`);
    if (this.currentEnemy) {
        this.enemyHpText.setText(`HP: ${Math.max(0, this.currentEnemy.hp)} / ${this.currentEnemy.maxHp}`);
    }
  }

  createButton(x, y, text, color, callback) {
    const btn = this.add.rectangle(x, y, 120, 50, color).setInteractive();
    this.add.text(x, y, text, { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerdown', callback);
    return btn;
  }

  createMessageBox(width, height) {
    this.add.rectangle(width / 2, height - 100, width - 20, 160, 0x000000).setStrokeStyle(4, 0xffffff);
    this.messageText = this.add.text(30, height - 160, '', { font: '18px Arial', color: '#ffffff', wordWrap: { width: width - 60 } });
  }

  updateMessage(text) {
    this.messageText.setText(text);
  }

  openItemMenu() {
    if (!this.isPlayerTurn) return;
    if (GAME_DATA.player.items.length === 0) {
        this.updateMessage("アイテムを持っていない！");
        return;
    }
    const item = GAME_DATA.player.items[GAME_DATA.player.items.length - 1];
    this.updateMessage(`これを使いますか？\n[${item.name}]`);
    this.playerTurn('item', item);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  backgroundColor: '#000000',
  parent: 'game-container',
  pixelArt: true, // ドット絵をくっきり表示する設定
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene]
};

const game = new Phaser.Game(config);