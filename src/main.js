import Phaser from 'phaser';

// ----------------------------------------------------------------
// 0. ドット絵リソース
// ----------------------------------------------------------------
const PALETTE = {
  '.': null, '0': '#000000', '1': '#ffe0c0', '2': '#ffffff',
  '3': '#3333cc', '4': '#ff3333', '5': '#cc0000', '6': '#8888ff', '7': '#4444aa'
};

const KATO_ART = [
  "......0000......", ".....000000.....", "....00000000....", "....00000000....",
  "....01111110....", "....03111130....", "....01111110....", ".....222222.....",
  "....22233222....", "....22222222....", "....22222222....", ".....33..33.....",
  ".....33..33.....", ".....00..00....."
];

const SLIME_ART = [
  "................", "................", "......6666......", "....66666666....",
  "...6667667666...", "..666666666666..", "..666606606666..", ".66666666666666.",
  "6666666666666666", "................"
];

const DRAGON_ART = [
  ".......44.......", "......4444......", ".....445544.....", "....44444444....",
  "...4440000444...", "..444444444444..", ".444..4444..444.", "44....4444....44",
  "......4444......", "......4..4......"
];

// ----------------------------------------------------------------
// 1. スキルデータ（6つの技）
// ----------------------------------------------------------------
const SKILLS = [
  { id: 1, name: '出席確認', type: 'attack', power: 10, speed: 1.0, desc: '基本の攻撃' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 15, speed: 1.2, desc: '少し強い攻撃' },
  { id: 3, name: '定規スラッシュ', type: 'attack', power: 25, speed: 1.5, desc: '強力だが難しい' },
  { id: 4, name: '小テスト', type: 'attack', power: 8, speed: 0.8, desc: '当てやすい' },
  { id: 5, name: '難問の出題', type: 'attack', power: 40, speed: 2.0, desc: '超強力・超難度' },
  { id: 6, name: '公式の確認', type: 'heal', power: 40, speed: 0, desc: 'HPを回復する' }
];

// ----------------------------------------------------------------
// 2. ゲームデータ
// ----------------------------------------------------------------
const GAME_DATA = {
  player: {
    name: '加藤先生',
    level: 1, exp: 0, nextExp: 50,
    hp: 100, maxHp: 100, atk: 1.0, // 攻撃倍率
    items: [],
    equippedSkills: SKILLS // 現在セットしている6つの技
  }
};

const ENEMY_LIST = [
  { name: '数式スライム', hp: 50, atk: 8, exp: 10, key: 'slime', drop: { name: '消しゴム', type: 'heal', value: 30 } },
  { name: '赤点ドラゴン', hp: 200, atk: 20, exp: 100, key: 'dragon', drop: { name: '魔法のチョーク', type: 'super_atk', value: 50 } }
];

