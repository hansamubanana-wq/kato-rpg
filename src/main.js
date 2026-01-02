import Phaser from 'phaser';

// ----------------------------------------------------------------
// 0. ドット絵 & データ定義
// ----------------------------------------------------------------
const PALETTE = { '.':null, '0':'#000000', '1':'#ffe0c0', '2':'#ffffff', '3':'#3333cc', '4':'#ff3333', '5':'#cc0000', '6':'#8888ff', '7':'#4444aa', '8':'#228822', '9':'#ffff00' };

// アートデータ
const KATO_ART = ["......0000......",".....000000.....","....00000000....","....00000000....","....01111110....","....03111130....","....01111110....",".....222222.....","....22233222....","....22222222....","....22222222....",".....33..33.....",".....33..33.....",".....00..00....."];
const SLIME_ART = ["................","................","......6666......","....66666666....","...6667667666...","..666666666666..","..666606606666..",".66666666666666.","6666666666666666","................"];
const DRAGON_ART = [".......44.......","......4444......",".....445544.....","....44444444....","...4440000444...","..444444444444..",".444..4444..444.","44....4444....44","......4444......","......4..4......"];

// --- 全スキルデータベース ---
// type: 'attack' | 'heal'
// cost: 購買部での価格 (0なら非売品)
const SKILL_DB = [
  { id: 1, name: '出席確認', type: 'attack', power: 10, speed: 1.0, cost: 0, desc: '基本攻撃' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 20, speed: 1.2, cost: 100, desc: '少し強い投擲' },
  { id: 3, name: '小テスト', type: 'attack', power: 15, speed: 0.8, cost: 50, desc: '当てやすい' },
  { id: 4, name: '定規スラッシュ', type: 'attack', power: 35, speed: 1.5, cost: 300, desc: '強力だが難しい' },
  { id: 5, name: '難問の出題', type: 'attack', power: 50, speed: 2.0, cost: 800, desc: '超強力・超難度' },
  { id: 6, name: '公式の確認', type: 'heal', power: 40, speed: 0, cost: 200, desc: 'HP回復魔法' },
  { id: 7, name: '居残り指導', type: 'attack', power: 80, speed: 2.5, cost: 0, desc: '伝説の奥義' } // ドロップ限定
];

// --- セーブデータ（グローバル管理） ---
const GAME_DATA = {
  gold: 100, // 所持金
  player: {
    name: '加藤先生', level: 1, exp: 0, nextExp: 50,
    hp: 100, maxHp: 100, atk: 1.0,
    // 所持しているスキルのIDリスト（最初は出席確認のみ）
    ownedSkillIds: [1],
    // 装備しているスキルのIDリスト（最大6つ）
    equippedSkillIds: [1] 
  }
};

// ----------------------------------------------------------------
// 1. 共通ツール（シーン間で使う機能）
// ----------------------------------------------------------------
class BaseScene extends Phaser.Scene {
  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const canvas = document.createElement('canvas'); canvas.width = art[0].length; canvas.height = art.length;
    const ctx = canvas.getContext('2d');
    for (let y=0; y<art.length; y++) { for (let x=0; x<art[0].length; x++) { if (PALETTE[art[y][x]]) { ctx.fillStyle = PALETTE[art[y][x]]; ctx.fillRect(x,y,1,1); } } }
    this.textures.addCanvas(key, canvas);
  }
  createButton(x, y, text, color, callback) {
    const btn = this.add.rectangle(x, y, 140, 50, color).setInteractive();
    this.add.text(x, y, text, { font: '20px Arial', color: '#ffffff' }).setOrigin(0.5);
    btn.on('pointerdown', callback);
    return btn;
  }
}

