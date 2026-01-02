import Phaser from 'phaser';

// ================================================================
//  0. フォント & スタイル
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
  kingetsu: [".....66..66.....","....666..666....","...6666..6666...","...6111111116...","...6101111016...","...6111111116...","...6111111116...","...2222222222...","..222222222222..","..222222222222..","..777777777777..","...777....777...","...777....777...","...000....000..."],
  bg_blackboard: ["BBBBBBBBBBBBBBBB","B00000000000000B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B0AAAAAAAAAAAA0B","B00000000000000B","BBBBBBBBBBBBBBBB"],
  bg_window: ["DDDDDDDD","D222222D","D222222D","D222222D","DDDDDDDD","D222222D","D222222D","D222222D","DDDDDDDD"],
  bg_shelf: ["BBBBBBBB","B992299B","BBBBBBBB","B292922B","BBBBBBBB","B922992B","BBBBBBBB"],
  bg_locker: ["CCCCCCCC","C888888C","C878888C","C888888C","C888888C","C888888C","C888888C","CCCCCCCC"],
  bg_window_sunset: ["EEEEEEEE","E555555E","E555555E","E555555E","EEEEEEEE","E555555E","E555555E","E555555E","EEEEEEEE"]
};

const STAGES = [
  { id: 0, name: '土蔵', hp: 150, atk: 12, exp: 20, gold: 100, key: 'dozo' },
  { id: 1, name: '前田', hp: 300, atk: 18, exp: 40, gold: 150, key: 'maeda' },
  { id: 2, name: '松田先生', hp: 600, atk: 25, exp: 80, gold: 250, key: 'matsuda' },
  { id: 3, name: '北井先生', hp: 1200, atk: 35, exp: 120, gold: 400, key: 'kitai' },
  { id: 4, name: '福盛田先生', hp: 2500, atk: 45, exp: 200, gold: 600, key: 'fukumorita' },
  { id: 5, name: '青田校長', hp: 5000, atk: 60, exp: 500, gold: 1000, key: 'aota' }, 
  { id: 6, name: '金月', hp: 10000, atk: 99, exp: 1000, gold: 2000, key: 'kingetsu' }
];

const SKILL_DB = [
  { id: 1, name: '出席確認', type: 'attack', power: 15, speed: 1.0, cost: 0, desc: '基本攻撃。確実に出席をとる。' },
  { id: 2, name: 'チョーク投げ', type: 'attack', power: 40, speed: 1.2, cost: 150, desc: 'スナップを効かせた投擲。' },
  { id: 3, name: '小テスト', type: 'attack', power: 25, speed: 0.7, cost: 80, desc: '威力は低いが、当てやすい。' },
  { id: 4, name: '定規ソード', type: 'attack', power: 75, speed: 1.5, cost: 500, desc: '長い定規で切り裂く。威力大。' },
  { id: 5, name: '難問の出題', type: 'attack', power: 130, speed: 2.2, cost: 1200, desc: '超威力だが、判定が激ムズ。' },
  { id: 6, name: '公式の確認', type: 'heal', power: 80, speed: 0, cost: 350, desc: '基本となる回復魔法。' },
  { id: 7, name: '居残り指導', type: 'attack', power: 250, speed: 2.5, cost: 0, desc: 'ドロップ限定奥義。' },
  { id: 8, name: 'コンパス突き', type: 'attack', power: 55, speed: 1.4, cost: 300, desc: '鋭い一撃。判定が少し速い。' },
  { id: 9, name: '分厚い教科書', type: 'attack', power: 100, speed: 0.9, cost: 800, desc: '鈍器のような重み。当てやすい。' },
  { id: 10, name: '赤ペン連撃', type: 'attack', power: 150, speed: 1.8, cost: 1800, desc: '高速採点による連続攻撃。' },
  { id: 11, name: '保健室の鍵', type: 'heal', power: 300, speed: 0, cost: 1000, desc: '体力を大幅に回復する。' },
  { id: 12, name: '夏休みの宿題', type: 'attack', power: 400, speed: 3.0, cost: 3000, desc: '絶望的な威力。判定は一瞬。' }
];