class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  preload() {
    this.createTextureFromText('kato', KATO_ART);
    this.createTextureFromText('slime', SLIME_ART);
    this.createTextureFromText('dragon', DRAGON_ART);
  }

  create() {
    this.cameras.main.setBackgroundColor('#222222');
    const width = this.scale.width;
    const height = this.scale.height;

    // --- UIエリア ---
    this.playerSprite = this.add.sprite(width * 0.25, height * 0.6, 'kato').setScale(5);
    this.playerNameText = this.add.text(width * 0.25, height * 0.6 - 50, '', { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    this.playerHpText = this.add.text(width * 0.25, height * 0.6 + 60, '', { font: '24px Arial', color: '#00ff00' }).setOrigin(0.5);
    this.playerLvText = this.add.text(width * 0.25, height * 0.6 + 90, '', { font: '16px Arial', color: '#ffff00' }).setOrigin(0.5);

    this.enemySprite = this.add.sprite(width * 0.75, height * 0.4, 'slime').setScale(5).setVisible(false);
    this.enemyNameText = this.add.text(width * 0.75, height * 0.4 - 50, '', { font: '20px Arial', color: '#ffaaaa' }).setOrigin(0.5);
    this.enemyHpText = this.add.text(width * 0.75, height * 0.4 + 50, '', { font: '24px Arial', color: '#ffaaaa' }).setOrigin(0.5);

    // QTE用パーツ
    this.qteTarget = this.add.graphics().setDepth(100);
    this.qteRing = this.add.graphics().setDepth(100);
    this.qteText = this.add.text(width/2, height/2 - 100, '', { font: '40px Arial', color: '#ffcc00', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(101);
    
    // 防御用シグナル
    this.guardSignal = this.add.text(width/2, height/2, '！', { font: '80px Arial', color: '#ff0000', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5).setVisible(false).setDepth(101);
    this.penaltyX = this.add.text(width * 0.25, height * 0.6, '×', { font: '80px Arial', color: '#ff0000', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setVisible(false).setDepth(200);

    // メッセージウィンドウ
    this.createMessageBox(width, height);

    // --- メインコマンドボタン ---
    this.mainMenu = this.add.group();
    const cmdBtn = this.createButton(width - 100, height - 260, 'コマンド', 0xcc3333, () => this.openSkillMenu());
    const itemBtn = this.createButton(width - 100, height - 190, 'アイテム', 0x3333cc, () => this.openItemMenu());
    this.mainMenu.add(cmdBtn);
    this.mainMenu.add(itemBtn);

    // --- スキル選択メニュー（最初は非表示） ---
    this.skillMenu = this.add.container(0, height - 300).setVisible(false).setDepth(50);
    // 背景
    const menuBg = this.add.rectangle(width/2, 150, width, 300, 0x000000, 0.9).setOrigin(0.5);
    this.skillMenu.add(menuBg);
    
    // 6つのスキルボタン生成
    GAME_DATA.player.equippedSkills.forEach((skill, index) => {
        const col = index % 2; // 0 or 1
        const row = Math.floor(index / 2); // 0, 1, 2
        const x = width * 0.25 + col * (width * 0.5);
        const y = 60 + row * 80;
        
        // 色分け（攻撃=赤系、回復=緑系）
        const color = skill.type === 'heal' ? 0x228822 : 0x882222;
        
        const btn = this.add.rectangle(x, y, 160, 60, color).setInteractive();
        const text = this.add.text(x, y, skill.name, { font: '18px Arial', color: '#ffffff' }).setOrigin(0.5);
        
        // ボタンクリックイベント
        btn.on('pointerdown', () => {
             // イベントの伝播を止める（後ろのタップ判定を防ぐ）
             this.input.stopPropagation();
             this.selectSkill(skill);
        });

        this.skillMenu.add(btn);
        this.skillMenu.add(text);
    });

    // 戻るボタン
    const backBtn = this.add.rectangle(width/2, 280, 100, 40, 0x555555).setInteractive();
    const backText = this.add.text(width/2, 280, '戻る', {font:'16px Arial'}).setOrigin(0.5);
    backBtn.on('pointerdown', () => {
        this.input.stopPropagation();
        this.skillMenu.setVisible(false);
        this.mainMenu.setVisible(true);
        this.updateMessage(`${GAME_DATA.player.name} のターン`);
    });
    this.skillMenu.add(backBtn);
    this.skillMenu.add(backText);


    // 入力リスナー
    this.input.on('pointerdown', () => this.handleInput());

    // 次へボタン
    this.nextBtn = this.add.rectangle(width / 2, height / 2, 200, 80, 0xffaa00).setInteractive().setVisible(false).setDepth(200);
    this.nextBtnText = this.add.text(width / 2, height / 2, '次の戦いへ', { font: '28px Arial', color: '#000000' }).setOrigin(0.5).setVisible(false).setDepth(201);
    this.nextBtn.on('pointerdown', () => this.startBattle());

    // 初期化
    this.isPlayerTurn = true;
    this.qteMode = null; 
    this.qteActive = false;
    this.guardBroken = false;
    this.selectedSkill = null; // 選択したスキル

    this.refreshStatus();
    this.startBattle();
  }

  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) {
        this.resolveAttackQTE();
        return;
    }
    if (this.qteMode === 'defense_wait') {
        this.triggerGuardPenalty();
        return;
    }
    if (this.qteMode === 'defense_active') {
        this.resolveDefenseQTE();
        return;
    }
  }

  // --- メニュー操作 ---
  openSkillMenu() {
      if (!this.isPlayerTurn) return;
      this.mainMenu.setVisible(false);
      this.skillMenu.setVisible(true);
      this.updateMessage("行動を選択してください");
  }

  selectSkill(skill) {
      this.skillMenu.setVisible(false);
      this.selectedSkill = skill;

      if (skill.type === 'heal') {
          // 回復スキルなら即発動（QTEなし）
          this.executeHeal(skill);
      } else {
          // 攻撃スキルならQTE開始
          this.startAttackQTE(skill);
      }
  }

  // --- 攻撃QTE ---
  startAttackQTE(skill) {
    this.isPlayerTurn = false;
    this.updateMessage(`${skill.name}！\nタイミングよくタップせよ！`);

    const targetX = this.enemySprite.x;
    const targetY = this.enemySprite.y;
    
    this.qteTarget.clear();
    this.qteTarget.lineStyle(4, 0xffffff);
    this.qteTarget.strokeCircle(targetX, targetY, 50);
    this.qteTarget.setVisible(true);
    this.qteRing.clear();
    this.qteRingScale = 2.5; 
    this.qteMode = 'attack';
    
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qteEvent = this.time.addEvent({
          delay: 16, loop: true,
          callback: () => {
            if (!this.qteActive) return;
            // スキルごとのspeedによってリングの縮小速度を変える
            const speed = 0.03 * skill.speed; 
            this.qteRingScale -= speed;
            
            this.qteRing.clear();
            this.qteRing.lineStyle(4, 0xffff00);
            this.qteRing.strokeCircle(targetX, targetY, 50 * this.qteRingScale);
            if (this.qteRingScale <= 0.5) this.finishQTE('MISS');
          }
        });
    });
  }

  resolveAttackQTE() {
    this.qteActive = false;
    if (this.qteEvent) this.qteEvent.remove();
    this.qteRing.clear();
    this.qteTarget.clear();
    const diff = Math.abs(this.qteRingScale - 1.0);
    if (diff < 0.15) this.finishQTE('PERFECT');
    else if (diff < 0.4) this.finishQTE('GOOD');
    else this.finishQTE('BAD');
  }

  finishQTE(result) {
    this.qteText.setText(result);
    this.qteText.setVisible(true);
    this.qteText.setScale(0);
    this.tweens.add({
        targets: this.qteText,
        scale: 1.5, duration: 300, yoyo: true,
        onComplete: () => {
            this.qteText.setVisible(false);
            if (this.qteMode === 'attack') this.executeAttack(result);
        }
    });
  }

  executeAttack(rank) {
    let damage = this.selectedSkill.power * GAME_DATA.player.atk; // スキル威力 x プレイヤー倍率
    let msg = "";
    if (rank === 'PERFECT') { damage = Math.floor(damage * 1.5); msg = "会心の一撃！！"; this.cameras.main.shake(200, 0.03); }
    else if (rank === 'GOOD') { msg = "ナイスタイミング！"; }
    else if (rank === 'BAD' || rank === 'MISS') { damage = Math.floor(damage * 0.5); msg = "タイミングが悪い..."; }

    this.currentEnemy.hp -= damage;
    this.updateMessage(`${this.selectedSkill.name}！\n${msg}\n${damage} のダメージ！`);
    this.tweens.add({ targets: this.playerSprite, x: this.playerSprite.x + 50, duration: 100, yoyo: true });
    this.checkBattleEnd();
  }

  executeHeal(skill) {
      this.isPlayerTurn = false;
      const heal = skill.power;
      GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + heal, GAME_DATA.player.maxHp);
      
      this.updateMessage(`${skill.name} を行った。\nHPが ${heal} 回復した！`);
      
      // 回復エフェクト（プレイヤーが緑に光る）
      this.tweens.add({
          targets: this.playerSprite,
          tint: 0x00ff00,
          duration: 200,
          yoyo: true,
          onComplete: () => this.playerSprite.clearTint()
      });
      
      this.checkBattleEnd();
  }

  // --- 敵ターンなどは同じ ---
  triggerGuardPenalty() {
      if (this.guardBroken) return;
      this.guardBroken = true;
      this.penaltyX.setVisible(true);
      this.playerSprite.setTint(0x888888);
      this.qteText.setText("BAD TIMING").setVisible(true).setScale(1);
      this.tweens.add({ targets: this.qteText, y: this.qteText.y - 30, alpha: 0, duration: 600, onComplete: () => { this.qteText.setVisible(false); this.qteText.y += 30; this.qteText.setAlpha(1); } });
      this.cameras.main.shake(100, 0.01);
  }

  startEnemyTurn() {
    if (this.currentEnemy.hp <= 0) return;
    this.updateMessage(`${this.currentEnemy.name} が攻撃を構えた...`);
    this.qteMode = 'defense_wait';
    this.guardBroken = false;
    this.penaltyX.setVisible(false);
    this.playerSprite.clearTint();
    const delay = Phaser.Math.Between(1000, 2500);
    this.time.delayedCall(delay, () => {
        if (this.guardBroken) { this.executeDefense(false); return; }
        this.guardSignal.setVisible(true);
        this.guardMode = 'defense_active';
        this.qteMode = 'defense_active';
        this.time.delayedCall(400, () => {
            if (this.qteMode === 'defense_active') {
                this.guardSignal.setVisible(false);
                this.qteMode = null;
                this.executeDefense(false);
            }
        });
    });
  }

  resolveDefenseQTE() {
    this.guardSignal.setVisible(false);
    this.qteMode = null;
    this.qteText.setText("BLOCK!").setVisible(true).setScale(1);
    this.tweens.add({ targets: this.qteText, y: this.qteText.y - 50, alpha: 0, duration: 500, onComplete: () => { this.qteText.setVisible(false); this.qteText.setAlpha(1); this.qteText.y += 50; } });
    this.executeDefense(true);
  }

  executeDefense(success) {
    let damage = this.currentEnemy.atk;
    this.tweens.add({ targets: this.enemySprite, x: this.enemySprite.x - 50, duration: 100, yoyo: true });
    if (success) { damage = 0; this.updateMessage(`見事に見切った！\nダメージ 0！`); }
    else {
        if (this.guardBroken) this.updateMessage(`体勢が崩れている！\n${damage} のダメージ！`);
        else this.updateMessage(`直撃を受けた！\n${damage} のダメージ！`);
        GAME_DATA.player.hp -= damage;
        this.cameras.main.shake(200, 0.02);
    }
    this.refreshStatus();
    this.qteMode = null;
    if (GAME_DATA.player.hp <= 0) { GAME_DATA.player.hp = 0; this.updateMessage(`目の前が真っ暗になった... (リロード)`); }
    else { this.time.delayedCall(1500, () => { this.isPlayerTurn = true; this.mainMenu.setVisible(true); this.penaltyX.setVisible(false); this.playerSprite.clearTint(); this.updateMessage(`${GAME_DATA.player.name} のターン`); }); }
  }

  // --- 共通 ---
  checkBattleEnd() {
    this.refreshStatus();
    if (this.currentEnemy.hp <= 0) {
        this.currentEnemy.hp = 0;
        this.time.delayedCall(1000, () => this.winBattle());
    } else {
        this.time.delayedCall(1200, () => this.startEnemyTurn());
    }
  }

  startBattle() {
    this.nextBtn.setVisible(false);
    this.nextBtnText.setVisible(false);
    this.mainMenu.setVisible(true);
    const enemyData = ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)];
    this.currentEnemy = { ...enemyData };
    this.currentEnemy.maxHp = enemyData.hp;
    this.enemySprite.setTexture(this.currentEnemy.key).setVisible(true);
    this.enemyHpText.setVisible(true);
    this.enemyNameText.setText(this.currentEnemy.name).setVisible(true);
    this.updateMessage(`${this.currentEnemy.name} があらわれた！`);
    this.isPlayerTurn = true;
    this.refreshStatus();
  }

  winBattle() {
    this.enemySprite.setVisible(false);
    this.enemyHpText.setVisible(false);
    this.enemyNameText.setVisible(false);
    this.penaltyX.setVisible(false);
    this.playerSprite.clearTint();
    GAME_DATA.player.exp += this.currentEnemy.exp;
    let msg = `${this.currentEnemy.name} を倒した！\nExp +${this.currentEnemy.exp}`;
    if (this.currentEnemy.drop) { GAME_DATA.player.items.push(this.currentEnemy.drop); msg += `\n[${this.currentEnemy.drop.name}] Get!`; }
    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
        GAME_DATA.player.level++; GAME_DATA.player.maxHp += 20; GAME_DATA.player.hp = GAME_DATA.player.maxHp; GAME_DATA.player.atk += 0.5; GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
        msg += `\nLvUp! Lv${GAME_DATA.player.level}`;
    }
    this.updateMessage(msg);
    this.nextBtn.setVisible(true);
    this.nextBtnText.setVisible(true);
  }

  createTextureFromText(key, art) {
    const canvas = document.createElement('canvas'); canvas.width = art[0].length; canvas.height = art.length;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < art.length; y++) { for (let x = 0; x < art[0].length; x++) { if (PALETTE[art[y][x]]) { ctx.fillStyle = PALETTE[art[y][x]]; ctx.fillRect(x, y, 1, 1); } } }
    this.textures.addCanvas(key, canvas);
  }
  createButton(x, y, text, color, callback) {
    const btn = this.add.rectangle(x, y, 120, 50, color).setInteractive();
    this.add.text(x, y, text, { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerdown', callback);
    return btn;
  }
  createMessageBox(w, h) { this.add.rectangle(w / 2, h - 100, w - 20, 160, 0x000000).setStrokeStyle(4, 0xffffff); this.messageText = this.add.text(30, h - 160, '', { font: '18px Arial', color: '#ffffff', wordWrap: { width: w - 60 } }); }
  updateMessage(t) { this.messageText.setText(t); }
  refreshStatus() {
    this.playerNameText.setText(GAME_DATA.player.name);
    this.playerHpText.setText(`HP: ${GAME_DATA.player.hp} / ${GAME_DATA.player.maxHp}`);
    this.playerLvText.setText(`Lv: ${GAME_DATA.player.level}`);
    if(this.currentEnemy) this.enemyHpText.setText(`HP: ${Math.max(0, this.currentEnemy.hp)}`);
  }
  openItemMenu() {
      if (!this.isPlayerTurn) return;
      if (GAME_DATA.player.items.length === 0) { this.updateMessage("なし"); return; }
      const item = GAME_DATA.player.items[GAME_DATA.player.items.length - 1];
      this.updateMessage(`${item.name} を使った！`);
      if(item.type==='heal') GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + item.value, GAME_DATA.player.maxHp);
      GAME_DATA.player.items.splice(GAME_DATA.player.items.length - 1, 1);
      this.checkBattleEnd();
  }
}

const config = {
  type: Phaser.AUTO, width: 400, height: 800, backgroundColor: '#000000',
  parent: 'game-container', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BattleScene]
};
const game = new Phaser.Game(config);