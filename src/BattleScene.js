import { BaseScene } from './BaseScene.js';
import { GAME_DATA, STAGES, SKILL_DB, ITEM_DB, GAME_FONT, saveGame, getSkillPower } from './data.js';
import Phaser from 'phaser';

export class BattleScene extends BaseScene {
  constructor() { super('BattleScene'); }
  init(data) { 
      this.isTraining = data.isTraining || false; 
      this.isTutorial = data.isTutorial || false; 
  }
  create() {
    this.playBGM('bgm_battle');
    this.fadeInScene(); 
    const isSecret = (GAME_DATA.stageIndex >= STAGES.length - 1);
    this.createGameBackground(isSecret ? 'secret' : 'battle'); 
    
    const w = this.scale.width; const h = this.scale.height;
    this.tutorialFreeMode = false;

    // --- 敵データ生成 ---
    let enemy = null;
    if (this.isTutorial) {
        enemy = { ...STAGES[0], maxHp: 50, hp: 50, atk: 5, name: "練習用土蔵" }; 
    } else if (this.isTraining) {
        const maxIdx = Math.min(GAME_DATA.stageIndex, STAGES.length-1);
        const rndIdx = Phaser.Math.Between(0, maxIdx);
        enemy = { ...STAGES[0] }; 
        enemy.name = "練習用" + enemy.name; 
    } else {
        const idx = Math.min(GAME_DATA.stageIndex, STAGES.length-1);
        enemy = { ...STAGES[idx], maxHp: STAGES[idx].hp };
    }
    this.ed = enemy;
    this.ed.maxHp = this.ed.hp; 
    this.ed.status = null; 

    // --- キャラ配置 ---
    this.ps = this.add.sprite(w*0.25, h*0.55, 'kato').setScale(5); this.startIdleAnimation(this.ps);
    this.es = this.add.sprite(w*0.75, h*0.4, this.ed.key).setScale(5); this.startIdleAnimation(this.es);
    this.ebx = this.es.x; this.eby = this.es.y;

    // --- UIグループ化 (上部) ---
    this.topUI = this.add.container(0, 0);
    const topY = 40;
    
    const eName = this.add.text(w-20, topY, this.ed.name, {font:`20px ${GAME_FONT}`}).setOrigin(1, 0);
    this.ehb = this.createHpBar(w-170, topY+30, 150, 15, this.ed.hp, this.ed.maxHp); 
    
    const pName = this.add.text(20, topY, GAME_DATA.player.name, {font:`20px ${GAME_FONT}`});
    this.phb = this.createHpBar(20, topY+30, 150, 15, GAME_DATA.player.hp, GAME_DATA.player.maxHp);
    
    const sLabel = this.add.text(20, topY+55, "ストレス", {font:`14px ${GAME_FONT}`, color:'#fa0'});
    this.sb = this.createStressBar(80, topY+63, 90, 10); 
    this.apBar = this.createApBar(w/2 - 90, topY + 90);

    this.topUI.add([eName, this.ehb, pName, this.phb, sLabel, this.sb, this.apBar]);

    // --- チュートリアルスキップボタン ---
    if (this.isTutorial) {
        const skipBtn = this.add.container(w - 60, 90);
        const sBg = this.add.rectangle(0, 0, 100, 40, 0x555555).setStrokeStyle(1, 0xffffff);
        const sTxt = this.add.text(0, 0, "SKIP >>", { font: `16px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
        const sHit = this.add.rectangle(0, 0, 100, 40).setInteractive();
        sHit.on('pointerdown', () => {
            this.vibrate(20);
            if(this.tutorialLayer) this.tutorialLayer.setVisible(false);
            this.ed.hp = 0;
            this.winBattle();
        });
        skipBtn.add([sBg, sTxt, sHit]);
        skipBtn.setDepth(3000);
        this.topUI.add(skipBtn);
    }

    // --- 下部UI ---
    this.createMessageBox(w, h); 
    this.mm = this.add.container(0, 0);
    const cmdY = h - 230; 
    
    this.btnPos = {
        cmd: { x: w/2 - 85, y: cmdY },
        item: { x: w/2 + 85, y: cmdY },
        lb: { x: w/2 - 85, y: cmdY + 75 },
        pass: { x: w/2 + 85, y: cmdY + 75 }
    };

    this.btnCmd = this.createButton(this.btnPos.cmd.x, this.btnPos.cmd.y, 'コマンド', 0xc33, () => this.openSkillMenu());
    this.mm.add(this.btnCmd);
    this.mm.add(this.createButton(this.btnPos.item.x, this.btnPos.item.y, 'アイテム', 0x383, () => this.openItemMenu()));
    this.lb = this.createButton(this.btnPos.lb.x, this.btnPos.lb.y, 'ブチギレ', 0xf00, () => this.activateLimitBreak(), 160, 60, true);
    this.lb.setVisible(false); this.mm.add(this.lb);
    this.mm.add(this.createButton(this.btnPos.pass.x, this.btnPos.pass.y, 'パス', 0x555, () => this.skipTurn())); 

    // --- QTE UI ---
    this.qt = this.add.graphics().setDepth(100); this.qr = this.add.graphics().setDepth(100);
    this.qtxt = this.add.text(w/2, h/2-100, '', {font:`40px ${GAME_FONT}`, color:'#ff0', stroke:'#000', strokeThickness:4}).setOrigin(0.5).setDepth(101);
    this.gs = this.add.text(w/2, h/2, '！', {font:`80px ${GAME_FONT}`, color:'#f00', stroke:'#fff', strokeThickness:6}).setOrigin(0.5).setVisible(false).setDepth(101);
    
    // this.px (×印) は削除済み

    this.createSkillMenu(w, h);
    this.createItemMenu(w, h);
    
    // チュートリアルレイヤー
    this.tutorialLayer = this.add.container(0, 0).setDepth(2000).setVisible(false);
    this.tutorialOverlay = this.add.rectangle(w/2, h/2, w*2, h*2, 0x000000, 0.7).setInteractive();
    this.guideRect = this.add.graphics();
    this.tutorialHand = this.add.text(0, 0, '👆', {fontSize:'40px'}).setOrigin(0.5, 0);
    this.guideZone = this.add.rectangle(0,0,100,100,0xff0000,0.01).setInteractive();
    this.tutorialLayer.add([this.tutorialOverlay, this.guideRect, this.tutorialHand, this.guideZone]);
    this.tutorialStep = 0;

    this.input.on('pointerdown', () => this.handleInput());
    this.updateMessage(`${this.ed.name} があらわれた！`);
    
    GAME_DATA.player.ap = 3; 
    this.isPlayerTurn = true; this.qteMode = null; this.qteActive = false;
    this.perfectGuardChain = true; 
    this.refreshStatus();

    if (this.isTutorial) {
        this.time.delayedCall(1000, () => this.startTutorialStep1());
    }
  }

  setCinematicMode(enabled) {
      this.topUI.setVisible(!enabled);
      this.msgContainer.setVisible(!enabled);
      if (enabled) {
          this.mm.setVisible(false);
      } else {
          if (this.isPlayerTurn) this.mm.setVisible(true);
      }
  }

  // --- チュートリアル ---
  startTutorialStep1() {
      this.tutorialStep = 1;
      this.updateMessage("まずは攻撃だ！\n「コマンド」をタップ！");
      this.showGuide(this.btnPos.cmd.x, this.btnPos.cmd.y, 160, 60, () => { this.openSkillMenu(); });
  }
  startTutorialStep2() {
      this.tutorialStep = 2;
      this.updateMessage("技を選ぼう！\n「出席確認」をタップ！");
      const x = this.scale.width * 0.25; const y = this.sm.y + 60; 
      this.showGuide(x, y, 160, 60, () => { const skill = this.skillButtons[0].skill; this.selectSkill(skill); });
  }
  startTutorialStep3() {
      this.tutorialStep = 3;
      this.tutorialLayer.setVisible(false);
      this.updateMessage("黄色い輪が重なる瞬間に\n画面をタップ！");
  }
  showGuide(x, y, w, h, callback) {
      this.tutorialLayer.setVisible(true);
      this.guideRect.clear();
      this.guideRect.lineStyle(4, 0xffff00, 1);
      this.guideRect.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
      this.tutorialHand.setPosition(x, y + 40);
      this.tweens.killTweensOf(this.tutorialHand);
      this.tweens.add({ targets: this.tutorialHand, y: y + 60, duration: 500, yoyo: true, repeat: -1 });
      this.guideZone.setPosition(x, y);
      this.guideZone.setDisplaySize(w, h);
      this.guideZone.setInteractive();
      this.guideZone.once('pointerdown', (pointer) => {
          pointer.event.stopPropagation(); this.tutorialLayer.setVisible(false); callback();
      });
  }

  // --- ロジック ---
  refreshStatus() {
      this.phb.update(GAME_DATA.player.hp, GAME_DATA.player.maxHp);
      this.ehb.update(Math.max(0, this.ed.hp), this.ed.maxHp);
      this.sb.update(GAME_DATA.player.stress, GAME_DATA.player.maxStress);
      this.apBar.update(GAME_DATA.player.ap);
      this.lb.setVisible(GAME_DATA.player.stress >= GAME_DATA.player.maxStress);
  }

  createSkillMenu(w, h) {
    this.sm = this.add.container(0, h-320).setVisible(false).setDepth(50);
    const bg = this.add.graphics().fillStyle(0x000, 0.9).lineStyle(2, 0xfff).fillRoundedRect(10, 0, w-20, 310, 10).strokeRoundedRect(10, 0, w-20, 310, 10);
    this.sm.add(bg);
    this.skillDescText = this.add.text(w/2, 25, "技を選択してください", {font:`16px ${GAME_FONT}`, color:'#ccc'}).setOrigin(0.5);
    this.sm.add(this.skillDescText);

    this.skillButtons = [];
    const eq = GAME_DATA.player.equippedSkillIds.map(id => SKILL_DB.find(s => s.id === id));
    eq.forEach((s, i) => {
        const x = w*0.25+(i%2)*(w*0.5); const y = 60 + Math.floor(i/2)*70;
        const c = this.add.container(x, y);
        const b = this.add.graphics();
        const t = this.add.text(0, -8, s.name, {font:`16px ${GAME_FONT}`, color:'#fff'}).setOrigin(0.5);
        let val = s.type === 'heal' ? `回復:${s.power}` : `威力:${s.power}`;
        if (s.status === 'burn') val += ' [炎上]';
        if (s.status === 'sleep') val += ' [眠り]';
        const sub = this.add.text(0, 12, `AP:${s.apCost}/${val}`, {font:`11px ${GAME_FONT}`, color:'#ff0'}).setOrigin(0.5);
        const hRect = this.add.rectangle(0,0,160,60).setInteractive();
        hRect.on('pointerdown', () => { 
            if (this.isTutorial && !this.tutorialFreeMode) return; 
            if (GAME_DATA.player.ap >= s.apCost) { this.input.stopPropagation(); this.vibrate(10); this.selectSkill(s); } else { this.vibrate(50); } 
        });
        c.add([b, t, sub, hRect]); this.sm.add(c);
        this.skillButtons.push({ container: c, bg: b, skill: s });
    });
    const bc = this.createBackButton(w, () => { 
        if(this.isTutorial && !this.tutorialFreeMode) return;
        this.sm.setVisible(false); this.mm.setVisible(true); 
    });
    this.sm.add(bc);
  }

  createItemMenu(w, h) {
      this.im = this.add.container(0, h-320).setVisible(false).setDepth(50);
      const bg = this.add.graphics().fillStyle(0x000, 0.9).lineStyle(2, 0xfff).fillRoundedRect(10, 0, w-20, 310, 10).strokeRoundedRect(10, 0, w-20, 310, 10);
      this.im.add(bg);
      const bc = this.createBackButton(w, () => { this.im.setVisible(false); this.mm.setVisible(true); });
      this.im.add(bc);
  }

  createBackButton(w, cb) {
      const c = this.add.container(w/2, 280);
      const b = this.add.graphics().fillStyle(0x555, 1).fillRoundedRect(-50,-20,100,40,5);
      const t = this.add.text(0,0,'戻る',{font:`16px ${GAME_FONT}`}).setOrigin(0.5);
      const h = this.add.rectangle(0,0,110,50).setInteractive();
      h.on('pointerdown', () => { this.input.stopPropagation(); this.vibrate(10); cb(); });
      c.add([b, t, h]); return c;
  }

  updateSkillMenu() {
      this.skillButtons.forEach(btn => {
          const canUse = (GAME_DATA.player.ap >= btn.skill.apCost);
          const color = canUse ? (btn.skill.type==='heal'?0x228822:0x882222) : 0x333333;
          btn.bg.clear().fillStyle(color, 1).lineStyle(2,0xffffff).fillRoundedRect(-75,-25,150,50,8).strokeRoundedRect(-75,-25,150,50,8);
          btn.container.setAlpha(canUse ? 1.0 : 0.5);
      });
  }

  openItemMenu() {
      if(!this.isPlayerTurn) return;
      if(this.isTutorial && !this.tutorialFreeMode) return; 
      this.mm.setVisible(false); this.im.setVisible(true);
      this.im.each(c => { if(c.list && c.y < 250) c.destroy(); }); 
      const items = Object.keys(GAME_DATA.player.items).map(id => {
          const count = GAME_DATA.player.items[id];
          if(count > 0) return { ...ITEM_DB.find(i=>i.id==id), count: count };
          return null;
      }).filter(i=>i);
      if(items.length === 0) { const t = this.add.text(this.scale.width/2, 150, "アイテムを持っていません", {font:`20px ${GAME_FONT}`, color:'#aaa'}).setOrigin(0.5); this.im.add(t); } 
      else {
          items.forEach((it, i) => {
              const y = 50 + i * 60; const c = this.add.container(this.scale.width/2, y);
              const b = this.add.graphics().fillStyle(0x333388, 1).lineStyle(1,0xfff).fillRoundedRect(-150,-25,300,50,5).strokeRoundedRect(-150,-25,300,50,5);
              const t = this.add.text(0, 0, `${it.name} (x${it.count})`, {font:`18px ${GAME_FONT}`}).setOrigin(0.5);
              const h = this.add.rectangle(0,0,300,50).setInteractive();
              h.on('pointerdown', () => { this.input.stopPropagation(); this.useItem(it); });
              c.add([b, t, h]); this.im.add(c);
          });
      }
  }

  useItem(it) {
      this.im.setVisible(false);
      GAME_DATA.player.items[it.id]--;
      this.updateMessage(`${it.name} を使った！`);
      if(it.type === 'ap_full') { GAME_DATA.player.ap = GAME_DATA.player.maxAp; this.refreshStatus(); this.showApPopup(this.ps.x, this.ps.y - 50); this.time.delayedCall(1000, () => { this.mm.setVisible(true); this.updateMessage("コマンド選択"); }); } 
      else if (it.type === 'enemy_sleep') { this.ed.status = 'sleep'; this.showStatusPopup(this.es.x, this.es.y - 50, "居眠り付与！"); this.time.delayedCall(1000, () => this.endEnemyTurn()); } 
      else if (it.type === 'enemy_burn') { this.ed.status = 'burn'; this.showStatusPopup(this.es.x, this.es.y - 50, "炎上付与！"); this.time.delayedCall(1000, () => this.endEnemyTurn()); }
      if(it.type !== 'ap_full') this.time.delayedCall(1000, () => this.startEnemyTurn());
  }

  handleInput() {
    if (this.qteMode === 'attack' && this.qteActive) this.resolveAttackQTE();
    else if (this.qteMode === 'defense_wait') this.triggerGuardPenalty();
    else if (this.qteMode === 'defense_active') this.resolveDefenseQTE();
  }

  openSkillMenu() { 
      if(this.isPlayerTurn) { 
          this.vibrate(10); this.updateSkillMenu(); this.mm.setVisible(false); this.openWindowAnimation(this.sm); this.updateMessage("行動を選択"); 
          if(this.isTutorial && this.tutorialStep === 1) { this.time.delayedCall(300, () => this.startTutorialStep2()); }
      } 
  }
  
  selectSkill(s) { 
      GAME_DATA.player.ap -= s.apCost; this.refreshStatus(); this.sm.setVisible(false); this.selS = s; 
      if (s.type === 'heal') this.executeHeal(s); 
      else {
          if (this.isTutorial && this.tutorialStep === 2) this.startTutorialStep3();
          this.setCinematicMode(true);
          this.cameras.main.zoomTo(1.2, 200, 'Sine.easeInOut');
          this.startAttackQTE(s); 
      }
  }

  skipTurn() {
      if(this.isPlayerTurn && (!this.isTutorial || this.tutorialFreeMode)) {
          this.isPlayerTurn = false; this.mm.setVisible(false);
          this.showApPopup(this.ps.x, this.ps.y - 50);
          GAME_DATA.player.ap = Math.min(GAME_DATA.player.maxAp, GAME_DATA.player.ap + 1);
          this.refreshStatus(); this.updateMessage("ターンをパスした");
          this.time.delayedCall(1000, () => this.startEnemyTurn());
      }
  }

  playSwordAnimation(cb) {
      const animType = this.selS ? this.selS.anim : 'normal';
      const s = this.add.graphics(); 
      s.setDepth(200);

      let isFinished = false;
      const finish = () => {
          if(isFinished) return;
          isFinished = true;
          if(s && s.scene) s.destroy();
          if(cb) cb();
      };

      try {
          if (animType === 'check') {
              s.lineStyle(8, 0x00ff00); s.beginPath(); const startX = this.es.x - 40; const startY = this.es.y; s.moveTo(startX, startY);
              this.tweens.addCounter({ 
                  from: 0, to: 100, duration: 300, 
                  onUpdate: (tw) => { 
                      if(!s.scene) return;
                      s.clear(); s.lineStyle(8, 0x00ff00); s.beginPath(); s.moveTo(startX, startY); 
                      const p = tw.getValue(); 
                      if(p < 40) s.lineTo(startX + p, startY + p); 
                      else { s.lineTo(startX + 40, startY + 40); s.lineTo(startX + 40 + (p-40)*1.5, startY + 40 - (p-40)*2.5); } 
                      s.strokePath(); 
                  }, 
                  onComplete: () => { this.createImpactEffect(this.es.x, this.es.y); finish(); } 
              });
          } else if (animType === 'chalk') {
              const chalk = this.add.rectangle(this.ps.x, this.ps.y, 40, 10, 0xffffff).setDepth(200);
              this.tweens.add({ targets: chalk, x: this.es.x, y: this.es.y, angle: 360, duration: 300, ease: 'Linear', onComplete: () => { chalk.destroy(); this.createImpactEffect(this.es.x, this.es.y); finish(); } });
          } else if (animType === 'book') {
              const book = this.add.rectangle(this.es.x, this.es.y - 300, 80, 100, 0x3366cc).setStrokeStyle(4, 0xffffff).setDepth(200);
              this.tweens.add({ targets: book, y: this.es.y, angle: 20, duration: 400, ease: 'Bounce.Out', onComplete: () => { this.cameras.main.shake(100, 0.05); book.destroy(); this.createImpactEffect(this.es.x, this.es.y); finish(); } });
          } else if (animType === 'food') {
              const h1 = this.add.text(this.ps.x, this.ps.y, "🍞", {fontSize:'40px'}).setDepth(200); 
              const h2 = this.add.text(this.ps.x, this.ps.y, "🥛", {fontSize:'40px'}).setDepth(200);
              this.tweens.add({ targets: h1, y: this.ps.y-100, x: this.ps.x-30, alpha: 0, duration: 800, onComplete:()=>h1.destroy() }); 
              this.tweens.add({ targets: h2, y: this.ps.y-100, x: this.ps.x+30, alpha: 0, duration: 800, delay: 200, onComplete: () => { h2.destroy(); finish(); } });
          } else if (animType === 'run') {
              let completeCount = 0;
              for(let i=0; i<5; i++) { 
                  const d = this.add.circle(this.es.x + (Math.random()-0.5)*100, this.es.y+50, 15, 0xaaaaaa, 0.8).setDepth(200); 
                  this.tweens.add({ 
                      targets: d, scale: 2, alpha: 0, y: d.y-50, duration: 600, delay: i*100, 
                      onComplete: () => { 
                          d.destroy(); completeCount++;
                          if(completeCount === 5) finish(); 
                      } 
                  }); 
              }
          } else if (animType === 'rapid') {
              s.clear(); 
              this.tweens.addCounter({ from: 0, to: 5, duration: 400, 
                  onUpdate: (tw) => { 
                      if(!s.scene) return;
                      const val = tw.getValue(); 
                      const ox = (Math.random()-0.5)*100; const oy = (Math.random()-0.5)*100; 
                      s.clear().lineStyle(2, 0xffffff).beginPath().moveTo(this.es.x+ox, this.es.y+oy).lineTo(this.es.x-ox, this.es.y-oy).strokePath(); 
                  }, 
                  onComplete: () => { s.destroy(); this.createImpactEffect(this.es.x, this.es.y); finish(); } 
              });
          } else if (animType === 'heavy') {
              s.fillStyle(0xffaa00, 1).fillCircle(0,0,50); s.y -= 200; s.x = this.ps.x; 
              this.tweens.add({ targets: s, x: this.es.x, y: this.es.y, duration: 300, ease: 'Bounce.Out', onComplete: () => { s.destroy(); this.cameras.main.shake(100,0.05); this.createImpactEffect(this.es.x, this.es.y); finish(); } });
          } else if (animType === 'magic') {
              s.lineStyle(4, 0x00ff00).strokeCircle(0,0,10); s.x = this.ps.x; s.y = this.ps.y; 
              this.tweens.add({ targets: s, scale: 5, alpha: 0, duration: 500, onComplete: () => { s.destroy(); finish(); } });
          } else {
              s.fillStyle(0x00ffff, 0.8).lineStyle(2, 0xffffff, 1); s.x = this.ps.x; s.y = this.ps.y; 
              s.beginPath(); s.moveTo(0,0); s.lineTo(20, -100); s.lineTo(40, 0); s.closePath(); s.fillPath(); s.angle = -30; 
              this.tweens.chain({ 
                  targets: s, 
                  tweens: [ 
                      { angle: -60, duration: 200, ease: 'Back.Out' }, 
                      { angle: 120, x: this.es.x-30, y: this.es.y, duration: 150, ease: 'Quad.In', onComplete: () => { this.createImpactEffect(this.es.x, this.es.y); s.destroy(); finish(); } } 
                  ] 
              });
          }
      } catch(e) {
          console.error("Anim error", e);
          finish(); 
      }
  }

  startAttackQTE(s) {
    this.isPlayerTurn = false; 
    if(this.isTutorial) this.updateMessage("黄色い輪が重なる瞬間に\n画面をタップ！");
    else this.updateMessage(`${s.name}！\nタイミング！`);
    const tx = this.es.x; const ty = this.es.y;
    this.qt.clear().lineStyle(4, 0xffffff).strokeCircle(tx, ty, 50).setVisible(true);
    this.qr.clear().lineStyle(4, 0xffff00).strokeCircle(tx, ty, 50 * 2.5);
    this.qrs = 2.5;
    this.qteMode = 'attack';
    this.time.delayedCall(200, () => {
        this.qteActive = true;
        this.qe = this.time.addEvent({ delay: 16, loop: true, callback: () => {
            if (!this.qteActive) return;
            this.qrs -= (0.03 * s.speed);
            this.qr.clear().lineStyle(4, 0xffff00).strokeCircle(tx, ty, 50 * this.qrs);
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
        this.cameras.main.zoomTo(1.0, 200);
        this.setCinematicMode(false);

        let power = 10;
        try { power = getSkillPower(this.selS); } catch(e) { power = this.selS.power; }
        
        let dmg = power * GAME_DATA.player.atk;
        
        let v = 50; let c = false;
        if (res==='PERFECT') { dmg = Math.floor(dmg*1.5); v = [50, 50, 300]; this.cameras.main.shake(300, 0.04); this.hitStop(200); this.damageFlash(this.es); c = true; } 
        else if (res!=='GOOD') { dmg = Math.floor(dmg*0.5); v = 20; }
        else if (res==='MISS') { dmg = 0; }
        if(this.isTutorial && dmg===0) dmg = 10;

        if ((this.ed.hp - dmg) <= 0) {
            this.createExplosion(this.es.x, this.es.y);
            this.vibrate(1000); this.cameras.main.zoomTo(1.5, 1000, 'Power2', true); this.tweens.timeScale = 0.1;
            this.cameras.main.flash(1000, 255, 255, 255); this.playSound('se_attack');
            const winTxt = this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(0);
            this.tweens.add({ targets: winTxt, scale: 1.5, duration: 2000, ease: 'Elastic.Out' });
            this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus();
            this.time.delayedCall(1500, () => { this.tweens.timeScale = 1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); });
        } else {
            if(dmg>0) { this.playSound('se_attack'); this.damageFlash(this.es); }
            this.vibrate(v); this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, c);
            if (this.selS.status) {
                this.ed.status = this.selS.status;
                const txt = this.selS.status==='sleep'?"居眠り": "炎上";
                this.showStatusPopup(this.es.x, this.es.y - 50, txt+"付与!");
            }
            GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 5); this.checkEnd();
        }
    });
  }

  activateLimitBreak() {
      this.isPlayerTurn = false; GAME_DATA.player.stress = 0; 
      this.refreshStatus(); this.vibrate(1000); 
      this.setCinematicMode(true);
      const bg = this.add.rectangle(this.scale.width/2, this.scale.height/2, this.scale.width, this.scale.height, 0x000000).setDepth(290).setAlpha(0);
      this.tweens.add({ targets: bg, alpha: 0.8, duration: 200 });
      if(!this.textures.exists('kato_cutin')) this.createTextureFromText('kato_cutin', ARTS.kato_cutin);
      const cutin = this.add.sprite(-200, this.scale.height/2, 'kato_cutin').setScale(15).setDepth(300);
      this.tweens.chain({ targets: cutin, tweens: [ { x: this.scale.width/2, duration: 300, ease: 'Back.Out' }, { scale: 18, duration: 1000 }, { x: this.scale.width + 300, duration: 200, ease: 'Quad.In', onComplete: () => { bg.destroy(); cutin.destroy(); } } ] });
      this.time.delayedCall(500, () => { this.cameras.main.flash(500, 255, 0, 0); this.cameras.main.shake(500, 0.05); this.updateMessage(`加藤先生の ブチギレ！\n「いい加減にしなさい！！」`); });
      this.time.delayedCall(2000, () => { 
          const baseDmg = GAME_DATA.player.atk * 100; const percDmg = this.ed.maxHp * 0.2; const dmg = Math.floor(baseDmg + percDmg); 
          this.selS = { anim: 'heavy' };
          this.playSwordAnimation(() => {
              this.hitStop(300); this.damageFlash(this.es);
              this.setCinematicMode(false);
              if ((this.ed.hp - dmg) <= 0) { this.createExplosion(this.es.x, this.es.y); this.cameras.main.zoomTo(1.5, 200); this.tweens.timeScale = 0.1; this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(1.5); this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus(); this.time.delayedCall(1500, () => { this.tweens.timeScale=1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); }); } 
              else { this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.checkEnd(); }
          });
      });
  }

  executeHeal(s) {
    this.isPlayerTurn = false; 
    let h = 10;
    try { h = getSkillPower(s); } catch(e) { h = s.power; }
    
    GAME_DATA.player.hp = Math.min(GAME_DATA.player.hp + h, GAME_DATA.player.maxHp);
    const ht = this.add.text(this.ps.x, this.ps.y-50, `+${h}`, { font:`32px ${GAME_FONT}`, color:'#0f0', stroke:'#000', strokeThickness:4}).setOrigin(0.5);
    this.tweens.add({ targets: ht, y: ht.y-50, alpha: 0, duration: 1000, onComplete:()=>ht.destroy() });
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
    if (this.ed.status === 'burn') { const dmg = Math.floor(this.ed.maxHp * 0.05); this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, false); this.showStatusPopup(this.es.x, this.es.y - 80, "炎上ダメージ"); this.damageFlash(this.es); this.refreshStatus(); if (this.ed.hp <= 0) { this.winBattle(); return; } }
    if (this.ed.status === 'sleep') { this.ed.status = null; this.showStatusPopup(this.es.x, this.es.y - 50, "Zzz..."); this.updateMessage(`${this.ed.name} は眠っている`); this.time.delayedCall(1500, () => this.endEnemyTurn()); return; }

    this.qteMode = 'defense_wait'; this.guardBroken = false; this.px.setVisible(false); this.ps.clearTint();
    this.perfectGuardChain = true; 
    
    // 【強化】攻撃前の予備動作（後ろに少し下がる）
    this.tweens.add({ targets: this.es, x: this.ebx + 30, duration: 400, ease: 'Power1' });

    if(this.isTutorial) {
        this.updateMessage("敵の攻撃だ！\n「！」が出たらタップ！");
        this.time.delayedCall(2000, () => this.launchAttack());
    } else {
        let pattern = 0; const stage = GAME_DATA.stageIndex; const rnd = Math.random();
        if (stage <= 1) { pattern = rnd < 0.8 ? 0 : 1; } 
        else if (stage <= 3) { if (rnd < 0.5) pattern = 0; else if (rnd < 0.7) pattern = 1; else pattern = 2; } 
        else { if (rnd < 0.3) pattern = 0; else if (rnd < 0.5) pattern = 1; else if (rnd < 0.7) pattern = 2; else if (rnd < 0.85) pattern = 3; else pattern = 4; }

        if (pattern === 0) { this.updateMessage(`${this.ed.name} の攻撃！`); this.time.delayedCall(Phaser.Math.Between(1000, 2000), () => this.launchAttack()); } 
        else if (pattern === 1) { this.updateMessage(`${this.ed.name} の連続攻撃！`); this.rapidCount = 3; this.time.delayedCall(1000, () => this.launchRapidAttack()); } 
        else if (pattern === 2) { this.updateMessage(`${this.ed.name} が様子を見ている...`); this.time.delayedCall(1000, () => { this.tweens.add({ targets: this.es, x: this.es.x - 30, duration: 100, yoyo: true }); this.time.delayedCall(1500, () => { this.updateMessage("不意打ちだ！"); this.launchAttack(); }); }); }
        else if (pattern === 3) { this.currentAttackType = 'status'; this.updateMessage(`${this.ed.name} の怪しい動き...！`); this.time.delayedCall(1500, () => this.launchStatusAttack()); }
        else if (pattern === 4) { this.updateMessage(`${this.ed.name} が構えた！`); this.time.delayedCall(1000, () => this.launchDelayAttack()); }
    }
  }

  // ★攻撃開始：ランダムでアニメーション変化
  launchAttack() {
      if (this.guardBroken) { this.executeDefense(false); return; }
      this.qteMode = 'defense_active'; this.gs.setVisible(true);
      this.setCinematicMode(true);
      this.cameras.main.zoomTo(1.1, 200);

      const rndAnim = Math.random();
      if (rndAnim < 0.33) {
          // ジャンプ攻撃
          this.tweens.chain({
              targets: this.es,
              tweens: [
                  { y: this.es.y - 150, duration: 300, ease: 'Power1' }, 
                  { y: this.ps.y, x: this.ps.x + 50, duration: 200, ease: 'Bounce.Out', onStart: () => { if(this.qteMode==='defense_active') this.gs.setVisible(false); this.executeDefense(false); } }
              ]
          });
          this.eat = { stop: () => this.tweens.killTweensOf(this.es) };
      } else if (rndAnim < 0.66) {
          // 回転アタック
          this.eat = this.tweens.add({
              targets: this.es, x: this.ps.x + 50, angle: 360, duration: 400, ease: 'Linear',
              onComplete: () => { this.es.angle = 0; if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } }
          });
      } else {
          // 通常
          this.eat = this.tweens.add({
              targets: this.es, x: this.ps.x + 50, duration: this.isTutorial ? 600 : 300, 
              ease: 'Expo.In',
              onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } }
          });
      }
  }

  launchRapidAttack() { 
      if (this.rapidCount <= 0) { if (this.perfectGuardChain) this.triggerCounterAttack(); else this.time.delayedCall(500, () => this.endEnemyTurn()); return; } 
      if (this.guardBroken) { this.executeDefense(false, true); return; } 
      this.qteMode = 'defense_active'; this.gs.setVisible(true); 
      this.setCinematicMode(true);
      this.cameras.main.zoomTo(1.1, 200);
      this.eat = this.tweens.add({ targets: this.es, x: this.ps.x + 50, duration: 250, ease: 'Expo.In', onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false, true); } } }); 
  }
  launchStatusAttack() { 
      if (this.guardBroken) { this.executeDefense(false); return; } 
      this.qteMode = 'defense_active'; this.gs.setVisible(true); this.es.setTint(0xff00ff); 
      this.setCinematicMode(true);
      this.cameras.main.zoomTo(1.1, 200);
      this.eat = this.tweens.add({ targets: this.es, x: this.ps.x + 50, duration: 500, ease: 'Quad.InOut', onComplete: () => { this.es.clearTint(); if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } } }); 
  }
  launchDelayAttack() { 
      if (this.guardBroken) { this.executeDefense(false); return; } 
      this.qteMode = 'defense_active'; this.gs.setVisible(true); 
      this.setCinematicMode(true);
      this.cameras.main.zoomTo(1.1, 200);
      this.tweens.add({ targets: this.es, x: this.ps.x + 150, duration: 400, ease: 'Quad.Out', onComplete: () => { this.time.delayedCall(Phaser.Math.Between(400, 1000), () => { if (this.guardBroken) return; this.eat = this.tweens.add({ targets: this.es, x: this.ps.x + 50, duration: 100, ease: 'Expo.In', onComplete: () => { if (this.qteMode === 'defense_active') { this.gs.setVisible(false); this.executeDefense(false); } } }); }); } }); 
  }

  resolveDefenseQTE() {
    this.gs.setVisible(false); this.qteMode = null; 
    if (this.eat) { 
        if(this.eat.stop) this.eat.stop(); 
        this.tweens.killTweensOf(this.es); 
    }
    this.createImpactEffect(this.es.x - 30, this.es.y);
    this.cameras.main.flash(100, 255, 255, 255); 
    this.qtxt.setText("PARRY!!").setVisible(true).setScale(1);
    this.tweens.add({targets:this.qtxt, y:this.qtxt.y-50, alpha:0, duration:300, onComplete:()=>{this.qtxt.setVisible(false); this.qtxt.setAlpha(1); this.qtxt.y+=50;}});
    this.cameras.main.zoomTo(1.0, 200);
    if (this.rapidCount <= 0) this.setCinematicMode(false);

    if (this.rapidCount > 0) this.executeDefense(true, true); else this.executeDefense(true, false);
  }

  executeDefense(suc, isRapid = false) {
    let dmg = Math.floor(this.ed.atk * (isRapid ? 0.6 : 1.0));
    if(this.isTutorial && !suc && dmg >= GAME_DATA.player.hp) { dmg = GAME_DATA.player.hp - 1; }

    if (suc) { 
        dmg = 0; this.playSound('se_parry'); this.vibrate(30); 
        GAME_DATA.player.ap = Math.min(GAME_DATA.player.maxAp, GAME_DATA.player.ap + 1);
        this.showApPopup(this.ps.x, this.ps.y - 50);
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 10);
        this.tweens.add({ targets: this.es, x: this.ebx, y: this.eby, angle: 0, duration: 150, ease: 'Back.Out' });
    } else { 
        this.damageFlash(this.ps);
        this.cameras.main.zoomTo(1.0, 200);
        this.setCinematicMode(false);
        this.perfectGuardChain = false;
        if (this.currentAttackType === 'status') { const rnd = Math.random(); if (rnd < 0.5) { GAME_DATA.player.status = 'burn'; this.showStatusPopup(this.ps.x, this.ps.y - 50, "炎上した！"); } else { GAME_DATA.player.status = 'sleep'; this.showStatusPopup(this.ps.x, this.ps.y - 50, "眠らされた！"); } }
        this.showDamagePopup(this.ps.x, this.ps.y, dmg, false);
        GAME_DATA.player.hp -= dmg; this.cameras.main.shake(100, 0.02); this.vibrate(100); 
        GAME_DATA.player.stress = Math.min(100, GAME_DATA.player.stress + 5);
        this.tweens.add({ targets: this.es, x: this.ebx, y: this.eby, angle: 0, delay: 100, duration: 200, ease: 'Power2' });
    }
    
    this.qteMode = null; this.es.clearTint(); this.refreshStatus();
    
    if (GAME_DATA.player.hp <= 0) {
        this.updateMessage("敗北... (クリックで戻る)");
        this.input.once('pointerdown', () => { GAME_DATA.player.hp=GAME_DATA.player.maxHp; GAME_DATA.player.stress = 0; this.transitionTo('WorldScene'); });
    } else {
        if (isRapid) {
            this.rapidCount--;
            this.time.delayedCall(400, () => { if(!this.guardBroken) this.qteMode = 'defense_wait'; this.launchRapidAttack(); });
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
              this.hitStop(300); this.damageFlash(this.es);
              this.setCinematicMode(false);
              this.cameras.main.zoomTo(1.0, 200); 

              if ((this.ed.hp - dmg) <= 0) { this.vibrate(1000); this.cameras.main.zoomTo(1.5, 1000, 'Power2', true); this.tweens.timeScale = 0.1; this.cameras.main.flash(1000, 255, 255, 255); this.playSound('se_attack'); const winTxt = this.add.text(this.scale.width/2, this.scale.height/2, "WIN!!!", { font: `80px ${GAME_FONT}`, color: '#ffcc00', stroke:'#000', strokeThickness:8 }).setOrigin(0.5).setDepth(300).setScale(0); this.tweens.add({ targets: winTxt, scale: 1.5, duration: 2000, ease: 'Elastic.Out' }); this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.refreshStatus(); this.time.delayedCall(1500, () => { this.tweens.timeScale = 1.0; this.cameras.main.zoomTo(1.0, 500); this.winBattle(); }); } 
              else { this.ed.hp -= dmg; this.showDamagePopup(this.es.x, this.es.y, dmg, true); this.playSound('se_attack'); this.vibrate([50, 50, 100]); this.refreshStatus(); this.time.delayedCall(1000, () => this.endEnemyTurn()); }
          });
      });
  }

  endEnemyTurn() {
      if (GAME_DATA.player.status === 'burn') { const dmg = Math.floor(GAME_DATA.player.maxHp * 0.05); GAME_DATA.player.hp -= dmg; this.showDamagePopup(this.ps.x, this.ps.y, dmg, false); this.showStatusPopup(this.ps.x, this.ps.y - 80, "炎上中..."); this.damageFlash(this.ps); this.refreshStatus(); if (GAME_DATA.player.hp <= 0) { this.updateMessage("敗北... (クリックで戻る)"); this.input.once('pointerdown', () => { GAME_DATA.player.hp=GAME_DATA.player.maxHp; GAME_DATA.player.stress = 0; this.transitionTo('WorldScene'); }); return; } }
      if (GAME_DATA.player.status === 'sleep') { GAME_DATA.player.status = null; this.showStatusPopup(this.ps.x, this.ps.y - 50, "Zzz...(行動不能)"); this.updateMessage("眠っていて動けない！"); this.time.delayedCall(1500, () => this.startEnemyTurn()); return; }

      this.isPlayerTurn = true; 
      GAME_DATA.player.ap = Math.min(GAME_DATA.player.maxAp, GAME_DATA.player.ap + 1);
      this.showApPopup(this.ps.x, this.ps.y - 50);
      this.mm.setVisible(true); this.px.setVisible(false); this.ps.clearTint(); 
      
      this.setCinematicMode(false);
      this.cameras.main.zoomTo(1.0, 500); 

      if(this.isTutorial) {
          this.updateMessage("さあ、反撃だ！\n好きなように戦え！");
          this.tutorialLayer.setVisible(false); 
          this.tutorialFreeMode = true;
      } else {
          this.updateMessage("ターン開始"); 
      }
      this.refreshStatus();
  }

  winBattle() {
    GAME_DATA.gold += this.ed.gold; GAME_DATA.player.exp += this.ed.exp; 
    
    if(!this.isTraining && !this.isTutorial) GAME_DATA.stageIndex++; 
    
    this.sound.stopAll(); this.playSound('se_win'); this.vibrate([100, 50, 100, 50, 200]); 
    let msg = `勝利！\n${this.ed.gold}G 獲得`;
    if (Math.random() < 0.2 && !GAME_DATA.player.ownedSkillIds.includes(7)) { GAME_DATA.player.ownedSkillIds.push(7); msg += "\nレア技【居残り指導】習得！"; }
    if (GAME_DATA.player.exp >= GAME_DATA.player.nextExp) { GAME_DATA.player.level++; GAME_DATA.player.maxHp+=20; GAME_DATA.player.hp = GAME_DATA.player.maxHp; GAME_DATA.player.atk += 0.2; GAME_DATA.player.nextExp = Math.floor(GAME_DATA.player.nextExp * 1.5); msg += "\nレベルアップ！"; }
    
    this.updateMessage(msg + "\n(クリックで次へ)");
    this.mm.setVisible(false);
    saveGame(); 

    this.input.once('pointerdown', () => {
        if(!this.isTraining && GAME_DATA.stageIndex === 12) this.transitionTo('NormalClearScene');
        else if(!this.isTraining && GAME_DATA.stageIndex === 13) this.transitionTo('TrueClearScene');
        else this.transitionTo('WorldScene');
    });
  }

  createMessageBox(w, h) {
      this.msgContainer = this.add.container(0, 0);
      const panel = this.createPanel(10, h-100, w-20, 90);
      this.messageText = this.add.text(30, h-85, '', {font:`18px ${GAME_FONT}`, wordWrap:{width:w-60}});
      this.msgContainer.add([panel, this.messageText]);
  }
  updateMessage(t) { this.messageText.setText(t); }
}