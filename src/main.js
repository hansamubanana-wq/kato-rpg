import Phaser from 'phaser';

// ================================================================
//  0. フォント読み込み
// ================================================================
const fontStyle = document.createElement('style');
fontStyle.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
  body { font-family: 'DotGothic16', sans-serif; }
`;
document.head.appendChild(fontStyle);
const GAME_FONT = 'DotGothic16';

// ================================================================
//  1. データ定義
// ================================================================
const P = { '.':null, '0':'#000', '1':'#ffe0c0', '2':'#fff', '3':'#228', '4':'#fcc', '5':'#c00', '6':'#420', '7':'#333', '8':'#aaa', '9':'#ff0' };
const ARTS = {
  kato: ["......0000......",".....000000.....","....00000000....","....00000000....","....01111110....","....03111130....","....01111110....",".....222222.....","....22233222....","....22222222....","....22222222....",".....33..33.....",".....33..33.....",".....00..00....."],
  dozo: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","...333333333....","...333333333....","...333333333....","...333333333....","....3333333.....","....77...77.....","....77...77.....","....00...00....."],
  maeda: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....",".....888888.....","....88888888....","....88888888....","....88888888....","....77777777....","....77....77....","....77....77....","....00....00...."],
  matsuda: [".....000000.....","....00000000....","...000000000....","...011111110....","...010110110....","...041111140....","...011151110....","...444444444....","..44444444444...","..44444444444...","..44444444444...","...333...333....","...333...333....","...000...000...."],
  kitai: [".....666666.....","....66666666....","...666666666....","...661111166....","...661010166....","...661111166....","...661111166....","....2222222.....","...222222222....","...222222222....","....7777777.....","....77...77.....","....77...77.....","....00...00....."],
  fukumorita: ["......0000......",".....000000.....","....00000000....","....01111110....","....01011010....","....01111110....","....7777777.....","...777777777....","...777222777....","...777777777....","...777777777....","....77...77.....","....77...77.....","....22...22....."],
  aota: ["......0000......",".....000000.....","....00....00....","....01111110....","....01011010....","....01111110....",".....223322.....","....33333333....","....33333333....","....33333333....","....77777777....","....77....77....","....77....77....","....00....00...."],
  kingetsu: [".....66..66.....","....666..666....","...6666..6666...","...6111111116...","...6101111016...","...6111111116...","...6111111116...","...2222222222...","..222222222222..","..222222222222..","..777777777777..","...777....777...","...777....777...","...000....000..."]
};
const STAGES = [
  { id: 0, name: '土蔵', hp: 30, atk: 5, exp: 10, gold: 50, key: 'dozo' },
  { id: 1, name: '前田', hp: 50, atk: 8, exp: 20, gold: 80, key: 'maeda' },
  { id: 2, name: '松田先生', hp: 80, atk: 12, exp: 40, gold: 120, key: 'matsuda' },
  { id: 3, name: '北井先生', hp: 120, atk: 15, exp: 60, gold: 150, key: 'kitai' },
  { id: 4, name: '福盛田先生', hp: 160, atk: 18, exp: 80, gold: 200, key: 'fukumorita' },
  { id: 5, name: '青田校長', hp: 300, atk: 25, exp: 200, gold: 500, key: 'aota' },
  { id: 6, name: '金月', hp: 500, atk: 40, exp: 500, gold: 999, key: 'kingetsu' }
];
const SKILL_DB = [
  { id: 1, name: '出席確認', type: 'attack', power: 10, speed: 1.0, cost: 0, desc: '基本攻撃' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 25, speed: 1.2, cost: 100, desc: '威力中・速度中' },
  { id: 3, name: '小テスト', type: 'attack', power: 15, speed: 0.7, cost: 50, desc: '威力小・当てやすい' },
  { id: 4, name: '定規ソード', type: 'attack', power: 45, speed: 1.6, cost: 300, desc: '威力大・難しい' },
  { id: 5, name: '難問の出題', type: 'attack', power: 70, speed: 2.2, cost: 800, desc: '超威力・激ムズ' },
  { id: 6, name: '公式の確認', type: 'heal', power: 50, speed: 0, cost: 200, desc: 'HP回復魔法' },
  { id: 7, name: '居残り指導', type: 'attack', power: 100, speed: 2.5, cost: 0, desc: 'ドロップ限定奥義' }
];
const GAME_DATA = {
  gold: 0,
  stageIndex: 0,
  player: {
    name: '加藤先生', level: 1, exp: 0, nextExp: 50,
    hp: 100, maxHp: 100, atk: 1.0,
    ownedSkillIds: [1],
    equippedSkillIds: [1]
  }
};

// ================================================================
//  2. 共通UIシステム
// ================================================================
class BaseScene extends Phaser.Scene {
  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const cvs = document.createElement('canvas'); cvs.width = art[0].length; cvs.height = art.length;
    const ctx = cvs.getContext('2d');
    for (let y=0; y<art.length; y++) for (let x=0; x<art[0].length; x++) if (P[art[y][x]]) { ctx.fillStyle = P[art[y][x]]; ctx.fillRect(x,y,1,1); }
    this.textures.addCanvas(key, cvs);
  }

  createPatternBackground(color1, color2) {
    const w = this.scale.width;
    const h = this.scale.height;
    const bg = this.add.graphics();
    bg.fillStyle(color1, 1);
    bg.fillRect(0, 0, w, h);
    bg.fillStyle(color2, 1);
    const patternSize = 8;
    for (let y = 0; y < h; y += patternSize * 2) {
        for (let x = 0; x < w; x += patternSize * 2) {
            bg.fillRect(x, y, patternSize, patternSize);
            bg.fillRect(x + patternSize, y + patternSize, patternSize, patternSize);
        }
    }
    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.3);
  }

  startIdleAnimation(target) {
      this.tweens.add({
          targets: target, y: '+=10', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
  }

  createPanel(x, y, w, h) {
    this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(x+4, y+4, w, h, 10);
    const bg = this.add.graphics();
    bg.fillStyle(0x002244, 0.95);
    bg.lineStyle(2, 0xffffff, 1);
    bg.fillRoundedRect(x, y, w, h, 10);
    bg.strokeRoundedRect(x, y, w, h, 10);
    return bg;
  }

  // 【修正版】鉄壁のボタン作成メソッド
  createButton(x, y, text, color, cb) {
    const container = this.add.container(x, y);
    // 横幅を220に拡張（文字数が多い場合に対応）
    const w = 220, h = 50;
    
    // 1. 中身（見た目）のコンテナを作る
    const visualContainer = this.add.container(0, 0);
    
    const shadow = this.add.graphics().fillStyle(0x000000, 0.5).fillRoundedRect(-w/2+4, -h/2+4, w, h, 8);
    const bg = this.add.graphics().fillStyle(color, 1).lineStyle(2, 0xffffff).fillRoundedRect(-w/2, -h/2, w, h, 8).strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const txt = this.add.text(0, 0, text, { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    
    visualContainer.add([shadow, bg, txt]);
    
    // 2. 当たり判定（透明な板）を親コンテナに直接置く
    // 見た目は変えずに、判定だけ動かさないようにするため
    const hitArea = this.add.rectangle(0, 0, w + 10, h + 20, 0x000000, 0).setInteractive();

    hitArea.on('pointerdown', () => {
        // 中身だけ縮小させる（当たり判定は縮まない！）
        visualContainer.setScale(0.95);
    });
    
    hitArea.on('pointerup', () => {
        visualContainer.setScale(1.0);
        cb();
    });

    hitArea.on('pointerout', () => {
        visualContainer.setScale(1.0);
    });

    // 追加順序：中身 → 当たり判定（最前面）
    container.add([visualContainer, hitArea]);
    return container;
  }

  createHpBar(x, y, w, h, current, max) {
    const container = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x000000).setOrigin(0, 0.5).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(0, 0, w, h-2, 0x00ff00).setOrigin(0, 0.5);
    container.update = (newVal, maxVal) => {
        const ratio = Math.max(0, Math.min(1, newVal / maxVal));
        bar.width = (w-2) * ratio;
        if (ratio < 0.25) bar.fillColor = 0xff0000;
        else if (ratio < 0.5) bar.fillColor = 0xffff00;
        else bar.fillColor = 0x00ff00;
    };
    container.update(current, max);
    container.add([bg, bar]);
    return container;
  }
}

// ================================================================
//  3. 職員室 (ワールド)
// ================================================================
class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  preload() { Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k])); }
  create() {
    this.createPatternBackground(0x444444, 0x333333);
    const w = this.scale.width; const h = this.scale.height;

    this.createPanel(10, 10, w-20, 80);
    this.add.text(30, 30, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:`24px ${GAME_FONT}` });
    this.add.text(30, 60, `Gold: ${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ffff00' });

    const kato = this.add.sprite(w/2, h*0.35, 'kato').setScale(6);
    this.startIdleAnimation(kato);

    this.add.text(w/2, h*0.5, "「次はどうしますか？」", { font:`20px ${GAME_FONT}` }).setOrigin(0.5);

    let nextEnemy = STAGES[Math.min(GAME_DATA.stageIndex, STAGES.length-1)];
    const stageName = (GAME_DATA.stageIndex >= STAGES.length) ? "裏ボス周回" : `Stage ${GAME_DATA.stageIndex+1}: ${nextEnemy.name}`;

    this.createButton(w/2, h*0.65, '出撃する', 0xcc3333, () => this.scene.start('BattleScene'));
    this.add.text(w/2, h*0.65 + 40, `(${stageName})`, {font:`14px ${GAME_FONT}`, color:'#aaa'}).setOrigin(0.5);

    // ボタン間隔を調整
    this.createButton(w/2, h*0.78, '購買部 (Shop)', 0x3333cc, () => this.scene.start('ShopScene'));
    this.createButton(w/2, h*0.88, 'スキル編成', 0x228822, () => this.scene.start('SkillScene'));
  }
}

