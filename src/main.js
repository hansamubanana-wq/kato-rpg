import Phaser from 'phaser';

// ================================================================
//  0. フォント読み込み
// ================================================================
const fontStyle = document.createElement('style');
fontStyle.innerHTML = `
  @import url('https://fonts.googleapis.com/css2?family=DotGothic16&display=swap');
  body { font-family: 'DotGothic16', sans-serif; user-select: none; -webkit-user-select: none; touch-action: none; }
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
    stress: 0, maxStress: 100,
    ownedSkillIds: [1],
    equippedSkillIds: [1]
  }
};

// ================================================================
//  2. サウンドシステム (Web Audio API - ピコピコ音源)
// ================================================================
class SoundSystem {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.bgmOscs = [];
    this.bgmTimer = null;
    this.bgmType = null;
  }

  // ユーザー操作時にコンテキストを開始する必要がある
  init() {
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playSE(type) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    if (type === 'select') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (type === 'cancel') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
    else if (type === 'attack') {
      // ノイズっぽい音（のこぎり波で代用）
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
    else if (type === 'parry') {
      // 気持ちいい高音（キィィン！）
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); // 余韻長め
      osc.start(now);
      osc.stop(now + 0.6);
    }
    else if (type === 'damage') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
    else if (type === 'limit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(800, now + 1.0);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.0);
      osc.start(now);
      osc.stop(now + 1.0);
    }
    else if (type === 'win') {
      // 勝利ジングル
      const notes = [523, 659, 783, 1046]; // C E G C
      notes.forEach((f, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.connect(g); g.connect(this.ctx.destination);
        o.frequency.value = f;
        g.gain.setValueAtTime(0.1, now + i*0.1);
        g.gain.linearRampToValueAtTime(0, now + i*0.1 + 0.3);
        o.start(now + i*0.1);
        o.stop(now + i*0.1 + 0.3);
      });
    }
  }

  // 簡易シーケンサー
  playBGM(type) {
    if (this.bgmType === type) return;
    this.stopBGM();
    this.bgmType = type;
    this.init();

    let sequence = [];
    let speed = 200;

    if (type === 'world') {
      // ゆったりCメジャー
      sequence = [261, 0, 329, 0, 392, 0, 329, 0]; 
      speed = 300;
    } else if (type === 'battle') {
      // 緊迫感のあるベースライン
      sequence = [110, 110, 130, 110, 146, 110, 123, 110];
      speed = 150;
    }

    let step = 0;
    this.bgmTimer = setInterval(() => {
      const freq = sequence[step % sequence.length];
      if (freq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      }
      step++;
    }, speed);
  }

  stopBGM() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.bgmTimer = null;
    this.bgmType = null;
  }
}

// グローバルサウンド管理
const SOUND = new SoundSystem();

// ================================================================
//  3. 共通UIシステム
// ================================================================
class BaseScene extends Phaser.Scene {
  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const cvs = document.createElement('canvas'); cvs.width = art[0].length; cvs.height = art.length;
    const ctx = cvs.getContext('2d');
    for (let y=0; y<art.length; y++) for (let x=0; x<art[0].length; x++) if (P[art[y][x]]) { ctx.fillStyle = P[art[y][x]]; ctx.fillRect(x,y,1,1); }
    this.textures.addCanvas(key, cvs);
  }

  vibrate(pattern) { if (navigator.vibrate) navigator.vibrate(pattern); }

  hitStop(duration) {
      this.tweens.timeScale = 0.05; 
      this.time.delayedCall(duration, () => { this.tweens.timeScale = 1.0; });
  }

  transitionTo(sceneName) {
      this.cameras.main.fadeOut(500, 0, 0, 0); 
      this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start(sceneName); });
  }
  fadeInScene() { this.cameras.main.fadeIn(500, 0, 0, 0); }

  createPatternBackground(c1, c2) {
    const w = this.scale.width; const h = this.scale.height;
    const bg = this.add.graphics(); bg.fillStyle(c1, 1); bg.fillRect(0,0,w,h); bg.fillStyle(c2, 1);
    for(let y=0; y<h; y+=16) for(let x=0; x<w; x+=16) { bg.fillRect(x,y,8,8); bg.fillRect(x+8,y+8,8,8); }
    this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.3);
  }

  startIdleAnimation(t) { this.tweens.add({ targets: t, y: '+=10', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }); }

  showDamagePopup(x, y, amount, isCrit) {
      let color = isCrit ? '#f00' : '#fff'; let text = isCrit ? `${amount}!!` : `${amount}`;
      const t = this.add.text(x, y, text, { font: isCrit?'48px '+GAME_FONT:'32px '+GAME_FONT, color: color, stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setDepth(200);
      this.tweens.add({ targets: t, y: y-80, scale: isCrit?1.5:1.2, duration: 400, ease: 'Back.Out', onComplete: () => {
          this.tweens.add({ targets: t, alpha: 0, y: y-100, duration: 300, delay: 200, onComplete: ()=>t.destroy() });
      }});
  }

  openWindowAnimation(c) { c.setScale(0); c.setVisible(true); this.tweens.add({ targets: c, scale: 1, duration: 400, ease: 'Back.Out' }); }

  createImpactEffect(x, y) {
      const g = this.add.graphics(); g.lineStyle(4, 0xffff00); g.beginPath();
      for(let i=0; i<8; i++){ const a=i*(Math.PI/4); g.moveTo(x+Math.cos(a)*20, y+Math.sin(a)*20); g.lineTo(x+Math.cos(a)*50, y+Math.sin(a)*50); }
      g.strokePath();
      const c = this.add.circle(x, y, 10, 0xffffff);
      this.tweens.add({ targets: [g, c], scale: 1.5, alpha: 0, duration: 200, onComplete: () => { g.destroy(); c.destroy(); } });
  }

  createPanel(x, y, w, h) {
    this.add.graphics().fillStyle(0x000, 0.5).fillRoundedRect(x+4, y+4, w, h, 10);
    const bg = this.add.graphics(); bg.fillStyle(0x002244, 0.95).lineStyle(2, 0xfff, 1).fillRoundedRect(x, y, w, h, 10).strokeRoundedRect(x, y, w, h, 10);
    return bg;
  }

  createButton(x, y, text, color, cb, isPulse=false) {
    const c = this.add.container(x, y); const w = 220, h = 50;
    const vc = this.add.container(0, 0);
    const sh = this.add.graphics().fillStyle(0x000, 0.5).fillRoundedRect(-w/2+4, -h/2+4, w, h, 8);
    const bg = this.add.graphics().fillStyle(color, 1).lineStyle(2, 0xfff).fillRoundedRect(-w/2, -h/2, w, h, 8).strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const tx = this.add.text(0, 0, text, { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    vc.add([sh, bg, tx]);
    if (isPulse) this.tweens.add({ targets: vc, scale: 1.05, duration: 800, yoyo: true, repeat: -1 });
    
    const hit = this.add.rectangle(0, 0, w+10, h+20, 0x000, 0).setInteractive();
    hit.on('pointerdown', () => { vc.setScale(0.95); this.vibrate(5); });
    hit.on('pointerup', () => { vc.setScale(1.0); SOUND.playSE('select'); cb(); }); // ここで音を鳴らす
    hit.on('pointerout', () => vc.setScale(1.0));
    c.add([vc, hit]);
    return c;
  }

  createHpBar(x, y, w, h, val, max) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x000).setOrigin(0, 0.5).setStrokeStyle(1, 0xfff);
    const bar = this.add.rectangle(0, 0, w, h-2, 0x0f0).setOrigin(0, 0.5);
    c.update = (v, m) => { const r = Math.max(0, Math.min(1, v/m)); bar.width = (w-2)*r; bar.fillColor = r<0.25?0xf00:r<0.5?0xff0:0x0f0; };
    c.update(val, max); c.add([bg, bar]); return c;
  }
  createStressBar(x, y, w, h) {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, h, 0x000).setOrigin(0, 0.5).setStrokeStyle(1, 0xfff);
    const bar = this.add.rectangle(0, 0, 0, h-2, 0xfa0).setOrigin(0, 0.5); 
    c.update = (v, m) => { const r = Math.min(1, v/m); bar.width = (w-2)*r; bar.fillColor = r>=1?0xfff:0xfa0; };
    c.add([bg, bar]); return c;
  }
}

// ================================================================
//  3. 職員室
// ================================================================
class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  preload() { Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k])); }
  create() {
    SOUND.playBGM('world'); // BGM開始
    this.fadeInScene(); this.createPatternBackground(0x444, 0x333);
    const w = this.scale.width; const h = this.scale.height;
    this.createPanel(10, 10, w-20, 80);
    this.add.text(30, 30, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:`24px ${GAME_FONT}` });
    this.add.text(30, 60, `Gold: ${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' });
    const kato = this.add.sprite(w/2, h*0.35, 'kato').setScale(6); this.startIdleAnimation(kato);
    this.add.text(w/2, h*0.5, "「次はどうしますか？」", { font:`20px ${GAME_FONT}` }).setOrigin(0.5);
    let n = STAGES[Math.min(GAME_DATA.stageIndex, STAGES.length-1)];
    const sn = (GAME_DATA.stageIndex >= STAGES.length) ? "裏ボス" : `Stage ${GAME_DATA.stageIndex+1}: ${n.name}`;
    this.createButton(w/2, h*0.65, '出撃する', 0xc33, () => this.transitionTo('BattleScene'), true);
    this.add.text(w/2, h*0.65 + 40, `(${sn})`, {font:`14px ${GAME_FONT}`, color:'#aaa'}).setOrigin(0.5);
    this.createButton(w/2, h*0.8, '購買部', 0x33c, () => this.transitionTo('ShopScene'));
    this.createButton(w/2, h*0.9, '編成', 0x282, () => this.transitionTo('SkillScene'));
  }
}

