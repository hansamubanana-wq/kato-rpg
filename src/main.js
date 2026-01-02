import Phaser from 'phaser';

// ----------------------------------------------------------------
// 1. ゲームデータ（セーブデータの代わり）
// ----------------------------------------------------------------
const GAME_DATA = {
  player: {
    name: '加藤先生',
    level: 1,
    exp: 0,
    nextExp: 50, // 次のレベルまで
    hp: 100,
    maxHp: 100,
    atk: 15,
    healPower: 30,
    items: [] // { name: '薬草', type: 'heal', value: 50 } のようなオブジェクトが入る
  }
};

// ----------------------------------------------------------------
// 2. 敵のデータベース
// ----------------------------------------------------------------
const ENEMY_LIST = [
  { name: '宿題の忘れ物', hp: 30, atk: 5, exp: 10, color: 0x88ccff, drop: { name: 'エナジードリンク', type: 'heal', value: 30 } },
  { name: '居眠り生徒', hp: 50, atk: 8, exp: 20, color: 0xffff88, drop: { name: '三角定規', type: 'buff', value: 2 } },
  { name: '赤点ドラゴン', hp: 120, atk: 15, exp: 100, color: 0xff0000, drop: { name: '魔法のチョーク', type: 'super_atk', value: 50 } }
];

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#222222');
    const width = this.scale.width;
    const height = this.scale.height;

    // --- 画面パーツの初期化 ---
    // プレイヤー表示
    this.add.rectangle(width * 0.25, height * 0.6, 60, 100, 0xffffff);
    this.playerNameText = this.add.text(width * 0.25, height * 0.6 - 30, '', { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    this.playerHpText = this.add.text(width * 0.25, height * 0.6 + 60, '', { font: '24px Arial', color: '#00ff00' }).setOrigin(0.5);
    this.playerLvText = this.add.text(width * 0.25, height * 0.6 + 90, '', { font: '16px Arial', color: '#ffff00' }).setOrigin(0.5);

    // 敵表示（最初は空っぽ）
    this.enemyRect = this.add.rectangle(width * 0.75, height * 0.4, 80, 80, 0xff0000);
    this.enemyNameText = this.add.text(width * 0.75, height * 0.4 - 30, '', { font: '20px Arial', color: '#ffaaaa' }).setOrigin(0.5);
    this.enemyHpText = this.add.text(width * 0.75, height * 0.4 + 50, '', { font: '24px Arial', color: '#ffaaaa' }).setOrigin(0.5);

    // メッセージウィンドウ
    this.createMessageBox(width, height);

    // --- コマンドボタン群 ---
    this.btnGroup = this.add.group();
    
    // [たたかう]
    const attackBtn = this.createButton(width - 100, height - 280, 'たたかう', 0xcc3333, () => this.playerTurn('attack'));
    
    // [回復]
    const healBtn = this.createButton(width - 240, height - 280, '回復', 0x33cc33, () => this.playerTurn('heal'));

    // [アイテム]
    const itemBtn = this.createButton(width - 100, height - 210, 'アイテム', 0x3333cc, () => this.openItemMenu());

    this.btnGroup.add(attackBtn);
    this.btnGroup.add(healBtn);
    this.btnGroup.add(itemBtn);

    // --- 次へ進むボタン（戦闘終了後に出る） ---
    this.nextBtn = this.add.rectangle(width / 2, height / 2, 200, 80, 0xffaa00).setInteractive().setVisible(false);
    this.nextBtnText = this.add.text(width / 2, height / 2, '次の戦いへ', { font: '28px Arial', color: '#000000' }).setOrigin(0.5).setVisible(false);
    this.nextBtn.on('pointerdown', () => this.startBattle());

    // --- ゲーム開始 ---
    this.currentEnemy = null;
    this.isPlayerTurn = true;
    this.refreshStatus();
    
    // 最初の敵を出現させる
    this.startBattle();
  }

  // --- バトル開始処理 ---
  startBattle() {
    this.nextBtn.setVisible(false);
    this.nextBtnText.setVisible(false);
    this.btnGroup.setVisible(true);

    // ランダムに敵を選ぶ
    const enemyData = ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)];
    
    // 敵データをコピーしてセット（HPなどを個別に管理するため）
    this.currentEnemy = { ...enemyData }; 
    this.currentEnemy.maxHp = enemyData.hp;

    // 敵の見た目更新
    this.enemyRect.setFillStyle(this.currentEnemy.color);
    this.enemyNameText.setText(this.currentEnemy.name);
    this.enemyRect.setVisible(true);
    this.enemyHpText.setVisible(true);
    this.enemyNameText.setVisible(true);

    this.updateMessage(`${this.currentEnemy.name} があらわれた！`);
    this.isPlayerTurn = true;
    this.refreshStatus();
  }

  // --- プレイヤーの行動 ---
  playerTurn(action, item = null) {
    if (!this.isPlayerTurn) return;
    this.isPlayerTurn = false;

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
      // アイテム使用処理
      if (item.type === 'heal') {
        GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + item.value, GAME_DATA.player.maxHp);
        this.updateMessage(`${item.name} を使った！\nHPが ${item.value} 回復！`);
      } else if (item.type === 'buff') {
        GAME_DATA.player.atk += item.value;
        this.updateMessage(`${item.name} を使った！\n攻撃力が ${item.value} 上がった！`);
      } else if (item.type === 'super_atk') {
        const damage = item.value;
        this.currentEnemy.hp -= damage;
        this.updateMessage(`${item.name} を投げつけた！\n${damage} の大ダメージ！`);
      }
      
      // 使ったアイテムを消す
      const index = GAME_DATA.player.items.indexOf(item);
      if (index > -1) GAME_DATA.player.items.splice(index, 1);
    }

    this.refreshStatus();

    // 判定
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

    const damage = this.currentEnemy.atk;
    GAME_DATA.player.hp -= damage;
    this.updateMessage(`${this.currentEnemy.name} の攻撃！\n${damage} のダメージを受けた！`);
    this.cameras.main.shake(200, 0.02);
    this.refreshStatus();

    if (GAME_DATA.player.hp <= 0) {
        GAME_DATA.player.hp = 0;
        this.updateMessage(`目の前が真っ暗になった... (リロードして再挑戦)`);
        // ここでゲームオーバー処理（今回は簡易的に停止）
    } else {
        this.isPlayerTurn = true;
    }
  }

  // --- 勝利処理 ---
  winBattle() {
    this.enemyRect.setVisible(false);
    this.enemyHpText.setVisible(false);
    this.enemyNameText.setVisible(false);
    this.btnGroup.setVisible(false); // コマンドを隠す

    // 経験値獲得
    GAME_DATA.player.exp += this.currentEnemy.exp;
    let msg = `${this.currentEnemy.name} を倒した！\n経験値 ${this.currentEnemy.exp} を獲得！`;

    // アイテムドロップ（100%ドロップに設定中）
    if (this.currentEnemy.drop) {
      GAME_DATA.player.items.push(this.currentEnemy.drop);
      msg += `\n[${this.currentEnemy.drop.name}] を手に入れた！`;
    }

    // レベルアップ判定
    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
      GAME_DATA.player.level++;
      GAME_DATA.player.maxHp += 20;
      GAME_DATA.player.hp = GAME_DATA.player.maxHp; // 全回復
      GAME_DATA.player.atk += 5;
      GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
      msg += `\nレベルアップ！ Lv${GAME_DATA.player.level} になった！`;
    }

    this.updateMessage(msg);

    // 次へボタン表示
    this.nextBtn.setVisible(true);
    this.nextBtnText.setVisible(true);
  }

  // --- UI関連 ---
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

  // --- アイテムメニュー（簡易版） ---
  openItemMenu() {
    if (!this.isPlayerTurn) return;
    
    if (GAME_DATA.player.items.length === 0) {
        this.updateMessage("アイテムを持っていない！");
        return;
    }

    // 最新のアイテムを使う（簡易実装として、リストの最後のアイテムを自動使用）
    // 本来は一覧画面を作るが、まずは「持っているアイテムを使う」体験を優先
    const item = GAME_DATA.player.items[GAME_DATA.player.items.length - 1];
    
    // 確認メッセージ
    this.updateMessage(`これを使いますか？\n[${item.name}]`);
    
    // 一時的にボタンの動作を上書きするなどの処理が必要だが
    // 今回は「アイテムボタンを押したら即座に最新アイテム使用」とする
    this.playerTurn('item', item);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  backgroundColor: '#000000',
  parent: 'game-container',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene]
};

const game = new Phaser.Game(config);