// ================================================================
//  4. 購買部
// ================================================================
class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.createPatternBackground(0x222255, 0x111133);
    const w = this.scale.width;
    const h = this.scale.height;
    
    this.add.text(w/2, 40, `購買部`, { font:`28px ${GAME_FONT}` }).setOrigin(0.5);
    this.add.text(w/2, 70, `所持金: ${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' }).setOrigin(0.5);
    this.createButton(w/2, h-60, '戻る', 0x555555, () => this.scene.start('WorldScene'));

    let y = 120;

    SKILL_DB.filter(s => s.cost > 0).forEach(skill => {
      const isOwned = GAME_DATA.player.ownedSkillIds.includes(skill.id);
      
      const bg = this.add.graphics().fillStyle(isOwned?0x333333:0x000000, 0.8)
                  .lineStyle(2, 0xffffff).fillRoundedRect(20, y, w-40, 70, 8).strokeRoundedRect(20, y, w-40, 70, 8);
      
      this.add.text(40, y+10, skill.name, { font:`22px ${GAME_FONT}`, color: isOwned ? '#888' : '#fff'});
      this.add.text(40, y+40, skill.desc, { font:`16px ${GAME_FONT}`, color:'#aaa'});
      const price = this.add.text(w-40, y+35, isOwned?"済":`${skill.cost}G`, { font:`22px ${GAME_FONT}`, color:'#ff0'}).setOrigin(1, 0.5);
      
      // 当たり判定を大きく
      const hitArea = this.add.rectangle(w/2, y+35, w-20, 70).setInteractive();

      hitArea.on('pointerdown', () => {
        if (isOwned) return;
        if (GAME_DATA.gold >= skill.cost) {
          GAME_DATA.gold -= skill.cost;
          GAME_DATA.player.ownedSkillIds.push(skill.id);
          this.scene.restart();
        } else {
          price.setText("不足!"); this.time.delayedCall(500, ()=>this.scene.restart());
        }
      });
      y += 85;
    });
  }
}

// ================================================================
//  5. スキル編成
// ================================================================
class SkillScene extends BaseScene {
  constructor() { super('SkillScene'); }
  create() {
    this.createPatternBackground(0x225522, 0x113311);
    const w = this.scale.width; const h = this.scale.height;
    
    this.add.text(w/2, 40, "スキル編成", {font:`28px ${GAME_FONT}`}).setOrigin(0.5);
    this.createButton(w/2, h-60, '完了', 0x555555, () => this.scene.start('WorldScene'));

    this.add.text(30, 90, "▼ 装備中 (タップで外す)", {font:`18px ${GAME_FONT}`, color:'#8f8'});
    let y = 120;
    GAME_DATA.player.equippedSkillIds.forEach((sid, idx) => {
      const s = SKILL_DB.find(x => x.id === sid);
      const btn = this.add.graphics().fillStyle(0x006600, 1).lineStyle(1,0xffffff).fillRoundedRect(30, y, w-60, 45, 5).strokeRoundedRect(30, y, w-60, 45, 5);
      this.add.text(w/2, y+22, s.name, {font:`20px ${GAME_FONT}`}).setOrigin(0.5);
      const hit = this.add.rectangle(w/2, y+22, w-60, 50).setInteractive();
      hit.on('pointerdown', () => {
        if (GAME_DATA.player.equippedSkillIds.length <= 1) return;
        GAME_DATA.player.equippedSkillIds.splice(idx, 1);
        this.scene.restart();
      });
      y += 55;
    });

    y += 20;
    this.add.text(30, y, "▼ 所持リスト (タップで装備)", {font:`18px ${GAME_FONT}`, color:'#ff8'});
    y += 30;
    GAME_DATA.player.ownedSkillIds.forEach(sid => {
      if (GAME_DATA.player.equippedSkillIds.includes(sid)) return;
      const s = SKILL_DB.find(x => x.id === sid);
      const btn = this.add.graphics().fillStyle(0x444444, 1).lineStyle(1,0xffffff).fillRoundedRect(30, y, w-60, 45, 5).strokeRoundedRect(30, y, w-60, 45, 5);
      this.add.text(w/2, y+22, s.name, {font:`20px ${GAME_FONT}`}).setOrigin(0.5);
      const hit = this.add.rectangle(w/2, y+22, w-60, 50).setInteractive();
      hit.on('pointerdown', () => {
        if (GAME_DATA.player.equippedSkillIds.length >= 6) return;
        GAME_DATA.player.equippedSkillIds.push(sid);
        this.scene.restart();
      });
      y += 55;
    });
  }
}

// ================================================================
//  6. バトルシーン
// ================================================================
class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  preload() { Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k])); }
  create() {
    this.createPatternBackground(0x552222, 0x331111);
    const w = this.scale.width; const h = this.scale.height;

    const stageIdx = Math.min(GAME_DATA.stageIndex, STAGES.length - 1);
    this.enemyData = { ...STAGES[stageIdx], maxHp: STAGES[stageIdx].hp };

    this.playerSprite = this.add.sprite(w*0.2, h*0.6, 'kato').setScale(5);
    this.startIdleAnimation(this.playerSprite);
    this.enemySprite = this.add.sprite(w*0.8, h*0.4, this.enemyData.key).setScale(5);
    this.startIdleAnimation(this.enemySprite);

    this.playerHpBar = this.createHpBar(w*0.1, h*0.6 + 60, 100, 10, GAME_DATA.player.hp, GAME_DATA.player.maxHp);
    this.add.text(w*0.1, h*0.6 + 40, GAME_DATA.player.name, {font:`16px ${GAME_FONT}`});
    this.enemyHpBar = this.createHpBar(w*0.7, h*0.4 - 70, 100, 10, this.enemyData.hp, this.enemyData.maxHp);
    this.add.text(w*0.7, h*0.4 - 90, this.enemyData.name, {font:`16px ${GAME_FONT}`});

    this.createMessageBox(w, h);
    
    // コマンドボタン
    this.mainMenu = this.add.container(0, 0);
    this.mainMenu.add(this.createButton(w*0.75, h-220, 'コマンド', 0xcc3333, () => this.openSkillMenu()));
    this.mainMenu.add(this.createButton(w*0.75, h-150, '逃げる', 0x555555, () => this.scene.start('WorldScene')));

    this.qteTarget = this.add.graphics().setDepth(100);
    this.qteRing = this.add.graphics().setDepth(100);
    this.qteText = this.add.text(w/2, h/2-100, '', {font:`40px ${GAME_FONT}`, color:'#ff0', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setDepth(101);
    this.guardSignal = this.add.text(w/2, h/2, '！', {font:`80px ${GAME_FONT}`, color:'#f00', stroke:'#fff', strokeThickness:6}).setOrigin(0.5).setVisible(false).setDepth(101);
    this.penaltyX = this.add.text(w*0.2, h*0.6, '×', {font:`80px ${GAME_FONT}`, color:'#f00', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setVisible(false).setDepth(200);

    this.createSkillMenu(w, h);

    this.input.on('pointerdown', () => this.handleInput());
    
    this.updateMessage(`${this.enemyData.name} があらわれた！`);
    this.isPlayerTurn = true; this.qteMode = null; this.qteActive = false;
  }

  refreshStatus() {
      this.playerHpBar.update(GAME_DATA.player.hp, GAME_DATA.player.maxHp);
      this.enemyHpBar.update(this.enemyData.hp, this.enemyData.maxHp);
  }

  createSkillMenu(w, h) {
    this.skillMenu = this.add.container(0, h-320).setVisible(false).setDepth(50);
    const bg = this.add.graphics().fillStyle(0x000000, 0.9).lineStyle(2, 0xffffff).fillRoundedRect(10, 0, w-20, 310, 10).strokeRoundedRect(10, 0, w-20, 310, 10);
    this.skillMenu.add(bg);
    
    const equipped = GAME_DATA.player.equippedSkillIds.map(id => SKILL_DB.find(s => s.id === id));
    equipped.forEach((s, i) => {
        const x = w * 0.25 + (i%2) * (w*0.5); const y = 50 + Math.floor(i/2) * 80;
        
        const container = this.add.container(x, y);
        const btn = this.add.graphics().fillStyle(s.type==='heal'?0x228822:0x882222, 1).lineStyle(2,0xffffff).fillRoundedRect(-75, -25, 150, 50, 8).strokeRoundedRect(-75, -25, 150, 50, 8);
        const txt = this.add.text(0, 0, s.name, {font:`18px ${GAME_FONT}`, color:'#fff'}).setOrigin(0.5);
        
        // ここも同様に判定を最後に重ねる
        const hit = this.add.rectangle(0, 0, 160, 60).setInteractive();
        
        hit.on('pointerdown', () => { this.input.stopPropagation(); this.selectSkill(s); });
        container.add([btn, txt, hit]);
        this.skillMenu.add(container);
    });
    
    const backContainer = this.add.container(w/2, 270);
    const bBtn = this.add.graphics().fillStyle(0x555555, 1).fillRoundedRect(-50, -20, 100, 40, 5);
    const bTxt = this.add.text(0, 0, '戻る', {font:`16px ${GAME_FONT}`}).setOrigin(0.5);
    const bHit = this.add.rectangle(0, 0, 110, 50).setInteractive();
    bHit.on('pointerdown', () => { this.input.stopPropagation(); this.skillMenu.setVisible(false); this.mainMenu.setVisible(true); });
    backContainer.add([bBtn, bTxt, bHit]);
    this.skillMenu.add(backContainer);
  }

  // --- ゲームロジック ---
  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) this.resolveAttackQTE();
    else if (this.qteMode === 'defense_wait') this.triggerGuardPenalty();
    else if (this.qteMode === 'defense_active') this.resolveDefenseQTE();
  }

  openSkillMenu() { if(this.isPlayerTurn) { this.mainMenu.setVisible(false); this.skillMenu.setVisible(true); this.updateMessage("行動を選択してください"); } }
  selectSkill(s) { this.skillMenu.setVisible(false); this.selectedSkill = s; if (s.type === 'heal') this.executeHeal(s); else this.startAttackQTE(s); }

  startAttackQTE(s) {
    this.isPlayerTurn = false; this.updateMessage(`${s.name}！\nタイミングよくタップせよ！`);
    const tx = this.enemySprite.x; const ty = this.enemySprite.y;
    this.qteTarget.clear().lineStyle(4, 0xffffff).strokeCircle(tx, ty, 50).setVisible(true);
    this.qteRing.clear(); this.qteRingScale = 2.5; this.qteMode = 'attack';
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qteEvent = this.time.addEvent({ delay: 16, loop: true, callback: () => {
            if (!this.qteActive) return;
            this.qteRingScale -= (0.03 * s.speed);
            this.qteRing.clear().lineStyle(4, 0xffff00).strokeCircle(tx, ty, 50 * this.qteRingScale);
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
    this.updateMessage(`${s.name}！ HP${h}回復`);
    this.tweens.add({targets:this.playerSprite, tint:0x00ff00, duration:200, yoyo:true, onComplete:()=>this.playerSprite.clearTint()});
    this.checkEnd();
  }
  checkEnd() {
    this.refreshStatus();
    if (this.enemyData.hp <= 0) this.winBattle();
    else this.time.delayedCall(1000, () => this.startEnemyTurn());
  }

  triggerGuardPenalty() {
    if (this.guardBroken) return;
    this.guardBroken = true; this.penaltyX.setVisible(true); this.playerSprite.setTint(0x888888); this.cameras.main.shake(100,0.01);
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
    this.refreshStatus();
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
    GAME_DATA.stageIndex++; 
    let msg = `勝利！\n${this.enemyData.gold}G 獲得`;
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

  createMessageBox(w, h) {
      this.createPanel(10, h-100, w-20, 90);
      this.messageText = this.add.text(30, h-85, '', {font:`18px ${GAME_FONT}`, wordWrap:{width:w-60}});
  }
  updateMessage(t) { this.messageText.setText(t); }
}

const config = {
  type: Phaser.AUTO, width: 400, height: 800, backgroundColor: '#000000',
  parent: 'game-container', pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [WorldScene, ShopScene, SkillScene, BattleScene]
};
new Phaser.Game(config);