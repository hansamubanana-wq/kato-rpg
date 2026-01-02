import Phaser from 'phaser';

// ================================================================
//  設定エリア：ここを変えるとゲームバランスや敵が変わります
// ================================================================

// 1. ドット絵パレット (色定義)
const P = {
  '.': null,      // 透明
  '0': '#000000', // 黒 (輪郭)
  '1': '#ffe0c0', // 肌色
  '2': '#ffffff', // 白 (シャツ・白目)
  '3': '#222288', // 紺 (土蔵セーター・青田ジャケット)
  '4': '#ffcccc', // ピンク (松田先生の化粧)
  '5': '#cc0000', // 赤 (口・攻撃色)
  '6': '#442200', // 茶 (北井・金月の髪)
  '7': '#333333', // グレー/黒ジャージ
  '8': '#aaaaaa', // 前田の服
  '9': '#ffff00'  // 金色
};

// 2. キャラクタースプライト (16x14)
const ARTS = {
  // 主人公：加藤先生
  kato: [
    "......0000......",".....000000.....","....00000000....","....00000000....","....01111110....","....03111130....","....01111110....",".....222222.....","....22233222....","....22222222....","....22222222....",".....33..33.....",".....33..33.....",".....00..00....."
  ],
  // 1. 土蔵 (紺セーター・高身長)
  dozo: [
    "......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","...333333333....","...333333333....","...333333333....","...333333333....","....3333333.....","....77...77.....","....77...77.....","....00...00....."
  ],
  // 2. 前田 (普通の男子)
  maeda: [
    "......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....",".....888888.....","....88888888....","....88888888....","....88888888....","....77777777....","....77....77....","....77....77....","....00....00...."
  ],
  // 3. 松田先生 (化粧・やや太め)
  matsuda: [
    ".....000000.....","....00000000....","...000000000....","...011111110....","...010110110....","...041111140....","...011151110....","...444444444....","..44444444444...","..44444444444...","..44444444444...","...333...333....","...333...333....","...000...000...."
  ],
  // 4. 北井先生 (茶髪ボブ)
  kitai: [
    ".....666666.....","....66666666....","...666666666....","...661111166....","...661010166....","...661111166....","...661111166....","....2222222.....","...222222222....","...222222222....","....7777777.....","....77...77.....","....77...77.....","....00...00....."
  ],
  // 5. 福盛田先生 (ナイキジャージ)
  fukumorita: [
    "......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","....7777777.....","...777777777....","...777222777....","...777777777....","...777777777....","....77...77.....","....77...77.....","....22...22....."
  ],
  // 6. 青田校長 (青ジャケット・ツーブロック)
  aota: [
    "......0000......",".....000000.....","....00....00....","....01111110....","....01011010....","....01111110....",".....223322.....","....33333333....","....33333333....","....33333333....","....77777777....","....77....77....","....77....77....","....00....00...."
  ],
  // 7. 金月 (裏ボス・センター分け・太め)
  kingetsu: [
    ".....66..66.....","....666..666....","...6666..6666...","...6111111116...","...6101111016...","...6111111116...","...6111111116...","...2222222222...","..222222222222..","..222222222222..","..777777777777..","...777....777...","...777....777...","...000....000..."
  ]
};

// 3. ステージ構成（敵リスト）
// ここに追加すれば敵を増やせます
const STAGES = [
  { id: 0, name: '土蔵', hp: 30, atk: 5, exp: 10, gold: 50, key: 'dozo', msg: '「身長なら負けませんよ」' },
  { id: 1, name: '前田', hp: 50, atk: 8, exp: 20, gold: 80, key: 'maeda', msg: '「普通の攻撃しかしてこないぞ」' },
  { id: 2, name: '松田先生', hp: 80, atk: 12, exp: 40, gold: 120, key: 'matsuda', msg: '「あら、補習かしら？」' },
  { id: 3, name: '北井先生', hp: 120, atk: 15, exp: 60, gold: 150, key: 'kitai', msg: '「宿題は終わったの？」' },
  { id: 4, name: '福盛田先生', hp: 160, atk: 18, exp: 80, gold: 200, key: 'fukumorita', msg: '「気合いだー！」' },
  { id: 5, name: '青田校長', hp: 300, atk: 25, exp: 200, gold: 500, key: 'aota', msg: '「私が相手になろう」' }, // ボス
  { id: 6, name: '金月', hp: 500, atk: 40, exp: 500, gold: 999, key: 'kingetsu', msg: '「……(無言の圧力)」' } // 裏ボス
];

