import Phaser from 'phaser';

// ----------------------------------------------------------------
// ゲームのデータ（ステータスなど）
// ----------------------------------------------------------------
const GAME_DATA = {
  player: {
    name: '加藤先生',
    hp: 100,
    maxHp: 100,
    atk: 15,
    healPower: 30, // 回復量
    items: [] // 手に入れたアイテムが入るリスト
  },
  enemy: {
    name: '赤点ドラゴン',
    hp: 60,
    maxHp: 60,
    atk: 10,
    dropItem: '魔法のチョーク' // 倒した時に落とすもの
  }
};

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  create() {
    // 背景色
    this.cameras.main.setBackgroundColor('#2c5e2e');
    const width = this.scale.width;
    const height = this.scale.height;

    // --- 1. キャラクター表示 ---
    // 加藤先生
    this.add.rectangle(width * 0.25, height * 0.6, 60, 100, 0xffffff);
    this.add.text(width * 0.25, height * 0.6 - 30, GAME_DATA.player.name, { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    // 加藤先生のHP表示
    this.playerHpText = this.add.text(width * 0.25, height * 0.6 + 60, `HP: ${GAME_DATA.player.hp}/${GAME_DATA.player.maxHp}`, { font: '24px Arial', color: '#00ff00' }).setOrigin(0.5);

    // 赤点ドラゴン
    this.add.rectangle(width * 0.75, height * 0.4, 80, 80, 0xff0000);
    this.add.text(width * 0.75, height * 0.4 - 30, GAME_DATA.enemy.name, { font: '20px Arial', color: '#ff0000' }).setOrigin(0.5);
    // ドラゴンのHP表示
    this.enemyHpText = this.add.text(width * 0.75, height * 0.4 + 50, `HP: ${GAME_DATA.enemy.hp}/${GAME_DATA.enemy.maxHp}`, { font: '24px Arial', color: '#ffaaaa' }).setOrigin(0.5);

    // --- 2. メッセージウィンドウ ---
    this.createMessageBox(width, height);

    // --- 3. コマンドボタン ---
    // [たたかう] ボタン
    this.attackBtn = this.createButton(width - 120, height - 260, 'たたかう', 0xcc3333, () => {
      this.playerTurn('attack');
    });

    // [回復する] ボタン（将来的にアイテム使用などに変更可能）
    this.healBtn = this.createButton(width - 250, height - 260, '回復', 0x3333cc, () => {
      this.playerTurn('heal');
    });

    // 初期状態の設定
    this.isPlayerTurn = true; // プレイヤーのターンから開始
    this.updateMessage(`${GAME_DATA.enemy.name} があらわれた！`);
  }

  // ボタン作成用の便利関数
  createButton(x, y, text, color, callback) {
    const btn = this.add.rectangle(x, y, 100, 50, color).setInteractive();
    const label = this.add.text(x, y, text, { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    
    // ボタンを押した時の動作
    btn.on('pointerdown', () => {
      // 自分のターンでなければ反応しない
      if (this.isPlayerTurn) {
        callback();
      }
    });
    return btn;
  }

  // メッセージボックス作成
  createMessageBox(width, height) {
    this.add.rectangle(width / 2, height - 100, width - 40, 150, 0x000000).setStrokeStyle(4, 0xffffff);
    this.messageText = this.add.text(40, height - 160, '', {
      font: '18px Arial',
      color: '#ffffff',
      wordWrap: { width: width - 80 }
    });
  }

  // メッセージ更新
  updateMessage(text) {
    this.messageText.setText(text);
  }

  // --- プレイヤーのターン処理 ---
  playerTurn(action) {
    this.isPlayerTurn = false; // ボタン連打防止

    if (action === 'attack') {
      // 攻撃の処理
      const damage = GAME_DATA.player.atk;
      GAME_DATA.enemy.hp -= damage;
      if (GAME_DATA.enemy.hp < 0) GAME_DATA.enemy.hp = 0;

      this.updateMessage(`${GAME_DATA.player.name} の攻撃！\n${GAME_DATA.enemy.name} に ${damage} のダメージ！`);
      this.cameras.main.shake(100, 0.01); // 揺らす

    } else if (action === 'heal') {
      // 回復の処理
      const heal = GAME_DATA.player.healPower;
      GAME_DATA.player.hp += heal;
      if (GAME_DATA.player.hp > GAME_DATA.player.maxHp) GAME_DATA.player.hp = GAME_DATA.player.maxHp;

      this.updateMessage(`${GAME_DATA.player.name} は ホイミ的な計算 をした！\nHPが ${heal} 回復した！`);
    }

    // HP表示の更新
    this.refreshHpText();

    // 敵が倒れたかチェック
    if (GAME_DATA.enemy.hp <= 0) {
      this.time.delayedCall(1500, () => this.battleWin());
    } else {
      // 敵のターンへ
      this.time.delayedCall(1500, () => this.enemyTurn());
    }
  }

  // --- 敵のターン処理 ---
  enemyTurn() {
    const damage = GAME_DATA.enemy.atk;
    GAME_DATA.player.hp -= damage;
    if (GAME_DATA.player.hp < 0) GAME_DATA.player.hp = 0;

    this.updateMessage(`${GAME_DATA.enemy.name} の攻撃！\n${GAME_DATA.player.name} は ${damage} のダメージを受けた！`);
    this.cameras.main.shake(200, 0.02); // 強く揺らす

    // HP表示の更新
    this.refreshHpText();

    // プレイヤーが負けたかチェック
    if (GAME_DATA.player.hp <= 0) {
      this.time.delayedCall(1500, () => this.battleLose());
    } else {
      // プレイヤーのターンに戻る
      this.time.delayedCall(1500, () => {
        this.updateMessage(`${GAME_DATA.player.name} のターン！`);
        this.isPlayerTurn = true;
      });
    }
  }

  // HP表示を最新にする
  refreshHpText() {
    this.playerHpText.setText(`HP: ${GAME_DATA.player.hp}/${GAME_DATA.player.maxHp}`);
    this.enemyHpText.setText(`HP: ${GAME_DATA.enemy.hp}/${GAME_DATA.enemy.maxHp}`);
  }

  // --- 勝利処理 ---
  battleWin() {
    // アイテム獲得
    GAME_DATA.player.items.push(GAME_DATA.enemy.dropItem);

    this.updateMessage(`${GAME_DATA.enemy.name} を倒した！\n戦利品: [${GAME_DATA.enemy.dropItem}] を手に入れた！`);
    
    // ここで勝利BGMなどを流す想定
    // 戦闘終了後の処理（マップに戻るなど）は今後ここに追加
  }

  // --- 敗北処理 ---
  battleLose() {
    this.updateMessage(`${GAME_DATA.player.name} は計算ミスで倒れた...\n目の前が真っ暗になった！`);
    // ゲームオーバー処理
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