const GAME_DATA = {
  gold: 0,
  stageIndex: 0,
  player: {
    name: '加藤先生', level: 1, exp: 0, nextExp: 50,
    hp: 80, maxHp: 80, atk: 1.0, 
    stress: 0, maxStress: 100,
    ownedSkillIds: [1],
    equippedSkillIds: [1]
  }
};

// ================================================================
//  2. 共通UI & システム
// ================================================================
class BaseScene extends Phaser.Scene {
  preload() {
    Object.keys(ARTS).forEach(k => this.createTextureFromText(k, ARTS[k]));
    this.load.audio('bgm_world', '/sounds/bgm_world.mp3');
    this.load.audio('bgm_battle', '/sounds/bgm_battle.mp3');
    this.load.audio('se_select', '/sounds/se_select.mp3');
    this.load.audio('se_attack', '/sounds/se_attack.mp3');
    this.load.audio('se_parry', '/sounds/se_parry.mp3');
    this.load.audio('se_win', '/sounds/se_win.mp3');
  }

  createTextureFromText(key, art) {
    if (this.textures.exists(key)) return;
    const cvs = document.createElement('canvas'); cvs.width = art[0].length; cvs.height = art.length;
    const ctx = cvs.getContext('2d');
    for (let y=0; y<art.length; y++) for (let x=0; x<art[0].length; x++) if (P[art[y][x]]) { ctx.fillStyle = P[art[y][x]]; ctx.fillRect(x,y,1,1); }
    this.textures.addCanvas(key, cvs);
  }

  playSound(key, config = {}) { if (this.sound.get(key) || this.cache.audio.exists(key)) this.sound.play(key, config); }
  
  playBGM(key) {
      const current = this.sound.getAll('bgm_world').concat(this.sound.getAll('bgm_battle'));
      let isPlaying = false;
      current.forEach(sound => {
          if (sound.key === key && sound.isPlaying) isPlaying = true;
          else sound.stop();
      });
      if (!isPlaying) this.playSound(key, { loop: true, volume: 0.5 });
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

  createGameBackground(type) {
    const w = this.scale.width; const h = this.scale.height;
    const bgContainer = this.add.container(0, 0).setDepth(-100);
    const wall = this.add.graphics(); const floor = this.add.graphics();
    let wallColor = 0xffeebb; let floorColor = 0x885522;
    if(type==='shop') { wallColor = 0xaaccff; floorColor = 0xcccccc; }
    if(type==='skill') { wallColor = 0xaaaaaa; floorColor = 0x666666; }
    if(type==='battle') { wallColor = 0x552255; floorColor = 0x221122; }
    if(type==='secret') { wallColor = 0x220000; floorColor = 0x110000; } // 裏ボス用

    wall.fillStyle(wallColor, 1).fillRect(0, 0, w, h*0.6);
    floor.fillStyle(floorColor, 1).fillRect(0, h*0.6, w, h*0.4);
    const noise = this.add.graphics(); noise.fillStyle(0x000000, 0.05);
    for(let y=0; y<h; y+=4) for(let x=0; x<w; x+=4) if(Math.random()>0.5) noise.fillRect(x,y,4,4);
    bgContainer.add([wall, floor, noise]);
    
    if (type === 'world') {
        bgContainer.add(this.add.sprite(w/2, h*0.3, 'bg_blackboard').setScale(10).setAlpha(0.7));
    } else if (type === 'shop') {
        for(let i=0; i<3; i++) bgContainer.add(this.add.sprite(60+i*140, h*0.4, 'bg_shelf').setScale(6));
    } else if (type === 'skill') {
        for(let i=0; i<4; i++) bgContainer.add(this.add.sprite(50+i*100, h*0.4, 'bg_locker').setScale(6));
    } else if (type === 'battle') {
        for(let i=0; i<2; i++) bgContainer.add(this.add.sprite(100+i*200, h*0.3, 'bg_window_sunset').setScale(8).setAlpha(0.8));
        bgContainer.add(this.add.rectangle(w/2, h/2, w, h, 0x440000, 0.3));
    }
    bgContainer.add(this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.3));
  }