// 4. スキルショップ
const SKILL_DB = [
  { id: 1, name: '出席確認', type: 'attack', power: 10, speed: 1.0, cost: 0, desc: '基本攻撃' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 25, speed: 1.2, cost: 100, desc: '威力中・速度中' },
  { id: 3, name: '小テスト', type: 'attack', power: 15, speed: 0.7, cost: 50, desc: '威力小・当てやすい' },
  { id: 4, name: '定規ソード', type: 'attack', power: 45, speed: 1.6, cost: 300, desc: '威力大・難しい' },
  { id: 5, name: '難問の出題', type: 'attack', power: 70, speed: 2.2, cost: 800, desc: '超威力・激ムズ' },
  { id: 6, name: '公式の確認', type: 'heal', power: 50, speed: 0, cost: 200, desc: 'HP回復魔法' },
  { id: 7, name: '居残り指導', type: 'attack', power: 100, speed: 2.5, cost: 0, desc: 'ドロップ限定奥義' }
];

// ================================================================
//  ゲームシステム（ここから下はいじらなくてOK）
// ================================================================

const GAME_DATA = {
  gold: 0,
  stageIndex: 0, // 現在のステージ進行度
  player: {
    name: '加藤先生', level: 1, exp: 0, nextExp: 50,
    hp: 100, maxHp: 100, atk: 1.0,
    ownedSkillIds: [1],
    equippedSkillIds: [1] 
  }
};

class BaseScene extends Phaser.Scene {
  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const cvs = document.createElement('canvas'); cvs.width = art[0].length; cvs.height = art.length;
    const ctx = cvs.getContext('2d');
    for (let y=0; y<art.length; y++) for (let x=0; x<art[0].length; x++) if (P[art[y][x]]) { ctx.fillStyle = P[art[y][x]]; ctx.fillRect(x,y,1,1); }
    this.textures.addCanvas(key, cvs);
  }
  createButton(x, y, text, color, cb) {
    const btn = this.add.rectangle(x, y, 160, 50, color).setInteractive();
    this.add.text(x, y, text, { font: '20px Arial', color: '#fff' }).setOrigin(0.5);
    btn.on('pointerdown', cb);
    return btn;
  }
}

// --- 職員室 (ワールド) ---
class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  preload() {
    Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k]));
  }
  create() {
    this.cameras.main.setBackgroundColor('#333333');
    const w = this.scale.width; const h = this.scale.height;

    // ヘッダー
    this.add.rectangle(w/2, 40, w, 80, 0x000000);
    this.add.text(20, 20, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:'20px Arial' });
    this.add.text(20, 50, `Gold: ${GAME_DATA.gold} G`, { font:'20px Arial', color:'#ffff00' });

    // 次の敵情報
    let nextEnemy = STAGES[GAME_DATA.stageIndex];
    if (!nextEnemy) nextEnemy = STAGES[STAGES.length - 1]; // クリア後は裏ボスループ

    this.add.sprite(w/2, h*0.3, 'kato').setScale(6);
    this.add.text(w/2, h*0.45, "「次はどうしますか？」", { font:'18px Arial' }).setOrigin(0.5);

    // ボタン
    const stageName = (GAME_DATA.stageIndex >= STAGES.length) ? "裏ボス周回" : `Stage ${GAME_DATA.stageIndex+1}: ${nextEnemy.name}`;
    this.createButton(w/2, h*0.6, '出撃する', 0xcc3333, () => this.scene.start('BattleScene'));
    this.add.text(w/2, h*0.6 + 35, `(${stageName})`, {font:'14px Arial', color:'#aaaaaa'}).setOrigin(0.5);

    this.createButton(w/2, h*0.75, '購買部 (Shop)', 0x3333cc, () => this.scene.start('ShopScene'));
    this.createButton(w/2, h*0.85, 'スキル編成', 0x228822, () => this.scene.start('SkillScene'));
  }
}

