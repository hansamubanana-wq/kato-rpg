import { BaseScene } from './BaseScene.js';
import { GAME_DATA, SKILL_DB, ITEM_DB, STAGES, GAME_FONT, saveGame, resetGame } from './data.js';
import Phaser from 'phaser';

export class OpeningScene extends BaseScene {
  constructor() { super('OpeningScene'); }
  create() {
    this.fadeInScene(); 
    this.playBGM('bgm_world');
    const w = this.scale.width; const h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0x000000);

    this.add.text(w/2, h*0.2, "私立青稜中学校", { font: `32px ${GAME_FONT}`, color: '#aaa' }).setOrigin(0.5);
    this.add.text(w/2, h*0.28, "ＲＰＧ", { font: `60px ${GAME_FONT}`, color: '#fff', stroke:'#00f', strokeThickness:6 }).setOrigin(0.5);

    const storyText = `
突如巻き起こった
『反抗期パンデミック』

荒廃した学園に
一人の男が立ち上がる。

数学教師・加藤。

「私が規律を取り戻す！！」
    `;

    const textObj = this.add.text(w/2, h + 100, storyText, { 
        font: `20px ${GAME_FONT}`, color: '#ffff00', align: 'center', wordWrap: { width: w - 40 }
    }).setOrigin(0.5, 0);

    this.tweens.add({
        targets: textObj, y: h*0.4, duration: 15000, ease: 'Linear',
        onComplete: () => {}
    });

    this.createButton(w/2, h - 140, 'START', 0xcc3333, () => this.transitionTo('TutorialScene'), 200, 60);

