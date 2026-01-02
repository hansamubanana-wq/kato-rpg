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

    const storyText = `
私立青稜中学校。

自由な校風で知られるこの名門校に
突如として『教育崩壊現象』が巻き起こった。

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

    this.createButton(w/2, h - 120, 'SKIP >>', 0x555555, () => this.transitionTo('TutorialScene'));
    this.createButton(w/2, h - 50, 'データ消去して最初から', 0x880000, () => resetGame());
  }
}

export class TutorialScene extends BaseScene {
  constructor() { super('TutorialScene'); }
  create() {
    this.fadeInScene(); this.createGameBackground('skill');
    this.page = 1;
    this.showPage1();
  }

  showPage1() {
    this.children.removeAll(); 
    this.createGameBackground('skill');
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 50, "【チュートリアル 1/3】", { font: `28px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
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
    this.add.text(w/2, 50, "【チュートリアル 2/3】", { font: `28px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    
    // 【修正1】Y座標を調整して重なりを解消
    this.add.text(w/2, 130, "強くなるには？", { font: `24px ${GAME_FONT}`, color: '#fa0' }).setOrigin(0.5);
    this.add.text(w/2, 240, "① 敵を倒してゴールドを獲得\n\n②「購買部」で強力な技や\nアイテムを購入\n\n③「編成」で技を装備！\n(最大6つまで)", { font: `20px ${GAME_FONT}`, color: '#fff', align:'center' }).setOrigin(0.5);
    this.add.text(w/2, 380, "※ 技をセットしないと\n使えないので注意！", { font: `20px ${GAME_FONT}`, color: '#f88', align:'center' }).setOrigin(0.5);
    
    this.createButton(w/2, h - 80, '次へ', 0xcc3333, () => this.showPage3());
  }

  showPage3() {
    this.children.removeAll();
    this.createGameBackground('battle');
    const w = this.scale.width; const h = this.scale.height;
    this.add.text(w/2, 50, "【チュートリアル 3/3】", { font: `28px ${GAME_FONT}`, color: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, 120, "AP (行動力) について", { font: `24px ${GAME_FONT}`, color: '#ff0' }).setOrigin(0.5);
    this.add.rectangle(w/2, 170, 200, 20, 0x333333).setStrokeStyle(1, 0x888888);
    this.add.rectangle(w/2-30, 170, 140, 16, 0xffff00);
    this.add.text(w/2, 220, "技を使うにはAPが必要です。\n強い技ほど多くのAPを消費します。", { font: `18px ${GAME_FONT}`, color: '#ccc', align:'center' }).setOrigin(0.5);
    this.add.text(w/2, 300, "＜APの回復方法＞", { font: `20px ${GAME_FONT}`, color: '#fa0' }).setOrigin(0.5);
    this.add.text(w/2, 360, "・自分のターンが来る (+1)\n・敵の攻撃をパリィする (+1)\n・「パス」コマンドを使う (+1)", { font: `20px ${GAME_FONT}`, color: '#fff', align:'left' }).setOrigin(0.5);
    
    // 【修正2】ボタンの幅(w)を220に指定して広げる
    this.createButton(w/2, h - 80, 'ゲーム開始！', 0xcc3333, () => this.transitionTo('WorldScene'), 220, 50, true);
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
    this.createButton(w/2, h*0.70, '購買部', 0x33c, () => this.transitionTo('ShopScene'));
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
    this.add.text(w/2, 40, `購買部`, { font:`28px ${GAME_FONT}` }).setOrigin(0.5).setDepth(20);
    this.add.text(w/2, 70, `${GAME_DATA.gold} G`, { font:`20px ${GAME_FONT}`, color:'#ff0' }).setOrigin(0.5).setDepth(20);
    this.createButton(w/2, h-60, '戻る', 0x555, () => this.transitionTo('WorldScene')).setDepth(20);

    this.mode = 'skill';
    this.createTabs(w, h);
    this.refreshList(w, h);
  }

  // 【修正3】タブのデザインをボタン形式に変更して目立たせる
  createTabs(w, h) {
      this.tabContainer = this.add.container(0, 110);
      
      const tabW = w / 2 - 20;
      const tabH = 50;

      // 技タブボタン
      this.btnSkill = this.add.container(w/4 + 5, 0);
      this.bgSkill = this.add.graphics().fillRoundedRect(-tabW/2, -tabH/2, tabW, tabH, 10);
      this.textSkill = this.add.text(0, 0, "技", {font:`24px ${GAME_FONT}`}).setOrigin(0.5);
      const hitSkill = this.add.rectangle(0,0,tabW,tabH).setInteractive();
      this.btnSkill.add([this.bgSkill, this.textSkill, hitSkill]);

      // 道具タブボタン
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
      const activeColor = 0x3333cc;
      const inactiveColor = 0x222222;
      
      this.bgSkill.clear().fillStyle(this.mode==='skill' ? activeColor : inactiveColor, 1).lineStyle(2, 0xffffff).fillRoundedRect(-this.btnSkill.list[2].width/2, -this.btnSkill.list[2].height/2, this.btnSkill.list[2].width, this.btnSkill.list[2].height, 10).strokeRoundedRect(-this.btnSkill.list[2].width/2, -this.btnSkill.list[2].height/2, this.btnSkill.list[2].width, this.btnSkill.list[2].height, 10);
      this.textSkill.setColor(this.mode==='skill' ? '#ffffff' : '#aaaaaa');

      this.bgItem.clear().fillStyle(this.mode==='item' ? activeColor : inactiveColor, 1).lineStyle(2, 0xffffff).fillRoundedRect(-this.btnItem.list[2].width/2, -this.btnItem.list[2].height/2, this.btnItem.list[2].width, this.btnItem.list[2].height, 10).strokeRoundedRect(-this.btnItem.list[2].width/2, -this.btnItem.list[2].height/2, this.btnItem.list[2].width, this.btnItem.list[2].height, 10);
      this.textItem.setColor(this.mode==='item' ? '#ffffff' : '#aaaaaa');
  }

  refreshList(w, h) {
      if(this.listContainer) this.listContainer.destroy();
      
      let items = [];
      if(this.mode === 'skill') {
          items = SKILL_DB.filter(s => s.cost > 0);
      } else {
          items = ITEM_DB;
      }

      const itemHeight = 90;
      const contentHeight = items.length * itemHeight + 50;
      this.listContainer = this.initScrollView(contentHeight, 150, h - 230);

      let y = 50; 
      items.forEach((item) => {
          let has = false;
          let spec = "";
          let rightText = "";
          
          if(this.mode === 'skill') {
              has = GAME_DATA.player.ownedSkillIds.includes(item.id);
              spec = (item.type === 'heal') ? `回復:${item.power}/AP:${item.apCost}` : `威力:${item.power}/AP:${item.apCost}`;
              rightText = has ? "済" : `${item.cost}G`;
          } else {
              const count = GAME_DATA.player.items[item.id] || 0;
              spec = item.desc;
              rightText = `${item.cost}G\n(所持:${count})`;
          }
          
          const btn = this.createScrollableButton(w/2, y, item.name, has?0x333333:0x000000, () => {
              if(this.mode === 'skill') {
                  if(has) return;
                  if(GAME_DATA.gold >= item.cost) { 
                      GAME_DATA.gold -= item.cost; 
                      GAME_DATA.player.ownedSkillIds.push(item.id); 
                      saveGame(); this.scene.restart(); 
                  } else { this.time.delayedCall(100, ()=>alert("ゴールドが足りません！")); }
              } else {
                  if(GAME_DATA.gold >= item.cost) {
                      GAME_DATA.gold -= item.cost;
                      if(!GAME_DATA.player.items[item.id]) GAME_DATA.player.items[item.id] = 0;
                      GAME_DATA.player.items[item.id]++;
                      saveGame(); this.scene.restart();
                  } else { this.time.delayedCall(100, ()=>alert("ゴールドが足りません！")); }
              }
          }, w-40, 75, spec, rightText);
          
          if(this.mode === 'skill' && has) {
              btn.list[0].list[2].setColor('#888'); 
              if(btn.rightTextObj) btn.rightTextObj.setColor('#888');
          }
          
          this.listContainer.add(btn);
          y += itemHeight;
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
    this.fadeInScene();
    const w = this.scale.width; const h = this.scale.height;
    this.add.rectangle(w/2, h/2, w, h, 0xffffff); 
    this.add.text(w/2, h*0.3, "祝・完全制覇！", {font:`40px ${GAME_FONT}`, color:'#000', stroke:'#fff', strokeThickness:4}).setOrigin(0.5);
    this.add.text(w/2, h*0.5, "青稜中学校は\n加藤先生の手によって\n真の姿を取り戻した！\n\nThank you for playing!", {font:`24px ${GAME_FONT}`, color:'#000', align:'center'}).setOrigin(0.5);
    this.createButton(w/2, h*0.8, 'タイトルへ戻る', 0x555555, () => { location.reload(); });
  }
}