  startIdleAnimation(target) {
      this.tweens.add({ targets: target, y: '+=10', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

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
    hit.on('pointerup', () => { vc.setScale(1.0); this.playSound('se_select'); cb(); });
    hit.on('pointerout', () => vc.setScale(1.0));
    c.add([vc, hit]);
    return c;
  }

  createScrollableButton(x, y, text, color, cb, w=220, h=50, subText="") {
    const c = this.add.container(x, y);
    const vc = this.add.container(0, 0);
    const sh = this.add.graphics().fillStyle(0x000, 0.5).fillRoundedRect(-w/2+4, -h/2+4, w, h, 8);
    const bg = this.add.graphics().fillStyle(color, 1).lineStyle(2, 0xfff).fillRoundedRect(-w/2, -h/2, w, h, 8).strokeRoundedRect(-w/2, -h/2, w, h, 8);
    const tx = this.add.text(w>220? -w/2 + 20 : 0, -5, text, { font: `22px ${GAME_FONT}`, color: '#fff' }).setOrigin(w>220?0:0.5, 0.5);
    vc.add([sh, bg, tx]);
    if(subText) {
        const sub = this.add.text(w>220? -w/2 + 20 : 0, 18, subText, { font: `14px ${GAME_FONT}`, color: '#ccc' }).setOrigin(w>220?0:0.5, 0.5);
        vc.add(sub);
    }
    const hit = this.add.rectangle(0, 0, w, h, 0x000, 0).setInteractive();
    hit.on('pointerdown', () => { vc.setScale(0.95); });
    hit.on('pointerup', () => { vc.setScale(1.0); if (!this.scene.isDragging) { this.playSound('se_select'); cb(); } });
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

  initScrollView(contentHeight, maskY, maskH) {
      this.isDragging = false; this.dragStartY = 0; this.containerStartY = 0;
      this.scrollContainer = this.add.container(0, maskY);
      const shape = this.make.graphics(); shape.fillStyle(0xffffff); shape.fillRect(0, maskY, this.scale.width, maskH);
      const mask = shape.createGeometryMask(); this.scrollContainer.setMask(mask);
      const hitZone = this.add.rectangle(this.scale.width/2, maskY + maskH/2, this.scale.width, maskH, 0x000000, 0).setInteractive();
      const minScroll = Math.min(0, maskH - contentHeight - 50); const maxScroll = 0;
      this.input.on('pointerdown', (pointer) => { this.isDragging = false; this.dragStartY = pointer.y; this.containerStartY = this.scrollContainer.y; });
      this.input.on('pointermove', (pointer) => { if (pointer.isDown) { const diff = pointer.y - this.dragStartY; if (Math.abs(diff) > 10) this.isDragging = true; if (this.isDragging) { this.scrollContainer.y = Phaser.Math.Clamp(this.containerStartY + diff, minScroll + maskY, maxScroll + maskY); } } });
      this.input.on('pointerup', () => { this.time.delayedCall(100, () => { this.isDragging = false; }); });
      return this.scrollContainer;
  }
}

// ================================================================
//  3. オープニング（ストーリー）シーン
// ================================================================
class OpeningScene extends BaseScene {
  constructor() { super('OpeningScene'); }
  create() {
    this.fadeInScene(); 
    this.playBGM('bgm_world');
    const w = this.scale.width; const h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x000000);

    const storyText = `
東京都品川区
青稜中学校。

自由な校風で知られるこの名門校に
突如として『教育崩壊』の波が押し寄せた。

生徒たちはスマホに支配され、
教師たちはやる気を失い、
校内は荒廃の一途をたどっていた。

だが、一人の男が立ち上がる。
数学教師・加藤。

「私が青稜の規律を取り戻す！！」

愛のムチ（物理）で
学園の平和を取り戻せ！
    `;

    const textObj = this.add.text(w/2, h + 100, storyText, { 
        font: `24px ${GAME_FONT}`, color: '#ffff00', align: 'center', wordWrap: { width: w - 40 }
    }).setOrigin(0.5, 0);

    this.tweens.add({
        targets: textObj, y: -600, duration: 20000, ease: 'Linear',
        onComplete: () => this.transitionTo('TutorialScene')
    });

    this.createButton(w/2, h - 50, 'SKIP >>', 0x555555, () => this.transitionTo('TutorialScene'));
  }
}

// ================================================================
//  4. チュートリアルシーン
// ================================================================
class TutorialScene extends BaseScene {
  constructor() { super('TutorialScene'); }
  create() {
    this.fadeInScene(); this.createGameBackground('skill');
    this.showPage1();
  }

  showPage1() {
    this.children.removeAll(); 
    this.createGameBackground('skill');
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 50, "【チュートリアル 1/2】", { font: `28px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, 120, "1. 攻 撃", { font: `24px ${GAME_FONT}`, color: '#fa0' }).setOrigin(0.5);
    const ring = this.add.graphics();
    ring.lineStyle(4, 0xffff00); ring.strokeCircle(w/2, 180, 30);
    ring.lineStyle(4, 0xffffff); ring.strokeCircle(w/2, 180, 30);
    this.add.text(w/2, 230, "リングが重なる瞬間にタップ！", { font: `20px ${GAME_FONT}`, color: '#ccc' }).setOrigin(0.5);
    this.add.text(w/2, 300, "2. 防 御", { font: `24px ${GAME_FONT}`, color: '#fa0' }).setOrigin(0.5);
    this.add.text(w/2, 350, "！", { font: `60px ${GAME_FONT}`, color: '#f00' }).setOrigin(0.5);
    this.add.text(w/2, 400, "「！」が出たら即タップ！\n連打や早押しはペナルティ！", { font: `20px ${GAME_FONT}`, color: '#ccc', align:'center' }).setOrigin(0.5);
    this.createButton(w/2, h - 80, '次へ', 0xcc3333, () => this.showPage2());
  }

  showPage2() {
    this.children.removeAll();
    this.createGameBackground('shop');
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 50, "【チュートリアル 2/2】", { font: `28px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, 150, "強くなるには？", { font: `24px ${GAME_FONT}`, color: '#fa0' }).setOrigin(0.5);
    this.add.text(w/2, 220, "① 敵を倒してゴールドを獲得\n\n②「購買部」で強力な技を購入\n\n③「編成」で技を装備！\n(最大6つまで)", { font: `20px ${GAME_FONT}`, color: '#fff', align:'center' }).setOrigin(0.5);
    this.add.text(w/2, 350, "※ 技をセットしないと\n使えないので注意！", { font: `20px ${GAME_FONT}`, color: '#f88', align:'center' }).setOrigin(0.5);
    this.createButton(w/2, h - 80, 'ゲーム開始！', 0xcc3333, () => this.transitionTo('WorldScene'), true);
  }
}

// ================================================================
//  5. 職員室
// ================================================================
class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  create() {
    this.playBGM('bgm_world');
    this.fadeInScene(); 
    this.createGameBackground('world'); 
    const w = this.scale.width; const h = this.scale.height;
    this.createPanel(10, 10, w-20, 80);
    this.add.text(30, 30, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:`24px ${GAME_FONT}` });
    this.add.text(30, 60, `Gold: ${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' });
    const kato = this.add.sprite(w/2, h*0.35, 'kato').setScale(6); this.startIdleAnimation(kato);
    this.add.text(w/2, h*0.5, "「次はどうしますか？」", { font:`20px ${GAME_FONT}` }).setOrigin(0.5);
    
    let sn = "裏ボス";
    if (GAME_DATA.stageIndex < STAGES.length - 1) {
        sn = `Stage ${GAME_DATA.stageIndex+1}: ${STAGES[GAME_DATA.stageIndex].name}`;
    }

    this.createButton(w/2, h*0.65, '出撃する', 0xc33, () => this.transitionTo('BattleScene'), true);
    this.add.text(w/2, h*0.65 + 40, `(${sn})`, {font:`14px ${GAME_FONT}`, color:'#aaa'}).setOrigin(0.5);
    this.createButton(w/2, h*0.8, '購買部', 0x33c, () => this.transitionTo('ShopScene'));
    this.createButton(w/2, h*0.9, '編成', 0x282, () => this.transitionTo('SkillScene'));
  }
}

// ================================================================
//  6. 購買部 & 7. 編成
// ================================================================
class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.fadeInScene(); 
    this.createGameBackground('shop'); 
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 40, `購買部`, { font:`28px ${GAME_FONT}` }).setOrigin(0.5).setDepth(20);
    this.add.text(w/2, 70, `${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' }).setOrigin(0.5).setDepth(20);
    this.createButton(w/2, h-60, '戻る', 0x555, () => this.transitionTo('WorldScene')).setDepth(20);

    const skillList = SKILL_DB.filter(s => s.cost > 0);
    const itemHeight = 90;
    const contentHeight = skillList.length * itemHeight + 50;
    const container = this.initScrollView(contentHeight, 100, h - 180);

    let y = 50; 
    skillList.forEach((s) => {
        const has = GAME_DATA.player.ownedSkillIds.includes(s.id);
        const spec = (s.type === 'heal') ? `回復力:${s.power}` : `威力:${s.power} / 速度:${s.speed}`;
        const btn = this.createScrollableButton(w/2, y, s.name, has?0x333333:0x000000, () => {
            if(has) return;
            if(GAME_DATA.gold >= s.cost) { GAME_DATA.gold -= s.cost; GAME_DATA.player.ownedSkillIds.push(s.id); this.scene.restart(); }
            else { this.time.delayedCall(100, ()=>alert("ゴールドが足りません！")); }
        }, w-40, 75, `${s.desc}\n[${spec}]`);
        const priceTxt = this.add.text(w/2 + (w-40)/2 - 10, y, has?"済":`${s.cost}G`, {font:`22px ${GAME_FONT}`, color:'#ff0'}).setOrigin(1, 0.5);
        btn.add(priceTxt);
        if(has) btn.list[0].list[2].setColor('#888'); 
        container.add(btn);
        y += itemHeight;
    });
  }
}

class SkillScene extends BaseScene {
  constructor() { super('SkillScene'); }
  create() {
    this.fadeInScene(); 
    this.createGameBackground('skill'); 
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 40, "スキル編成", {font:`28px ${GAME_FONT}`}).setOrigin(0.5).setDepth(20);
    this.createButton(w/2, h-60, '完了', 0x555, () => this.transitionTo('WorldScene')).setDepth(20);

    const equipped = GAME_DATA.player.equippedSkillIds.map(id => ({...SKILL_DB.find(x=>x.id===id), isEquip:true}));
    const owned = GAME_DATA.player.ownedSkillIds.filter(id => !GAME_DATA.player.equippedSkillIds.includes(id)).map(id => ({...SKILL_DB.find(x=>x.id===id), isEquip:false}));
    const allItems = [...equipped, {isSeparator:true, text:"▼ 所持リスト"}, ...owned];
    const itemHeight = 70;
    const contentHeight = allItems.length * itemHeight + 50;
    const container = this.initScrollView(contentHeight, 90, h - 170);
    
    let y = 40;
    allItems.forEach((item, idx) => {
        if(item.isSeparator) {
            const sep = this.add.text(30, y, item.text, {font:`18px ${GAME_FONT}`, color:'#ff8'}); container.add(sep); y += 40;
        } else {
            const spec = (item.type === 'heal') ? `[回復:${item.power}]` : `[攻:${item.power}/速:${item.speed}]`;
            const color = item.isEquip ? 0x006600 : 0x444444;
            const btn = this.createScrollableButton(w/2, y, item.name, color, () => {
                if(item.isEquip) {
                    if(GAME_DATA.player.equippedSkillIds.length > 1) {
                        const index = GAME_DATA.player.equippedSkillIds.indexOf(item.id);
                        GAME_DATA.player.equippedSkillIds.splice(index, 1);
                        this.scene.restart();
                    }
                } else {
                    if(GAME_DATA.player.equippedSkillIds.length < 6) {
                        GAME_DATA.player.equippedSkillIds.push(item.id);
                        this.scene.restart();
                    }
                }
            }, w-60, 55, spec);
            container.add(btn);
            y += itemHeight;
        }
    });
  }
}

// ================================================================
//  新設シーン: NormalClear / SecretBossIntro / TrueClear
// ================================================================
class NormalClearScene extends BaseScene {
  constructor() { super('NormalClearScene'); }
  create() {
    this.fadeInScene();
    this.createGameBackground('world');
    const w = this.scale.width; const h = this.scale.height;
    
    this.add.text(w/2, h*0.3, "青田校長を撃破！\n青稜に平和が戻った...？", {font:`24px ${GAME_FONT}`, align:'center'}).setOrigin(0.5);
    
    this.createButton(w/2, h*0.6, '裏ボスに挑戦する', 0xcc0000, () => {
        this.sound.stopAll();
        this.transitionTo('SecretBossIntroScene');
    }, true);
  }
}

class SecretBossIntroScene extends BaseScene {
  constructor() { super('SecretBossIntroScene'); }
  create() {
    this.cameras.main.fadeIn(2000, 0, 0, 0);
    const w = this.scale.width; const h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x000000);