    // ★ここを修正しました！
    const installBtn = this.add.text(w/2, h - 50, "【アプリとして保存する方法】", { font: `16px ${GAME_FONT}`, color: '#0ff', underline: true }).setOrigin(0.5).setInteractive();
    installBtn.on('pointerdown', () => {
        const modal = this.add.container(0, 0).setDepth(100);
        modal.add(this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.95).setInteractive());
        
        // LINE対策を入れた説明文
        const helpText = `
⚠ LINEから開いている人へ ⚠
今のままだと保存できません！
まずは「ブラウザ」で開き直してね。
(iPhoneは右下の🧭 / Androidは右上の︙)

【ホーム画面に追加する方法】
🍎 iPhone (Safari)
下の「共有」ボタン(四角から↑)
→「ホーム画面に追加」

🤖 Android (Chrome)
右上のメニュー「︙」
→「アプリをインストール」
または「ホーム画面に追加」

これで全画面で遊べます！
        `;
        
        modal.add(this.add.text(w/2, h/2, helpText, { font: `18px ${GAME_FONT}`, color: '#fff', align: 'center', wordWrap:{width:w-40}, lineSpacing: 8 }).setOrigin(0.5));
        
        const closeBtn = this.add.rectangle(w/2, h - 80, 150, 50, 0x555555).setInteractive();
        const closeTxt = this.add.text(w/2, h - 80, "閉じる", { font: `20px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
        closeBtn.on('pointerdown', () => modal.destroy());
        modal.add([closeBtn, closeTxt]);
    });
  }
}

export class TutorialScene extends BaseScene {
  constructor() { super('TutorialScene'); }
  create() {
    this.transitionTo('BattleScene', { isTutorial: true });
  }
}

export class WorldScene extends BaseScene {
  constructor() { super('WorldScene'); }
  create() {
    this.playBGM('bgm_world');
    this.fadeInScene(); 
    this.createGameBackground('world'); 
    const w = this.scale.width; const h = this.scale.height;
    this.createPanel(10, 10, w-20, 80);
    this.add.text(30, 30, `Lv:${GAME_DATA.player.level} ${GAME_DATA.player.name}`, { font:`24px ${GAME_FONT}` });
    this.add.text(30, 60, `Gold: ${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' });
    
    const kato = this.add.sprite(w/2, h*0.32, 'kato').setScale(6); this.startIdleAnimation(kato);
    this.add.text(w/2, h*0.46, "「次はどうしますか？」", { font:`20px ${GAME_FONT}` }).setOrigin(0.5);
    
    let sn = "裏ボス";
    if (GAME_DATA.stageIndex < STAGES.length - 1) {
        sn = `Stage ${GAME_DATA.stageIndex+1}: ${STAGES[GAME_DATA.stageIndex].name}`;
    }
    
    this.createButton(w/2, h*0.58, '出撃する', 0xc33, () => this.transitionTo('BattleScene', {isTraining: false}), 220, 50, true);
    this.add.text(w/2, h*0.58 + 40, `(${sn})`, {font:`14px ${GAME_FONT}`, color:'#aaa'}).setOrigin(0.5);
    
    this.createButton(w/2, h*0.70, 'プチレーブ', 0x33c, () => this.transitionTo('ShopScene'));
    this.createButton(w/2, h*0.80, '編成', 0x282, () => this.transitionTo('SkillScene'));
    this.createButton(w/2, h*0.90, '補習 (Gold稼ぎ)', 0x886600, () => this.transitionTo('BattleScene', {isTraining: true}));
    
    saveGame();
  }
}

export class ShopScene extends BaseScene {
  constructor() { super('ShopScene'); }
  create() {
    this.fadeInScene(); 
    this.createGameBackground('shop'); 
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 40, `プチレーブ`, { font:`28px ${GAME_FONT}` }).setOrigin(0.5).setDepth(20);
    this.add.text(w/2, 70, `${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' }).setOrigin(0.5).setDepth(20);
    this.createButton(w/2, h-60, '戻る', 0x555, () => this.transitionTo('WorldScene')).setDepth(20);

    this.mode = 'skill';
    this.createTabs(w, h);
    this.refreshList(w, h);
  }

  createTabs(w, h) {
      this.tabContainer = this.add.container(0, 110);
      const tabW = w / 2 - 20; const tabH = 50;

      this.btnSkill = this.add.container(w/4 + 5, 0);
      this.bgSkill = this.add.graphics().fillRoundedRect(-tabW/2, -tabH/2, tabW, tabH, 10);
      this.textSkill = this.add.text(0, 0, "技", {font:`24px ${GAME_FONT}`}).setOrigin(0.5);
      const hitSkill = this.add.rectangle(0,0,tabW,tabH).setInteractive();
      this.btnSkill.add([this.bgSkill, this.textSkill, hitSkill]);

      this.btnItem = this.add.container(w*3/4 - 5, 0);
      this.bgItem = this.add.graphics().fillRoundedRect(-tabW/2, -tabH/2, tabW, tabH, 10);
      this.textItem = this.add.text(0, 0, "道具", {font:`24px ${GAME_FONT}`}).setOrigin(0.5);
      const hitItem = this.add.rectangle(0,0,tabW,tabH).setInteractive();
      this.btnItem.add([this.bgItem, this.textItem, hitItem]);

      hitSkill.on('pointerdown', () => { this.mode='skill'; this.updateTabStyle(); this.refreshList(w, h); this.playSound('se_select'); });
      hitItem.on('pointerdown', () => { this.mode='item'; this.updateTabStyle(); this.refreshList(w, h); this.playSound('se_select'); });

      this.tabContainer.add([this.btnSkill, this.btnItem]);
      this.updateTabStyle();
  }

  updateTabStyle() {
      const activeColor = 0x3333cc; const inactiveColor = 0x222222;
      this.bgSkill.clear().fillStyle(this.mode==='skill' ? activeColor : inactiveColor, 1).lineStyle(2, 0xffffff).fillRoundedRect(-this.btnSkill.list[2].width/2, -this.btnSkill.list[2].height/2, this.btnSkill.list[2].width, this.btnSkill.list[2].height, 10).strokeRoundedRect(-this.btnSkill.list[2].width/2, -this.btnSkill.list[2].height/2, this.btnSkill.list[2].width, this.btnSkill.list[2].height, 10);
      this.textSkill.setColor(this.mode==='skill' ? '#ffffff' : '#aaaaaa');
      this.bgItem.clear().fillStyle(this.mode==='item' ? activeColor : inactiveColor, 1).lineStyle(2, 0xffffff).fillRoundedRect(-this.btnItem.list[2].width/2, -this.btnItem.list[2].height/2, this.btnItem.list[2].width, this.btnItem.list[2].height, 10).strokeRoundedRect(-this.btnItem.list[2].width/2, -this.btnItem.list[2].height/2, this.btnItem.list[2].width, this.btnItem.list[2].height, 10);
      this.textItem.setColor(this.mode==='item' ? '#ffffff' : '#aaaaaa');
  }

  refreshList(w, h) {
      if(this.listContainer) this.listContainer.destroy();
      let items = [];
      if(this.mode === 'skill') items = SKILL_DB.filter(s => s.cost > 0);
      else items = ITEM_DB;

      const itemHeight = 90;
      const contentHeight = items.length * itemHeight + 50;
      this.listContainer = this.initScrollView(contentHeight, 150, h - 230);
      let y = 50; 
      items.forEach((item) => {
          let has = false; let spec = ""; let rightText = "";
          if(this.mode === 'skill') {
              has = GAME_DATA.player.ownedSkillIds.includes(item.id);
              spec = `${item.desc}\n[威力:${item.power} / AP:${item.apCost}]`;
              rightText = has ? "済" : `${item.cost}G`;
          } else {
              const count = GAME_DATA.player.items[item.id] || 0;
              spec = item.desc;
              rightText = `${item.cost}G\n(所持:${count})`;
          }
          const btn = this.createScrollableButton(w/2, y, item.name, has?0x333333:0x000000, () => {
              if(this.mode === 'skill') {
                  if(has) return;
                  if(GAME_DATA.gold >= item.cost) { GAME_DATA.gold -= item.cost; GAME_DATA.player.ownedSkillIds.push(item.id); saveGame(); this.scene.restart(); } else { this.time.delayedCall(100, ()=>alert("ゴールドが足りません！")); }
              } else {
                  if(GAME_DATA.gold >= item.cost) { GAME_DATA.gold -= item.cost; if(!GAME_DATA.player.items[item.id]) GAME_DATA.player.items[item.id] = 0; GAME_DATA.player.items[item.id]++; saveGame(); this.scene.restart(); } else { this.time.delayedCall(100, ()=>alert("ゴールドが足りません！")); }
              }
          }, w-40, 75, spec, rightText);
          
          if(this.mode === 'skill' && has) { btn.list[0].list[2].setColor('#888'); if(btn.rightTextObj) btn.rightTextObj.setColor('#888'); }
          this.listContainer.add(btn); y += itemHeight;
      });
  }
}

export class SkillScene extends BaseScene {
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
            const spec = (item.type === 'heal') ? `[AP:${item.apCost}]` : `[AP:${item.apCost}/速:${item.speed}]`;
            const color = item.isEquip ? 0x006600 : 0x444444;
            const btn = this.createScrollableButton(w/2, y, item.name, color, () => {
                if(item.isEquip) {
                    if(GAME_DATA.player.equippedSkillIds.length > 1) {
                        const index = GAME_DATA.player.equippedSkillIds.indexOf(item.id);
                        GAME_DATA.player.equippedSkillIds.splice(index, 1);
                        saveGame(); this.scene.restart();
                    }
                } else {
                    if(GAME_DATA.player.equippedSkillIds.length < 6) {
                        GAME_DATA.player.equippedSkillIds.push(item.id);
                        saveGame(); this.scene.restart();
                    }
                }
            }, w-60, 55, spec);
            container.add(btn);
            y += itemHeight;
        }
    });
  }
}

export class NormalClearScene extends BaseScene {
  constructor() { super('NormalClearScene'); }
  create() {
    this.fadeInScene();
    this.createGameBackground('world');
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, h*0.3, "青田校長を撃破！\n青稜に平和が戻った...？", {font:`24px ${GAME_FONT}`, align:'center'}).setOrigin(0.5);
    this.createButton(w/2, h*0.6, '裏ボスに挑戦する', 0xcc0000, () => {
        this.sound.stopAll(); this.transitionTo('SecretBossIntroScene');
    }, 220, 50, true);
  }
}

export class SecretBossIntroScene extends BaseScene {
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

export class TrueClearScene extends BaseScene {
  constructor() { super('TrueClearScene'); }

  create() {
    this.sound.stopAll();
    this.playSound('se_win');
    this.time.delayedCall(2000, () => {
        this.playBGM('bgm_world');
    });

    this.cameras.main.fadeIn(2000, 255, 255, 255);
    const w = this.scale.width;
    const h = this.scale.height;

    // 1. 背景：平和な青空と校舎
    this.createGameBackground('world');
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x88ccff, 0x88ccff, 0xffffff, 0xffffff, 1);
    sky.fillRect(0, 0, w, h * 0.6);
    sky.setDepth(-50);

    // 2. エフェクト：紙吹雪
    if (!this.textures.exists('particle_confetti')) {
        const cvs = document.createElement('canvas'); cvs.width=4; cvs.height=4;
        const ctx = cvs.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,4,4);
        this.textures.addCanvas('particle_confetti', cvs);
    }
    const emitter = this.add.particles(0, 0, 'particle_confetti', {
        x: { min: 0, max: w },
        y: -50,
        lifespan: 4000,
        gravityY: 50, speedX: { min: -20, max: 20 },
        scale: { start: 1.5, end: 0.5 },
        rotate: { min: 0, max: 360 },
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff],
        quantity: 2, frequency: 100
    });
    emitter.setDepth(-10);

    // 3. キャラクター集合
    const charaY = h * 0.65;
    const chars = [];

    // ステージの敵キャラを並べる（一部除く）
    let bossCount = 0;
    STAGES.forEach((stage, i) => {
        if (stage.key !== 'dozo' && stage.key !== 'kingetsu') { 
             const spr = this.add.sprite(w * 0.1 + (i%5) * 50, charaY - Math.floor(i/5)*30, stage.key).setScale(3.5).setAlpha(0.9);
             this.startIdleAnimation(spr);
             chars.push(spr);
        }
    });

    // 主人公（中央）
    const kato = this.add.sprite(w/2, charaY - 40, 'kato').setScale(8);
    this.startIdleAnimation(kato);
    chars.push(kato);

    chars.forEach((c, i) => {
        const targetY = c.y;
        c.y += 300;
        this.tweens.add({
            targets: c, y: targetY, duration: 1500, ease: 'Back.Out', delay: 500 + i * 50
        });
    });

    // 4. テキスト
    const titleText = this.add.text(w/2, h*0.15, "祝・完全制覇！", {
        font:`48px ${GAME_FONT}`, color:'#ffcc00', stroke:'#000', strokeThickness:6
    }).setOrigin(0.5).setScale(0).setDepth(100);

    this.tweens.add({ targets: titleText, scale: 1, duration: 1200, ease: 'Elastic.Out', delay: 2000 });

    const message = 
`青稜中学校に、真の平和が訪れた。

反抗期パンデミックは収束し、
生徒たちの笑顔が戻ってきた。

これも全て、
加藤先生の熱い指導のおかげである。

Thank you for playing!`;

    const msgText = this.add.text(w/2, h*0.45, message, {
        font:`20px ${GAME_FONT}`, color:'#fff', stroke:'#000', strokeThickness:3, align:'center', lineSpacing: 12
    }).setOrigin(0.5, 0).setAlpha(0).setDepth(100);

    this.tweens.add({ targets: msgText, alpha: 1, y: h*0.4, duration: 2500, delay: 3500 });

    // 5. 戻るボタン
    this.time.delayedCall(7000, () => {
        const btn = this.createButton(w/2, h*0.9, 'タイトルへ戻る', 0x555555, () => {
            this.cameras.main.fadeOut(1000, 0,0,0);
            this.cameras.main.once('camerafadeoutcomplete', () => { location.reload(); });
        }, 200, 50).setAlpha(0);
        this.tweens.add({ targets: btn, alpha: 1, duration: 1000 });
    });

    this.cameras.main.zoomTo(1.05, 15000, 'Linear', true);
  }
}