// --- 購買部 ---
class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#222244');
    const w = this.scale.width;
    this.add.text(w/2, 40, `所持金: ${GAME_DATA.gold} G`, { font:'22px Arial' }).setOrigin(0.5);
    this.createButton(80, 40, '戻る', 0x555555, () => this.scene.start('WorldScene')).setScale(0.6);

    let y = 100;
    SKILL_DB.filter(s => s.cost > 0).forEach(skill => {
      const isOwned = GAME_DATA.player.ownedSkillIds.includes(skill.id);
      const bg = this.add.rectangle(w/2, y, w-40, 70, isOwned ? 0x444444 : 0x000000).setInteractive();
      this.add.text(40, y-20, skill.name, { font:'20px Arial', color: isOwned ? '#888' : '#fff'});
      this.add.text(40, y+10, skill.desc, { font:'14px Arial', color:'#aaa'});
      const price = this.add.text(w-50, y, isOwned?"済":`${skill.cost}G`, { font:'20px Arial', color:'#ff0'}).setOrigin(1, 0.5);
      
      bg.on('pointerdown', () => {
        if (isOwned) return;
        if (GAME_DATA.gold >= skill.cost) {
          GAME_DATA.gold -= skill.cost;
          GAME_DATA.player.ownedSkillIds.push(skill.id);
          this.scene.restart();
        } else {
          price.setText("不足!"); this.time.delayedCall(500, ()=>this.scene.restart());
        }
      });
      y += 80;
    });
  }
}

// --- スキル編成 ---
class SkillScene extends BaseScene {
  constructor() { super('SkillScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#224422');
    const w = this.scale.width;
    this.add.text(w/2, 30, "スキル編成 (最大6つ)", {font:'22px Arial'}).setOrigin(0.5);
    this.createButton(80, 30, '完了', 0x555555, () => this.scene.start('WorldScene')).setScale(0.6);

    this.add.text(20, 70, "▼ 装備中 (タップで外す)", {font:'16px Arial', color:'#8f8'});
    let y = 100;
    GAME_DATA.player.equippedSkillIds.forEach((sid, idx) => {
      const s = SKILL_DB.find(x => x.id === sid);
      const btn = this.add.rectangle(w/2, y, w-40, 50, 0x006600).setInteractive();
      this.add.text(w/2, y, s.name, {font:'20px Arial'}).setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (GAME_DATA.player.equippedSkillIds.length <= 1) return;
        GAME_DATA.player.equippedSkillIds.splice(idx, 1);
        this.scene.restart();
      });
      y += 60;
    });

    y += 20;
    this.add.text(20, y, "▼ 所持リスト (タップで装備)", {font:'16px Arial', color:'#ff8'});
    y += 30;
    GAME_DATA.player.ownedSkillIds.forEach(sid => {
      if (GAME_DATA.player.equippedSkillIds.includes(sid)) return;
      const s = SKILL_DB.find(x => x.id === sid);
      const btn = this.add.rectangle(w/2, y, w-40, 50, 0x444444).setInteractive();
      this.add.text(w/2, y, s.name, {font:'20px Arial'}).setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (GAME_DATA.player.equippedSkillIds.length >= 6) return;
        GAME_DATA.player.equippedSkillIds.push(sid);
        this.scene.restart();
      });
      y += 60;
    });
  }
}

// --- バトル ---
class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  create() {
    this.cameras.main.setBackgroundColor('#222222');
    const w = this.scale.width; const h = this.scale.height;

    // 敵データ取得
    const stageIdx = Math.min(GAME_DATA.stageIndex, STAGES.length - 1);
    this.enemyData = { ...STAGES[stageIdx], maxHp: STAGES[stageIdx].hp };

    // スプライト
    this.playerSprite = this.add.sprite(w*0.25, h*0.6, 'kato').setScale(5);
    this.enemySprite = this.add.sprite(w*0.75, h*0.4, this.enemyData.key).setScale(5); // キーに対応する画像を表示