    const t1 = this.add.text(w/2, h*0.4, "学園を影から操る\n真の支配者...", {font:`28px ${GAME_FONT}`, color:'#f00', align:'center'}).setOrigin(0.5).setAlpha(0);
    const t2 = this.add.text(w/2, h*0.6, "金 月  降 臨", {font:`48px ${GAME_FONT}`, color:'#fff', align:'center'}).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: t1, alpha: 1, duration: 2000 });
    this.tweens.add({ targets: t2, alpha: 1, duration: 1000, delay: 2000, onComplete: () => {
        this.time.delayedCall(2000, () => this.transitionTo('BattleScene'));
    }});
  }
}

class TrueClearScene extends BaseScene {
  constructor() { super('TrueClearScene'); }
  create() {
    this.fadeInScene();
    const w = this.scale.width; const h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0xffffff); // 真っ白な背景

    this.add.text(w/2, h*0.3, "祝・完全制覇！", {font:`40px ${GAME_FONT}`, color:'#000', stroke:'#fff', strokeThickness:4}).setOrigin(0.5);
    this.add.text(w/2, h*0.5, "青稜中学校は\n加藤先生の手によって\n真の姿を取り戻した！\n\nThank you for playing!", {font:`24px ${GAME_FONT}`, color:'#000', align:'center'}).setOrigin(0.5);