// ----------------------------------------------------------------
// 2. ワールドマップ（職員室）シーン
// ----------------------------------------------------------------
class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  preload() {
    this.createTextureFromText('kato', KATO_ART);
  }
  create() {
    this.cameras.main.setBackgroundColor('#333333');
    const w = this.scale.width; const h = this.scale.height;

    // ヘッダー
    this.add.rectangle(w/2, 40, w, 80, 0x000000);
    this.add.text(20, 20, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:'20px Arial' });
    this.add.text(20, 50, `Gold: ${GAME_DATA.gold} G`, { font:'20px Arial', color:'#ffff00' });

    // キャラ表示
    this.add.sprite(w/2, h*0.3, 'kato').setScale(6);
    this.add.text(w/2, h*0.45, "「次はどうしますか？」", { font:'18px Arial' }).setOrigin(0.5);

    // メニューボタン
    this.createButton(w/2, h*0.6, '出撃する', 0xcc3333, () => this.scene.start('BattleScene'));
    this.createButton(w/2, h*0.7, '購買部 (Shop)', 0x3333cc, () => this.scene.start('ShopScene'));
    this.createButton(w/2, h*0.8, '編成 (Skills)', 0x228822, () => this.scene.start('SkillScene'));
  }
}

// ----------------------------------------------------------------
// 3. 購買部（ショップ）シーン
// ----------------------------------------------------------------
class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#222244');
    const w = this.scale.width;
    
    this.add.text(w/2, 40, `購買部 (所持金: ${GAME_DATA.gold}G)`, { font:'22px Arial' }).setOrigin(0.5);
    this.createButton(60, 40, '戻る', 0x666666, () => this.scene.start('WorldScene')).setScale(0.6);

    // 商品リスト表示
    const items = SKILL_DB.filter(s => s.cost > 0);
    let y = 100;

    items.forEach(skill => {
      const isOwned = GAME_DATA.player.ownedSkillIds.includes(skill.id);
      const bg = this.add.rectangle(w/2, y, w-40, 70, isOwned ? 0x444444 : 0x000000).setInteractive();
      
      this.add.text(40, y-20, skill.name, { font:'20px Arial', color: isOwned ? '#888888':'#ffffff'});
      this.add.text(40, y+10, skill.desc, { font:'14px Arial', color:'#aaaaaa'});
      const priceText = this.add.text(w-50, y, isOwned ? "済" : `${skill.cost}G`, { font:'20px Arial', color:'#ffff00'}).setOrigin(1, 0.5);

      bg.on('pointerdown', () => {
        if (isOwned) return;
        if (GAME_DATA.gold >= skill.cost) {
          GAME_DATA.gold -= skill.cost;
          GAME_DATA.player.ownedSkillIds.push(skill.id);
          this.scene.restart(); // 画面更新
        } else {
          priceText.setText("不足!");
          this.time.delayedCall(500, ()=> this.scene.restart());
        }
      });
      y += 80;
    });
  }
}

// ----------------------------------------------------------------
// 4. スキル編成シーン
// ----------------------------------------------------------------
class SkillScene extends BaseScene {
  constructor() { super('SkillScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#224422');
    const w = this.scale.width;
    
    this.add.text(w/2, 30, "スキル編成 (最大6つ)", {font:'22px Arial'}).setOrigin(0.5);
    this.createButton(60, 30, '完了', 0x666666, () => this.scene.start('WorldScene')).setScale(0.6);

    // --- 装備中のスキル (上部) ---
    this.add.text(20, 70, "▼ 装備中 (タップで外す)", {font:'16px Arial', color:'#88ff88'});
    let y = 100;
    GAME_DATA.player.equippedSkillIds.forEach((sid, index) => {
      const skill = SKILL_DB.find(s => s.id === sid);
      const btn = this.add.rectangle(w/2, y, w-40, 50, 0x006600).setInteractive();
      this.add.text(w/2, y, skill.name, {font:'20px Arial'}).setOrigin(0.5);
      
      btn.on('pointerdown', () => {
        // 外す処理 (最低1つは残す)
        if (GAME_DATA.player.equippedSkillIds.length <= 1) return;
        GAME_DATA.player.equippedSkillIds.splice(index, 1);
        this.scene.restart();
      });
      y += 60;
    });

    // --- 所持しているスキル (下部) ---
    y += 20;
    this.add.text(20, y, "▼ 所持リスト (タップで装備)", {font:'16px Arial', color:'#ffff88'});
    y += 30;
    
    GAME_DATA.player.ownedSkillIds.forEach(sid => {
      // 既に装備しているものは表示しない
      if (GAME_DATA.player.equippedSkillIds.includes(sid)) return;

      const skill = SKILL_DB.find(s => s.id === sid);
      const btn = this.add.rectangle(w/2, y, w-40, 50, 0x444444).setInteractive();
      this.add.text(w/2, y, skill.name, {font:'20px Arial'}).setOrigin(0.5);

      btn.on('pointerdown', () => {
        // 装備処理 (最大6つ)
        if (GAME_DATA.player.equippedSkillIds.length >= 6) return;
        GAME_DATA.player.equippedSkillIds.push(sid);
        this.scene.restart();
      });
      y += 60;
    });
  }
}