    // QTEパーツ
    this.qteTarget = this.add.graphics().setDepth(100);
    this.qteRing = this.add.graphics().setDepth(100);
    this.qteText = this.add.text(w/2, h/2-100, '', {font:'40px Arial', color:'#ff0', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setDepth(101);
    this.guardSignal = this.add.text(w/2, h/2, '！', {font:'80px Arial', color:'#f00', stroke:'#fff', strokeThickness:6}).setOrigin(0.5).setVisible(false).setDepth(101);
    this.penaltyX = this.add.text(w*0.25, h*0.6, '×', {font:'80px Arial', color:'#f00', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setVisible(false).setDepth(200);

    // UI
    this.createMessageBox(w, h);
    this.mainMenu = this.add.group();
    this.mainMenu.add(this.createButton(w-100, h-250, 'コマンド', 0xcc3333, () => this.openSkillMenu()));
    this.mainMenu.add(this.createButton(w-100, h-180, '逃げる', 0x555555, () => this.scene.start('WorldScene')));
    this.createSkillMenu(w, h);

    this.input.on('pointerdown', () => this.handleInput());
    
    // 開幕メッセージ
    this.updateMessage(`${this.enemyData.name} があらわれた！\n${this.enemyData.msg}`);
    this.isPlayerTurn = true;
    this.qteMode = null; this.qteActive = false; this.guardBroken = false;
  }

  // スキルメニュー
  createSkillMenu(w, h) {
    this.skillMenu = this.add.container(0, h-300).setVisible(false).setDepth(50);
    this.skillMenu.add(this.add.rectangle(w/2, 150, w, 300, 0x000000, 0.9));
    const equipped = GAME_DATA.player.equippedSkillIds.map(id => SKILL_DB.find(s => s.id === id));
    equipped.forEach((s, i) => {
        const x = w * 0.25 + (i%2) * (w*0.5); const y = 60 + Math.floor(i/2) * 80;
        const btn = this.add.rectangle(x, y, 160, 60, s.type==='heal'?0x282:0x822).setInteractive();
        const txt = this.add.text(x, y, s.name, {font:'18px Arial'}).setOrigin(0.5);
        btn.on('pointerdown', () => { this.input.stopPropagation(); this.selectSkill(s); });
        this.skillMenu.add([btn, txt]);
    });
    const backBtn = this.add.rectangle(w/2, 280, 100, 40, 0x555).setInteractive();
    backBtn.on('pointerdown', () => { this.input.stopPropagation(); this.skillMenu.setVisible(false); this.mainMenu.setVisible(true); });
    this.skillMenu.add([backBtn, this.add.text(w/2, 280, '戻る').setOrigin(0.5)]);
  }

  // 入力処理
  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) this.resolveAttackQTE();
    else if (this.qteMode === 'defense_wait') this.triggerGuardPenalty();
    else if (this.qteMode === 'defense_active') this.resolveDefenseQTE();
  }

  openSkillMenu() { if(this.isPlayerTurn) { this.mainMenu.setVisible(false); this.skillMenu.setVisible(true); this.updateMessage("行動を選択"); } }
  selectSkill(s) { this.skillMenu.setVisible(false); this.selectedSkill = s; if (s.type === 'heal') this.executeHeal(s); else this.startAttackQTE(s); }

  // 攻撃QTE
  startAttackQTE(s) {
    this.isPlayerTurn = false; this.updateMessage(`${s.name}！\nタイミング！`);
    const tx = this.enemySprite.x; const ty = this.enemySprite.y;
    this.qteTarget.clear().lineStyle(4, 0xffffff).strokeCircle(tx, ty, 50).setVisible(true);
    this.qteRing.clear(); this.qteRingScale = 2.5; this.qteMode = 'attack';
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qteEvent = this.time.addEvent({ delay: 16, loop: true, callback: () => {
            if (!this.qteActive) return;
            this.qteRingScale -= (0.03 * s.speed);
            this.qteRing.clear().lineStyle(4, 0xff0).strokeCircle(tx, ty, 50 * this.qteRingScale);
            if (this.qteRingScale <= 0.5) this.finishQTE('MISS');
        }});
    });
  }
  resolveAttackQTE() {
    this.qteActive = false; this.qteEvent.remove(); this.qteRing.clear(); this.qteTarget.clear();
    const d = Math.abs(this.qteRingScale - 1.0);
    if (d < 0.15) this.finishQTE('PERFECT'); else if (d < 0.4) this.finishQTE('GOOD'); else this.finishQTE('BAD');
  }
  finishQTE(res) {
    this.qteText.setText(res).setVisible(true).setScale(0);
    this.tweens.add({ targets: this.qteText, scale:1.5, duration:300, yoyo:true, onComplete:()=>{ this.qteText.setVisible(false); this.executeAttack(res); }});
  }
  executeAttack(res) {
    let dmg = this.selectedSkill.power * GAME_DATA.player.atk;
    if (res==='PERFECT') dmg = Math.floor(dmg*1.5); else if (res!=='GOOD') dmg = Math.floor(dmg*0.5);
    this.enemyData.hp -= dmg;
    this.updateMessage(`${dmg} ダメージ！`);
    this.tweens.add({targets:this.playerSprite, x:this.playerSprite.x+50, duration:100, yoyo:true});
    this.checkEnd();
  }
  executeHeal(s) {
    this.isPlayerTurn = false; const h = s.power;
    GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + h, GAME_DATA.player.maxHp);
    this.updateMessage(`HP ${h} 回復`);
    this.tweens.add({targets:this.playerSprite, tint:0x0f0, duration:200, yoyo:true, onComplete:()=>this.playerSprite.clearTint()});
    this.checkEnd();
  }
  checkEnd() {
    if (this.enemyData.hp <= 0) this.winBattle();
    else this.time.delayedCall(1000, () => this.startEnemyTurn());
  }

  // 防御QTE
  triggerGuardPenalty() {
    if (this.guardBroken) return;
    this.guardBroken = true; this.penaltyX.setVisible(true); this.playerSprite.setTint(0x888); this.cameras.main.shake(100,0.01);
  }
  startEnemyTurn() {
    this.updateMessage(`${this.enemyData.name} の構え...`);
    this.qteMode = 'defense_wait'; this.guardBroken = false; this.penaltyX.setVisible(false); this.playerSprite.clearTint();
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
  executeDefense(suc) {
    let dmg = this.enemyData.atk;
    if (suc) { dmg = 0; this.updateMessage("ガード成功！"); }
    else { this.updateMessage(`${dmg} のダメージ！`); GAME_DATA.player.hp -= dmg; this.cameras.main.shake(200, 0.02); }
    this.qteMode = null;
    if (GAME_DATA.player.hp <= 0) {
        this.updateMessage("敗北... (クリックで戻る)");
        this.input.once('pointerdown', () => { GAME_DATA.player.hp=GAME_DATA.player.maxHp; this.scene.start('WorldScene'); });
    } else {
        this.time.delayedCall(1000, () => { this.isPlayerTurn = true; this.mainMenu.setVisible(true); this.penaltyX.setVisible(false); this.playerSprite.clearTint(); this.updateMessage("ターン開始"); });
    }
  }

  winBattle() {
    GAME_DATA.gold += this.enemyData.gold;
    GAME_DATA.player.exp += this.enemyData.exp;
    GAME_DATA.stageIndex++; // ステージを進める

    let msg = `勝利！\n${this.enemyData.gold}G 獲得`;
    // レアドロップ: 裏ボス以外でも低確率で
    if (Math.random() < 0.2 && !GAME_DATA.player.ownedSkillIds.includes(7)) {
        GAME_DATA.player.ownedSkillIds.push(7); msg += "\nレア技【居残り指導】習得！";
    }
    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
        GAME_DATA.player.level++; GAME_DATA.player.maxHp+=20; GAME_DATA.player.hp = GAME_DATA.player.maxHp; GAME_DATA.player.atk += 0.2;
        GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
        msg += "\nレベルアップ！";
    }
    this.updateMessage(msg + "\n(クリックで次へ)");
    this.mainMenu.setVisible(false);
    this.input.once('pointerdown', () => this.scene.start('WorldScene'));
  }

  createMessageBox(w, h) { this.add.rectangle(w/2, h-100, w-20, 160, 0x000).setStrokeStyle(4, 0xfff); this.messageText = this.add.text(30, h-160, '', {font:'18px Arial', wordWrap:{width:w-60}}); }
  updateMessage(t) { this.messageText.setText(t); }
}

const config = {
  type: Phaser.AUTO, width: 400, height: 800, backgroundColor: '#000000',
  parent: 'game-container', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene, ShopScene, SkillScene, BattleScene]
};
new Phaser.Game(config);