    this.createButton(w/2, h*0.8, 'タイトルへ戻る', 0x555555, () => {
        location.reload(); // リロードして最初から
    });
  }
}

// ================================================================
//  8. バトルシーン (分岐対応)
// ================================================================
class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  create() {
    this.playBGM('bgm_battle');
    this.fadeInScene(); 
    
    // 裏ボスなら背景を変える
    const isSecret = (GAME_DATA.stageIndex >= STAGES.length - 1);
    this.createGameBackground(isSecret ? 'secret' : 'battle'); 
    
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
    this.perfectGuardChain = true; 
    this.refreshStatus();
  }

  refreshStatus() {
      this.phb.update(GAME_DATA.player.hp, GAME_DATA.player.maxHp);
      this.ehb.update(Math.max(0, this.ed.hp), this.ed.maxHp);
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
        
        if ((this.ed.hp - dmg) <= 0) {
            // WIN演出
            this.vibrate(1000); this.cameras.main.zoomTo(1.5, 1000, 'Power2', true); this.tweens.timeScale = 0.1;
            this.cameras.main.flash(1000, 255, 255, 255); this.playSound('se_attack');
            const winTxt = this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(0);
            this.tweens.add({ targets: winTxt, scale: 1.5, duration: 2000, ease: 'Elastic.Out' });
            
            this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus();
            this.time.delayedCall(1500, () => { this.tweens.timeScale = 1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); });
        } else {
            this.playSound('se_attack'); this.vibrate(v); this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, c);
            GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 5); this.checkEnd();
        }
    });
  }

  activateLimitBreak() {
    this.isPlayerTurn = false; GAME_DATA.player.stress = 0; 
    this.vibrate(1000); this.cameras.main.flash(500, 255, 0, 0); this.cameras.main.shake(500, 0.05);      
    this.updateMessage(`加藤先生の ブチギレ！\n「いい加減にしなさい！！」`);
    const dmg = Math.floor(GAME_DATA.player.atk * 150); 
    
    this.time.delayedCall(1000, () => { 
        if ((this.ed.hp - dmg) <= 0) {
             this.cameras.main.zoomTo(1.5, 200); this.tweens.timeScale = 0.1;
             this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(1.5);
             this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus();
             this.time.delayedCall(1500, () => { this.tweens.timeScale=1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); });
        } else {
             this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.checkEnd();
        }
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
    this.cameras.main.shake(100,0.01); this.vibrate(200);
    this.perfectGuardChain = false; 
  }

  startEnemyTurn() {
    this.qteMode = 'defense_wait'; this.guardBroken = false; this.px.setVisible(false); this.ps.clearTint();
    this.perfectGuardChain = true; 

    this.tweens.add({ targets: this.es, x: this.es.x + 20, duration: 500, ease: 'Power2' });

    let pattern = 0;
    const stage = GAME_DATA.stageIndex;

    if (stage <= 1) {
        pattern = (Math.random() < 0.8) ? 0 : 1; 
    } else if (stage <= 4) {
        const r = Math.random();
        if (r < 0.5) pattern = 0; else if (r < 0.8) pattern = 1; else pattern = 2;
    } else {
        const r = Math.random();
        if (r < 0.3) pattern = 0; else if (r < 0.7) pattern = 1; else pattern = 2;
    }

    if (pattern === 0) {
        this.updateMessage(`${this.ed.name} の攻撃！`);
        this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => this.launchAttack());
    } 
    else if (pattern === 1) {
        this.updateMessage(`${this.ed.name} の連続攻撃！`);
        this.rapidCount = 3;
        this.time.delayedCall(1000, () => this.launchRapidAttack());
    } 
    else {
        this.updateMessage(`${this.ed.name} が様子を見ている...`);
        this.time.delayedCall(1000, () => {
            this.tweens.add({ targets: this.es, x: this.es.x - 30, duration: 100, yoyo: true });
            this.time.delayedCall(1500, () => {
                this.updateMessage("不意打ちだ！");
                this.launchAttack();
            });
        });
    }
  }

  launchAttack() {
      if (this.guardBroken) { this.executeDefense(false); return; }
      this.qteMode = 'defense_active'; this.gs.setVisible(true);
      this.eat = this.tweens.add({
          targets: this.es, x: this.ps.x + 50, duration: 300, ease: 'Expo.In',
          onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } }
      });
  }

  launchRapidAttack() {
      if (this.rapidCount <= 0) {
          if (this.perfectGuardChain) this.triggerCounterAttack();
          else this.time.delayedCall(500, () => this.endEnemyTurn());
          return;
      }
      
      if (this.guardBroken) { this.executeDefense(false, true); return; }

      this.qteMode = 'defense_active'; this.gs.setVisible(true);
      this.eat = this.tweens.add({
          targets: this.es, x: this.ps.x + 50, duration: 250, ease: 'Expo.In',
          onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false, true); } }
      });
  }

  resolveDefenseQTE() {
    this.gs.setVisible(false); this.qteMode = null; if (this.eat) this.eat.stop();
    this.createImpactEffect(this.es.x - 30, this.es.y);
    this.cameras.main.flash(100, 255, 255, 255); 
    this.qtxt.setText("PARRY!!").setVisible(true).setScale(1);
    this.tweens.add({targets:this.qtxt, y:this.qtxt.y-50, alpha:0, duration:300, onComplete:()=>{this.qtxt.setVisible(false); this.qtxt.setAlpha(1); this.qtxt.y+=50;}});
    
    if (this.rapidCount > 0) this.executeDefense(true, true); else this.executeDefense(true, false);
  }

  executeDefense(suc, isRapid = false) {
    let dmg = Math.floor(this.ed.atk * (isRapid ? 0.6 : 1.0));
    
    if (suc) { 
        dmg = 0; this.playSound('se_parry'); this.vibrate(30); 
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 10);
        this.tweens.add({ targets: this.es, x: this.ebx, duration: 150, ease: 'Back.Out' });
    } else { 
        this.perfectGuardChain = false;
        this.showDamagePopup(this.ps.x, this.ps.y, dmg, false);
        GAME_DATA.player.hp -= dmg; this.cameras.main.shake(100, 0.02); this.vibrate(100); 
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 5);
        this.tweens.add({ targets: this.es, x: this.ebx, delay: 100, duration: 200, ease: 'Power2' });
    }
    
    this.qteMode = null;
    this.refreshStatus();
    
    if (GAME_DATA.player.hp <= 0) {
        this.updateMessage("敗北... (クリックで戻る)");
        this.input.once('pointerdown', () => { GAME_DATA.player.hp=GAME_DATA.player.maxHp; GAME_DATA.player.stress = 0; this.transitionTo('WorldScene'); });
    } else {
        if (isRapid) {
            this.rapidCount--;
            this.time.delayedCall(400, () => {
                if(!this.guardBroken) this.qteMode = 'defense_wait'; 
                this.launchRapidAttack();
            });
        } else {
            if (suc && this.perfectGuardChain) this.triggerCounterAttack();
            else this.time.delayedCall(1000, () => this.endEnemyTurn());
        }
    }
  }

  triggerCounterAttack() {
      this.time.delayedCall(200, () => {
          this.updateMessage("見切った！ カウンター！");
          this.playSwordAnimation(() => {
              let dmg = Math.floor(GAME_DATA.player.atk * 50 + this.ed.maxHp * 0.1);
              
              if ((this.ed.hp - dmg) <= 0) {
                  // --- WIN演出 ---
                  this.vibrate(1000); this.cameras.main.zoomTo(1.5, 1000, 'Power2', true); this.tweens.timeScale = 0.1;
                  this.cameras.main.flash(1000, 255, 255, 255); this.playSound('se_attack');
                  const winTxt = this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(0);
                  this.tweens.add({ targets: winTxt, scale: 1.5, duration: 2000, ease: 'Elastic.Out' });
                  
                  this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus();
                  this.time.delayedCall(1500, () => { this.tweens.timeScale = 1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); });
              } else {
                  this.ed.hp -= dmg;
                  this.showDamagePopup(this.es.x, this.es.y, dmg, true);
                  this.playSound('se_attack');
                  this.vibrate([50, 50, 100]);
                  this.refreshStatus();
                  this.time.delayedCall(1000, () => this.endEnemyTurn());
              }
          });
      });
  }

  endEnemyTurn() {
      this.isPlayerTurn = true; this.mm.setVisible(true); this.px.setVisible(false); this.ps.clearTint(); 
      this.updateMessage("ターン開始"); this.refreshStatus();
  }

  winBattle() {
    GAME_DATA.gold += this.ed.gold; GAME_DATA.player.exp += this.ed.exp; GAME_DATA.stageIndex++; 
    this.sound.stopAll(); this.playSound('se_win'); this.vibrate([100, 50, 100, 50, 200]); 
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
    this.input.once('pointerdown', () => {
        if(GAME_DATA.stageIndex === 6) this.transitionTo('NormalClearScene'); // 青田撃破後
        else if(GAME_DATA.stageIndex === 7) this.transitionTo('TrueClearScene'); // 金月撃破後
        else this.transitionTo('WorldScene');
    });
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
  scene: [OpeningScene, TutorialScene, WorldScene, ShopScene, SkillScene, BattleScene, NormalClearScene, SecretBossIntroScene, TrueClearScene]
};
new Phaser.Game(config);