// ----------------------------------------------------------------
// 5. バトルシーン（前回の改良版）
// ----------------------------------------------------------------
const ENEMY_LIST = [
  { name: '数式スライム', hp: 50, atk: 8, exp: 10, gold: 20, key: 'slime' },
  { name: '赤点ドラゴン', hp: 200, atk: 20, exp: 100, gold: 150, key: 'dragon' }
];

class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  preload() {
    this.createTextureFromText('kato', KATO_ART);
    this.createTextureFromText('slime', SLIME_ART);
    this.createTextureFromText('dragon', DRAGON_ART);
  }
  create() {
    this.cameras.main.setBackgroundColor('#222222');
    const w = this.scale.width; const h = this.scale.height;

    // キャラ・UI
    this.playerSprite = this.add.sprite(w*0.25, h*0.6, 'kato').setScale(5);
    this.enemySprite = this.add.sprite(w*0.75, h*0.4, 'slime').setScale(5);
    this.createMessageBox(w, h);
    
    // QTEパーツ
    this.qteTarget = this.add.graphics().setDepth(100);
    this.qteRing = this.add.graphics().setDepth(100);
    this.qteText = this.add.text(w/2, h/2-100, '', {font:'40px Arial', color:'#ffff00', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setDepth(101);
    this.guardSignal = this.add.text(w/2, h/2, '！', {font:'80px Arial', color:'#ff0000', stroke:'#fff', strokeThickness:6}).setOrigin(0.5).setVisible(false).setDepth(101);
    this.penaltyX = this.add.text(w*0.25, h*0.6, '×', {font:'80px Arial', color:'#ff0000', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setVisible(false).setDepth(200);

    // メニュー関連
    this.mainMenu = this.add.group();
    this.mainMenu.add(this.createButton(w-100, h-250, 'コマンド', 0xcc3333, () => this.openSkillMenu()));
    this.mainMenu.add(this.createButton(w-100, h-180, '逃げる', 0x666666, () => this.scene.start('WorldScene'))); // 逃げる＝ワールドへ

    // スキルメニュー作成 (装備中のスキルから生成)
    this.createSkillMenu(w, h);

    this.input.on('pointerdown', () => this.handleInput());
    this.startBattle();
  }

  createSkillMenu(w, h) {
    this.skillMenu = this.add.container(0, h-300).setVisible(false).setDepth(50);
    this.skillMenu.add(this.add.rectangle(w/2, 150, w, 300, 0x000000, 0.9));
    
    // 装備中のIDからスキルデータを取得
    const equipped = GAME_DATA.player.equippedSkillIds.map(id => SKILL_DB.find(s => s.id === id));

    equipped.forEach((skill, index) => {
        const col = index % 2; const row = Math.floor(index / 2);
        const x = w * 0.25 + col * (w * 0.5); const y = 60 + row * 80;
        const color = skill.type === 'heal' ? 0x228822 : 0x882222;
        
        const btn = this.add.rectangle(x, y, 160, 60, color).setInteractive();
        const text = this.add.text(x, y, skill.name, { font:'18px Arial' }).setOrigin(0.5);
        btn.on('pointerdown', () => { this.input.stopPropagation(); this.selectSkill(skill); });
        this.skillMenu.add([btn, text]);
    });
    
    // 戻るボタン
    const backBtn = this.add.rectangle(w/2, 280, 100, 40, 0x555555).setInteractive();
    backBtn.on('pointerdown', () => { this.input.stopPropagation(); this.skillMenu.setVisible(false); this.mainMenu.setVisible(true); });
    this.skillMenu.add([backBtn, this.add.text(w/2, 280, '戻る').setOrigin(0.5)]);
  }

  // --- バトルロジック ---
  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) this.resolveAttackQTE();
    else if (this.qteMode === 'defense_wait') this.triggerGuardPenalty();
    else if (this.qteMode === 'defense_active') this.resolveDefenseQTE();
  }

  startBattle() {
    const enemyData = ENEMY_LIST[Math.floor(Math.random() * ENEMY_LIST.length)];
    this.currentEnemy = { ...enemyData, maxHp: enemyData.hp };
    
    this.enemySprite.setTexture(this.currentEnemy.key).setVisible(true);
    this.updateMessage(`${this.currentEnemy.name} があらわれた！`);
    
    this.isPlayerTurn = true;
    this.qteMode = null; this.qteActive = false; this.guardBroken = false;
    this.mainMenu.setVisible(true);
    this.skillMenu.setVisible(false);
  }

  openSkillMenu() { if(this.isPlayerTurn) { this.mainMenu.setVisible(false); this.skillMenu.setVisible(true); this.updateMessage("行動を選択"); } }

  selectSkill(skill) {
    this.skillMenu.setVisible(false);
    this.selectedSkill = skill;
    if (skill.type === 'heal') this.executeHeal(skill);
    else this.startAttackQTE(skill);
  }

  startAttackQTE(skill) {
    this.isPlayerTurn = false;
    this.updateMessage(`${skill.name}！\nタイミング！`);
    const tx = this.enemySprite.x; const ty = this.enemySprite.y;
    this.qteTarget.clear().lineStyle(4, 0xffffff).strokeCircle(tx, ty, 50).setVisible(true);
    this.qteRing.clear(); this.qteRingScale = 2.5; this.qteMode = 'attack';
    
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qteEvent = this.time.addEvent({ delay: 16, loop: true, callback: () => {
            if (!this.qteActive) return;
            this.qteRingScale -= (0.03 * skill.speed);
            this.qteRing.clear().lineStyle(4, 0xffff00).strokeCircle(tx, ty, 50 * this.qteRingScale);
            if (this.qteRingScale <= 0.5) this.finishQTE('MISS');
        }});
    });
  }

  resolveAttackQTE() {
    this.qteActive = false; this.qteEvent.remove();
    this.qteRing.clear(); this.qteTarget.clear();
    const diff = Math.abs(this.qteRingScale - 1.0);
    if (diff < 0.15) this.finishQTE('PERFECT'); else if (diff < 0.4) this.finishQTE('GOOD'); else this.finishQTE('BAD');
  }

  finishQTE(res) {
    this.qteText.setText(res).setVisible(true).setScale(0);
    this.tweens.add({ targets: this.qteText, scale:1.5, duration:300, yoyo:true, onComplete:()=>{
        this.qteText.setVisible(false);
        this.executeAttack(res);
    }});
  }

  executeAttack(rank) {
    let dmg = this.selectedSkill.power * GAME_DATA.player.atk;
    if (rank==='PERFECT') dmg = Math.floor(dmg*1.5); else if (rank==='BAD'||rank==='MISS') dmg = Math.floor(dmg*0.5);
    this.currentEnemy.hp -= dmg;
    this.updateMessage(`${dmg} ダメージ！`);
    this.tweens.add({targets:this.playerSprite, x:this.playerSprite.x+50, duration:100, yoyo:true});
    this.checkEnd();
  }

  executeHeal(skill) {
    this.isPlayerTurn = false;
    const heal = skill.power;
    GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + heal, GAME_DATA.player.maxHp);
    this.updateMessage(`${skill.name}！ HP${heal}回復`);
    this.tweens.add({targets:this.playerSprite, tint:0x00ff00, duration:200, yoyo:true, onComplete:()=>this.playerSprite.clearTint()});
    this.checkEnd();
  }

  checkEnd() {
    if (this.currentEnemy.hp <= 0) this.winBattle();
    else this.time.delayedCall(1000, () => this.startEnemyTurn());
  }

  // --- 敵ターン (QTE) ---
  triggerGuardPenalty() {
    if (this.guardBroken) return;
    this.guardBroken = true;
    this.penaltyX.setVisible(true);
    this.playerSprite.setTint(0x888888);
    this.cameras.main.shake(100, 0.01);
  }

  startEnemyTurn() {
    this.updateMessage(`${this.currentEnemy.name} の構え...`);
    this.qteMode = 'defense_wait'; this.guardBroken = false;
    this.penaltyX.setVisible(false); this.playerSprite.clearTint();
    this.time.delayedCall(Phaser.Math.Between(1000, 2500), () => {
        if (this.guardBroken) { this.executeDefense(false); return; }
        this.guardSignal.setVisible(true); this.qteMode = 'defense_active';
        this.time.delayedCall(400, () => { if(this.qteMode==='defense_active') { this.guardSignal.setVisible(false); this.executeDefense(false); } });
    });
  }

  resolveDefenseQTE() {
    this.guardSignal.setVisible(false); this.qteMode = null;
    this.qteText.setText("BLOCK!").setVisible(true).setScale(1);
    this.tweens.add({targets:this.qteText, y:this.qteText.y-50, alpha:0, duration:500, onComplete:()=>{this.qteText.setVisible(false); this.qteText.setAlpha(1); this.qteText.y+=50;}});
    this.executeDefense(true);
  }

  executeDefense(success) {
    let dmg = this.currentEnemy.atk;
    if (success) { dmg = 0; this.updateMessage("ガード成功！"); }
    else { this.updateMessage(`${dmg} のダメージ！`); GAME_DATA.player.hp -= dmg; this.cameras.main.shake(200, 0.02); }
    
    this.qteMode = null;
    if (GAME_DATA.player.hp <= 0) {
        this.updateMessage("敗北... (クリックで戻る)");
        this.input.once('pointerdown', () => {
             GAME_DATA.player.hp = GAME_DATA.player.maxHp; // 復活
             this.scene.start('WorldScene');
        });
    } else {
        this.time.delayedCall(1000, () => {
            this.isPlayerTurn = true; this.mainMenu.setVisible(true); this.penaltyX.setVisible(false); this.playerSprite.clearTint();
            this.updateMessage("ターン開始");
        });
    }
  }

  winBattle() {
    GAME_DATA.gold += this.currentEnemy.gold;
    GAME_DATA.player.exp += this.currentEnemy.exp;
    
    // レアドロップ判定 (20%でスキル「居残り指導」ゲット)
    let dropMsg = "";
    if (Math.random() < 0.2 && !GAME_DATA.player.ownedSkillIds.includes(7)) {
        GAME_DATA.player.ownedSkillIds.push(7);
        dropMsg = "\nレア技【居残り指導】習得！";
    }

    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
        GAME_DATA.player.level++; GAME_DATA.player.maxHp+=10; GAME_DATA.player.hp = GAME_DATA.player.maxHp;
        GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
        dropMsg += "\nレベルアップ！";
    }

    this.updateMessage(`勝利！ ${this.currentEnemy.gold}G 獲得${dropMsg}\n(クリックで戻る)`);
    this.mainMenu.setVisible(false);
    this.input.once('pointerdown', () => this.scene.start('WorldScene'));
  }

  // ツール
  createMessageBox(w, h) { this.add.rectangle(w/2, h-100, w-20, 160, 0x000000).setStrokeStyle(4, 0xffffff); this.messageText = this.add.text(30, h-160, '', {font:'18px Arial', wordWrap:{width:w-60}}); }
  updateMessage(t) { this.messageText.setText(t); }
}

const config = {
  type: Phaser.AUTO, width: 400, height: 800, backgroundColor: '#000000',
  parent: 'game-container', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene, ShopScene, SkillScene, BattleScene]
};

new Phaser.Game(config);