// ================================================================
//  4. 購買部
// ================================================================
class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.fadeInScene(); this.createPatternBackground(0x225, 0x113);
    const w = this.scale.width; 
    this.add.text(w/2, 40, `購買部`, { font:`28px ${GAME_FONT}` }).setOrigin(0.5);
    this.add.text(w/2, 70, `${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' }).setOrigin(0.5);
    this.createButton(w/2, this.scale.height-60, '戻る', 0x555, () => this.transitionTo('WorldScene'));
    let y = 120;
    SKILL_DB.filter(s => s.cost > 0).forEach((s, i) => {
        const c = this.add.container(0, 0);
        const has = GAME_DATA.player.ownedSkillIds.includes(s.id);
        const bg = this.add.graphics().fillStyle(has?0x333:0x000, 0.8).lineStyle(2, 0xfff).fillRoundedRect(20, y, w-40, 70, 8).strokeRoundedRect(20, y, w-40, 70, 8);
        const t1 = this.add.text(40, y+10, s.name, { font:`22px ${GAME_FONT}`, color: has?'#888':'#fff'});
        const t2 = this.add.text(40, y+40, s.desc, { font:`16px ${GAME_FONT}`, color:'#aaa'});
        const pr = this.add.text(w-40, y+35, has?"済":`${s.cost}G`, { font:`22px ${GAME_FONT}`, color:'#ff0'}).setOrigin(1, 0.5);
        const hit = this.add.rectangle(w/2, y+35, w-20, 70).setInteractive();
        hit.on('pointerdown', () => {
            if(has) return;
            if(GAME_DATA.gold >= s.cost) { GAME_DATA.gold -= s.cost; GAME_DATA.player.ownedSkillIds.push(s.id); SOUND.playSE('select'); this.scene.restart(); }
            else { SOUND.playSE('cancel'); pr.setText("不足!"); this.time.delayedCall(500, ()=>this.scene.restart()); }
        });
        c.add([bg, t1, t2, pr, hit]); c.setScale(0);
        this.tweens.add({ targets: c, scale: 1, duration: 300, delay: i*50, ease: 'Back.Out' });
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
    this.fadeInScene(); this.createPatternBackground(0x252, 0x131);
    const w = this.scale.width;
    this.add.text(w/2, 40, "スキル編成", {font:`28px ${GAME_FONT}`}).setOrigin(0.5);
    this.createButton(w/2, this.scale.height-60, '完了', 0x555, () => this.transitionTo('WorldScene'));
    this.add.text(30, 90, "装備中 (タップで外す)", {font:`18px ${GAME_FONT}`, color:'#8f8'});
    let y = 120;
    const makeItem = (s, i, eq) => {
        const c = this.add.container(0, 0);
        const btn = this.add.graphics().fillStyle(eq?0x060:0x444, 1).lineStyle(1,0xfff).fillRoundedRect(30, y, w-60, 45, 5).strokeRoundedRect(30, y, w-60, 45, 5);
        const tx = this.add.text(w/2, y+22, s.name, {font:`20px ${GAME_FONT}`}).setOrigin(0.5);
        const h = this.add.rectangle(w/2, y+22, w-60, 50).setInteractive();
        h.on('pointerdown', () => {
            if(eq) { if(GAME_DATA.player.equippedSkillIds.length>1) GAME_DATA.player.equippedSkillIds.splice(i,1); }
            else { if(GAME_DATA.player.equippedSkillIds.length<6) GAME_DATA.player.equippedSkillIds.push(s.id); }
            SOUND.playSE('select'); this.scene.restart();
        });
        c.add([btn, tx, h]); c.setScale(0);
        this.tweens.add({ targets: c, scale: 1, duration: 300, delay: i*30, ease: 'Back.Out' });
        return c;
    };
    GAME_DATA.player.equippedSkillIds.forEach((sid, i) => { makeItem(SKILL_DB.find(x=>x.id===sid), i, true); y+=55; });
    y += 20; this.add.text(30, y, "所持リスト", {font:`18px ${GAME_FONT}`, color:'#ff8'}); y+=30;
    let li = 0;
    GAME_DATA.player.ownedSkillIds.forEach(sid => { if(!GAME_DATA.player.equippedSkillIds.includes(sid)) { makeItem(SKILL_DB.find(x=>x.id===sid), li, false); y+=55; li++; }});
  }
}

// ================================================================
//  6. バトルシーン
// ================================================================
class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  preload() { Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k])); }
  create() {
    SOUND.playBGM('battle'); // BGM変更
    this.fadeInScene(); this.createPatternBackground(0x522, 0x311);
    const w = this.scale.width; const h = this.scale.height;
    const idx = Math.min(GAME_DATA.stageIndex, STAGES.length-1);
    this.ed = { ...STAGES[idx], maxHp: STAGES[idx].hp };

    this.ps = this.add.sprite(w*0.2, h*0.6, 'kato').setScale(5); this.startIdleAnimation(this.ps);
    this.es = this.add.sprite(w*0.8, h*0.4, this.ed.key).setScale(5); this.startIdleAnimation(this.es);
    this.ebx = this.es.x; this.eby = this.es.y;

    this.phb = this.createHpBar(w*0.1, h*0.6+60, 100, 10, GAME_DATA.player.hp, GAME_DATA.player.maxHp);
    this.add.text(w*0.1, h*0.6+40, GAME_DATA.player.name, {font:`16px ${GAME_FONT}`});
    this.ehb = this.createHpBar(w*0.7, h*0.4-70, 100, 10, this.ed.hp, this.ed.maxHp);
    this.add.text(w*0.7, h*0.4-90, this.ed.name, {font:`16px ${GAME_FONT}`});
    this.sb = this.createStressBar(w*0.1, h*0.6+80, 100, 8);
    this.add.text(w*0.1+60, h*0.6+80, "Stress", {font:`12px ${GAME_FONT}`, color:'#fa0'}).setOrigin(0, 0.5);

    this.createMessageBox(w, h);
    this.mm = this.add.container(0, 0);
    this.mm.add(this.createButton(w*0.75, h-220, 'コマンド', 0xc33, () => this.openSkillMenu()));
    this.mm.add(this.createButton(w*0.75, h-150, '逃げる', 0x555, () => this.transitionTo('WorldScene')));
    this.lb = this.createButton(w*0.25, h-220, 'ブチギレ', 0xf00, () => this.activateLimitBreak(), true);
    this.lb.setVisible(false); this.mm.add(this.lb);

    this.qt = this.add.graphics().setDepth(100); this.qr = this.add.graphics().setDepth(100);
    this.qtxt = this.add.text(w/2, h/2-100, '', {font:`40px ${GAME_FONT}`, color:'#ff0', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setDepth(101);
    this.gs = this.add.text(w/2, h/2, '！', {font:`80px ${GAME_FONT}`, color:'#f00', stroke:'#fff', strokeThickness:6}).setOrigin(0.5).setVisible(false).setDepth(101);
    this.px = this.add.text(w*0.2, h*0.6, '×', {font:`80px ${GAME_FONT}`, color:'#f00', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setVisible(false).setDepth(200);

    this.createSkillMenu(w, h);
    this.input.on('pointerdown', () => this.handleInput());
    this.updateMessage(`${this.ed.name} があらわれた！`);
    this.isPlayerTurn = true; this.qteMode = null; this.qteActive = false;
    this.refreshStatus();
  }

  refreshStatus() {
      this.phb.update(GAME_DATA.player.hp, GAME_DATA.player.maxHp);
      this.ehb.update(this.ed.hp, this.ed.maxHp);
      this.sb.update(GAME_DATA.player.stress, GAME_DATA.player.maxStress);
      this.lb.setVisible(GAME_DATA.player.stress >= GAME_DATA.player.maxStress);
  }

  createSkillMenu(w, h) {
    this.sm = this.add.container(0, h-320).setVisible(false).setDepth(50);
    const bg = this.add.graphics().fillStyle(0x000, 0.9).lineStyle(2, 0xfff).fillRoundedRect(10, 0, w-20, 310, 10).strokeRoundedRect(10, 0, w-20, 310, 10);
    this.sm.add(bg);
    const eq = GAME_DATA.player.equippedSkillIds.map(id => SKILL_DB.find(s => s.id === id));
    eq.forEach((s, i) => {
        const x = w*0.25+(i%2)*(w*0.5); const y = 50 + Math.floor(i/2)*80;
        const c = this.add.container(x, y);
        const b = this.add.graphics().fillStyle(s.type==='heal'?0x282:0x822, 1).lineStyle(2,0xfff).fillRoundedRect(-75,-25,150,50,8).strokeRoundedRect(-75,-25,150,50,8);
        const t = this.add.text(0,0,s.name,{font:`18px ${GAME_FONT}`,color:'#fff'}).setOrigin(0.5);
        const h = this.add.rectangle(0,0,160,60).setInteractive();
        h.on('pointerdown', () => { this.input.stopPropagation(); this.vibrate(10); this.selectSkill(s); });
        c.add([b, t, h]); this.sm.add(c);
    });
    const bc = this.add.container(w/2, 270);
    const bb = this.add.graphics().fillStyle(0x555, 1).fillRoundedRect(-50,-20,100,40,5);
    const bt = this.add.text(0,0,'戻る',{font:`16px ${GAME_FONT}`}).setOrigin(0.5);
    const bh = this.add.rectangle(0,0,110,50).setInteractive();
    bh.on('pointerdown', () => { this.input.stopPropagation(); this.vibrate(10); this.sm.setVisible(false); this.mm.setVisible(true); });
    bc.add([bb, bt, bh]); this.sm.add(bc);
  }

  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) this.resolveAttackQTE();
    else if (this.qteMode === 'defense_wait') this.triggerGuardPenalty();
    else if (this.qteMode === 'defense_active') this.resolveDefenseQTE();
  }

  openSkillMenu() { if(this.isPlayerTurn) { this.vibrate(10); this.mm.setVisible(false); this.openWindowAnimation(this.sm); this.updateMessage("行動を選択"); } }
  selectSkill(s) { this.sm.setVisible(false); this.selS = s; if (s.type === 'heal') this.executeHeal(s); else this.startAttackQTE(s); }

  activateLimitBreak() {
    this.isPlayerTurn = false; GAME_DATA.player.stress = 0; SOUND.playSE('limit');
    this.vibrate(1000); this.cameras.main.flash(500, 255, 0, 0); this.cameras.main.shake(500, 0.05);      
    this.updateMessage(`加藤先生の ブチギレ！\n「いい加減にしなさい！！」`);
    const dmg = Math.floor(GAME_DATA.player.atk * 150); this.ed.hp -= dmg;
    this.time.delayedCall(1000, () => { this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.checkEnd(); });
  }

  playSwordAnimation(cb) {
      const s = this.add.graphics(); s.fillStyle(0x0ff, 0.8).lineStyle(2, 0xfff, 1);
      s.beginPath(); s.moveTo(0,0); s.lineTo(20, -100); s.lineTo(40, 0); s.closePath(); s.fillPath(); s.strokePath();
      s.x = this.ps.x+20; s.y = this.ps.y-20; s.angle = -30; s.setDepth(200);
      this.tweens.chain({ targets: s, tweens: [ { angle: -60, duration: 200, ease: 'Back.Out' }, { angle: 120, x: this.es.x-30, y: this.es.y, duration: 150, ease: 'Quad.In', onComplete: () => { this.createImpactEffect(this.es.x, this.es.y); s.destroy(); cb(); } } ] });
  }

  startAttackQTE(s) {
    this.isPlayerTurn = false; this.updateMessage(`${s.name}！\nタイミング！`);
    const tx = this.es.x; const ty = this.es.y;
    this.qt.clear().lineStyle(4, 0xfff).strokeCircle(tx, ty, 50).setVisible(true);
    this.qr.clear(); this.qrs = 2.5; this.qteMode = 'attack';
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qe = this.time.addEvent({ delay: 16, loop: true, callback: () => {
            if (!this.qteActive) return;
            this.qrs -= (0.03 * s.speed);
            this.qr.clear().lineStyle(4, 0xff0).strokeCircle(tx, ty, 50 * this.qrs);
            if (this.qrs <= 0.5) { this.qteActive = false; this.qe.remove(); this.finishQTE('MISS'); }
        }});
    });
  }
  resolveAttackQTE() {
    this.qteActive = false; this.qe.remove(); this.qr.clear(); this.qt.clear();
    this.vibrate(20); 
    const d = Math.abs(this.qrs - 1.0);
    if (d < 0.15) this.finishQTE('PERFECT'); else if (d < 0.4) this.finishQTE('GOOD'); else this.finishQTE('BAD');
  }
  finishQTE(res) {
    this.qtxt.setText(res).setVisible(true).setScale(0);
    this.tweens.add({ targets: this.qtxt, scale:1.5, duration:300, yoyo:true, onComplete:()=>{ this.qtxt.setVisible(false); this.executeAttack(res); }});
  }
  executeAttack(res) {
    this.playSwordAnimation(() => {
        let dmg = this.selS.power * GAME_DATA.player.atk;
        let v = 50; let c = false;
        if (res==='PERFECT') { dmg = Math.floor(dmg*1.5); v = [50, 50, 300]; this.cameras.main.shake(300, 0.04); this.hitStop(200); c = true; } 
        else if (res!=='GOOD') { dmg = Math.floor(dmg*0.5); v = 20; }
        
        SOUND.playSE('attack'); this.vibrate(v); 
        this.ed.hp -= dmg;
        this.showDamagePopup(this.es.x, this.es.y, dmg, c);
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 5);
        this.checkEnd();
    });
  }
  executeHeal(s) {
    this.isPlayerTurn = false; const h = s.power;
    GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + h, GAME_DATA.player.maxHp);
    const ht = this.add.text(this.ps.x, this.ps.y-50, `+${h}`, { font:`32px ${GAME_FONT}`, color:'#0f0', stroke:'#000', strokeThickness:4}).setOrigin(0.5);
    this.tweens.add({ targets: ht, y: ht.y-50, alpha:0, duration:1000, onComplete:()=>ht.destroy() });
    this.tweens.add({targets:this.ps, tint:0x0f0, duration:200, yoyo:true, onComplete:()=>this.ps.clearTint()});
    this.checkEnd();
  }
  checkEnd() {
    this.refreshStatus();
    if (this.ed.hp <= 0) this.winBattle();
    else this.time.delayedCall(1000, () => this.startEnemyTurn());
  }

  triggerGuardPenalty() {
    if (this.guardBroken) return;
    this.guardBroken = true; this.px.setVisible(true); this.ps.setTint(0x888); 
    this.cameras.main.shake(100,0.01); this.vibrate(200); SOUND.playSE('cancel');
  }

  startEnemyTurn() {
    this.updateMessage(`${this.ed.name} の構え...`);
    this.qteMode = 'defense_wait'; this.guardBroken = false; this.px.setVisible(false); this.ps.clearTint();
    this.tweens.add({ targets: this.es, x: this.es.x + 20, duration: 500, ease: 'Power2' });
    const delay = Phaser.Math.Between(1000, 2000);
    this.time.delayedCall(delay, () => {
        if (this.guardBroken) { this.executeDefense(false); return; }
        this.qteMode = 'defense_active'; this.gs.setVisible(true);
        this.eat = this.tweens.add({
            targets: this.es, x: this.ps.x + 50, duration: 300, ease: 'Expo.In',
            onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } }
        });
    });
  }

  resolveDefenseQTE() {
    this.gs.setVisible(false); this.qteMode = null; if (this.eat) this.eat.stop();
    this.createImpactEffect(this.es.x - 30, this.es.y);
    this.cameras.main.flash(300, 255, 255, 255); this.hitStop(300); 
    this.qtxt.setText("PARRY!!").setVisible(true).setScale(1);
    this.tweens.add({targets:this.qtxt, y:this.qtxt.y-50, alpha:0, duration:500, onComplete:()=>{this.qtxt.setVisible(false); this.qtxt.setAlpha(1); this.qtxt.y+=50;}});
    this.executeDefense(true);
  }

  executeDefense(suc) {
    let dmg = this.ed.atk;
    if (suc) { 
        dmg = 0; SOUND.playSE('parry'); this.vibrate([20, 20, 20, 20, 500]); 
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 20);
        this.tweens.add({ targets: this.es, x: this.ebx, duration: 300, ease: 'Back.Out' });
    } else { 
        SOUND.playSE('damage');
        this.showDamagePopup(this.ps.x, this.ps.y, dmg, false);
        GAME_DATA.player.hp -= dmg; this.cameras.main.shake(200, 0.02); this.vibrate(300); 
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 10);
        this.tweens.add({ targets: this.es, x: this.ebx, delay: 200, duration: 500, ease: 'Power2' });
    }
    this.qteMode = null; this.refreshStatus();
    if (GAME_DATA.player.hp <= 0) {
        this.updateMessage("敗北... (クリックで戻る)");
        this.input.once('pointerdown', () => { GAME_DATA.player.hp=GAME_DATA.player.maxHp; GAME_DATA.player.stress = 0; this.transitionTo('WorldScene'); });
    } else {
        this.time.delayedCall(1000, () => { 
            this.isPlayerTurn = true; this.mm.setVisible(true); this.px.setVisible(false); this.ps.clearTint(); 
            this.updateMessage("ターン開始"); this.refreshStatus();
        });
    }
  }

  winBattle() {
    GAME_DATA.gold += this.ed.gold; GAME_DATA.player.exp += this.ed.exp; GAME_DATA.stageIndex++; 
    SOUND.playSE('win'); this.vibrate([100, 50, 100, 50, 200]); 
    let msg = `勝利！\n${this.ed.gold}G 獲得`;
    if (Math.random() < 0.2 && !GAME_DATA.player.ownedSkillIds.includes(7)) {
        GAME_DATA.player.ownedSkillIds.push(7); msg += "\nレア技【居残り指導】習得！";
    }
    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) {
        GAME_DATA.player.level++; GAME_DATA.player.maxHp+=20; GAME_DATA.player.hp = GAME_DATA.player.maxHp; GAME_DATA.player.atk += 0.2;
        GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5);
        msg += "\nレベルアップ！";
    }
    this.updateMessage(msg + "\n(クリックで次へ)");
    this.mm.setVisible(false);
    this.input.once('pointerdown', () => this.transitionTo('WorldScene'));
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